using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Sonnaille.Tests;

/// <summary>HTTP contract: the same GeoJSON as the web app's content/observations.geojson.</summary>
public class SightingsEndpointsTests : IClassFixture<WebApplicationFactory<Program>>
{
    private const string ModeratorKey = "test-moderator-key";
    private readonly HttpClient _client;

    public SightingsEndpointsTests(WebApplicationFactory<Program> factory) =>
        _client = factory.WithWebHostBuilder(b => b.UseSetting("Moderation:Key", ModeratorKey)).CreateClient();

    private static object Flock(double lon = 5.65, double lat = 45.11) => new
    {
        type = "Feature",
        geometry = new { type = "Point", coordinates = new[] { lon, lat } },
        properties = new { observedAt = "2026-07-15T07:30:00.000Z", species = "donkeys", headcount = "few", guardDogs = true },
    };

    private static object Nest(string kind) => new
    {
        type = "Feature",
        geometry = new { type = "Point", coordinates = new[] { 5.7, 45.2 } },
        properties = new { observedAt = "2026-07-15T07:30:00.000Z", kind },
    };

    private async Task<string> Submit(object feature)
    {
        var response = await _client.PostAsJsonAsync("/api/sightings", feature);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<JsonObject>();
        Assert.Equal("pending", body!["status"]!.GetValue<string>());
        return body["id"]!.GetValue<string>();
    }

    private Task<HttpResponseMessage> Moderate(HttpMethod method, string url, string? key = ModeratorKey)
    {
        var request = new HttpRequestMessage(method, url);
        if (key is not null) request.Headers.Add("X-Moderator-Key", key);
        return _client.SendAsync(request);
    }

    private async Task<JsonArray> PublishedFeatures()
    {
        var collection = await _client.GetFromJsonAsync<JsonObject>("/api/sightings");
        Assert.Equal("FeatureCollection", collection!["type"]!.GetValue<string>());
        return collection["features"]!.AsArray();
    }

    [Fact]
    public async Task A_submitted_sighting_is_not_public_until_approved()
    {
        var id = await Submit(Flock());

        Assert.DoesNotContain(await PublishedFeatures(), f => f!["id"]!.GetValue<string>() == id);
        Assert.Equal(HttpStatusCode.NoContent, (await Moderate(HttpMethod.Post, $"/api/sightings/{id}/approve")).StatusCode);

        var feature = (await PublishedFeatures()).Single(f => f!["id"]!.GetValue<string>() == id)!;
        Assert.Equal(
            """{"observedAt":"2026-07-15T07:30:00.000Z","species":"donkeys","headcount":"few","guardDogs":true}""",
            feature["properties"]!.ToJsonString());
        Assert.Equal("[5.65,45.11]", feature["geometry"]!["coordinates"]!.ToJsonString());
    }

    [Fact]
    public async Task A_nest_is_published_with_its_kind_only()
    {
        var id = await Submit(Nest("hornet-nest"));
        await Moderate(HttpMethod.Post, $"/api/sightings/{id}/approve");

        var feature = (await PublishedFeatures()).Single(f => f!["id"]!.GetValue<string>() == id)!;
        Assert.Equal("""{"observedAt":"2026-07-15T07:30:00.000Z","kind":"hornet-nest"}""", feature["properties"]!.ToJsonString());
    }

    [Fact]
    public async Task An_invalid_sighting_is_refused_with_its_reasons()
    {
        var response = await _client.PostAsJsonAsync("/api/sightings", Flock(lon: 500));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<JsonObject>();
        Assert.Contains("longitude: out of range", body!["errors"]!.AsArray().Select(e => e!.GetValue<string>()));
    }

    [Fact]
    public async Task Free_text_and_unknown_kinds_are_refused()
    {
        var withText = new
        {
            type = "Feature",
            geometry = new { type = "Point", coordinates = new[] { 5.6, 45.1 } },
            properties = new { observedAt = "2026-07-15T07:30:00Z", kind = "hornet-nest", comment = "le chien du berger X" },
        };

        Assert.Equal(HttpStatusCode.BadRequest, (await _client.PostAsJsonAsync("/api/sightings", withText)).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await _client.PostAsJsonAsync("/api/sightings", Nest("wolf"))).StatusCode);
    }

    [Fact]
    public async Task Moderation_needs_the_moderator_key()
    {
        var id = await Submit(Nest("beehives"));

        Assert.Equal(HttpStatusCode.Unauthorized, (await Moderate(HttpMethod.Post, $"/api/sightings/{id}/approve", key: null)).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await Moderate(HttpMethod.Post, $"/api/sightings/{id}/approve", key: "guess")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await Moderate(HttpMethod.Get, "/api/sightings/pending", key: null)).StatusCode);
    }

    [Fact]
    public async Task Moderators_see_pending_sightings()
    {
        var id = await Submit(Nest("wasp-nest"));

        var response = await Moderate(HttpMethod.Get, "/api/sightings/pending");
        var pending = (await response.Content.ReadFromJsonAsync<JsonObject>())!["features"]!.AsArray();

        Assert.Contains(pending, f => f!["id"]!.GetValue<string>() == id);
    }

    [Fact]
    public async Task Approving_an_unknown_sighting_is_not_found() =>
        Assert.Equal(HttpStatusCode.NotFound, (await Moderate(HttpMethod.Post, $"/api/sightings/{Guid.NewGuid()}/approve")).StatusCode);
}

public class ModerationWithoutKeyTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    [Fact]
    public async Task Without_a_configured_key_moderation_stays_closed()
    {
        var client = factory.CreateClient();
        var request = new HttpRequestMessage(HttpMethod.Get, "/api/sightings/pending");
        request.Headers.Add("X-Moderator-Key", "");

        Assert.Equal(HttpStatusCode.Unauthorized, (await client.SendAsync(request)).StatusCode);
    }
}
