using System.Net;
using System.Net.Http.Json;
using System.Text.Json.Nodes;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Sonnaille.Application;

namespace Sonnaille.Tests;

/// <summary>GET /api/zones: the zones of the day, in the GeoJSON the web app already reads (docs/format-zones.md).</summary>
public class ZonesEndpointsTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    private (HttpClient Client, IServiceProvider Services, FakeMapPatou MapPatou) Start(bool refresh)
    {
        var mapPatou = new FakeMapPatou();
        var app = factory.WithWebHostBuilder(b =>
        {
            b.UseSetting("Zones:Refresh", refresh ? "true" : "false");
            b.ConfigureTestServices(services =>
            {
                services.AddSingleton<IMapPatou>(mapPatou);
                services.AddSingleton<TimeProvider>(new ManualClock(new DateTimeOffset(2026, 7, 15, 3, 0, 0, TimeSpan.Zero)));
            });
        });
        return (app.CreateClient(), app.Services, mapPatou);
    }

    [Fact]
    public async Task Says_the_zones_are_unavailable_before_the_first_fetch()
    {
        var (client, _, _) = Start(refresh: false);

        Assert.Equal(HttpStatusCode.ServiceUnavailable, (await client.GetAsync("/api/zones")).StatusCode);
    }

    [Fact]
    public async Task Serves_the_zones_of_the_day_with_their_source()
    {
        var (client, services, _) = Start(refresh: false);
        await services.GetRequiredService<ZoneService>().Refresh();

        var collection = (await client.GetFromJsonAsync<JsonObject>("/api/zones"))!;

        Assert.Equal("FeatureCollection", collection["type"]!.GetValue<string>());
        Assert.Equal(
            """{"source":"Map Patou — Réseau Pastoral AuRA","requestedDate":"2026-07-15","fetchedAt":"2026-07-15T03:00:00.000Z"}""",
            collection["metadata"]!.ToJsonString(new System.Text.Json.JsonSerializerOptions { Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping }));
        var feature = collection["features"]![0]!;
        Assert.Equal("Q1", feature["id"]!.GetValue<string>());
        Assert.Equal("MultiPolygon", feature["geometry"]!["type"]!.GetValue<string>());
        Assert.Equal("[[[[5.6,45.1],[5.65,45.1],[5.65,45.15],[5.6,45.1]]]]", feature["geometry"]!["coordinates"]!.ToJsonString());
        Assert.Equal(
            """{"name":"Alpage Q1","quarter":"Quartier Q1","presence":{"start":"2026-06-15","end":"2026-09-30","species":["sheep"],"guardDogs":true,"weekdays":[1,2,3,4,5,6,7]}}""",
            feature["properties"]!.ToJsonString());
    }

    [Fact]
    public async Task Fetches_the_zones_by_itself_once_started()
    {
        var (client, _, mapPatou) = Start(refresh: true);

        HttpResponseMessage response;
        var waited = 0;
        do
        {
            response = await client.GetAsync("/api/zones");
            if (response.IsSuccessStatusCode) break;
            await Task.Delay(50);
        } while ((waited += 50) < 3000);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal([new DateOnly(2026, 7, 15)], mapPatou.Requests);
    }
}
