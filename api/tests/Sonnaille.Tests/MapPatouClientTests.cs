using System.Net;
using System.Text.Json.Nodes;
using Sonnaille.Application;
using Sonnaille.Domain;
using Sonnaille.Infrastructure;

namespace Sonnaille.Tests;

public class MapPatouClientTests
{
    private sealed class RecordingHandler(HttpStatusCode status, string body) : HttpMessageHandler
    {
        public HttpRequestMessage? Request { get; private set; }
        public string? RequestBody { get; private set; }

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Request = request;
            RequestBody = request.Content is null ? null : await request.Content.ReadAsStringAsync(cancellationToken);
            return new HttpResponseMessage(status) { Content = new StringContent(body) };
        }
    }

    private static readonly Bounds Territory = new(5.25, 44.68, 6.02, 45.58);

    [Fact]
    public async Task Asks_Map_Patou_for_the_planned_presences_of_a_day()
    {
        var handler = new RecordingHandler(HttpStatusCode.OK, """{"success":true,"data":{"type":"FeatureCollection","features":[]}}""");
        var client = new MapPatouClient(new HttpClient(handler), Territory);

        var zones = await client.ZonesOn(new DateOnly(2026, 7, 15));

        Assert.Empty(zones);
        Assert.Equal(HttpMethod.Post, handler.Request!.Method);
        Assert.Equal(MapPatouClient.Endpoint, handler.Request.RequestUri);
        Assert.Equal("2026-07-15T10:00:00.000Z", JsonNode.Parse(handler.RequestBody!)!["date"]!.GetValue<string>());
    }

    [Fact]
    public async Task Says_when_Map_Patou_answers_with_an_error() =>
        await Assert.ThrowsAsync<MapPatouException>(() =>
            new MapPatouClient(new HttpClient(new RecordingHandler(HttpStatusCode.BadGateway, "")), Territory).ZonesOn(new DateOnly(2026, 7, 15)));
}
