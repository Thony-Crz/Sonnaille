using System.Globalization;
using System.Text.Json.Nodes;
using Sonnaille.Application;
using Sonnaille.Domain;

namespace Sonnaille.Api;

/// <summary>The zones of the day as the web app reads them (docs/format-zones.md, src/infrastructure/pastoral-zones-geojson.ts).</summary>
public static class ZoneGeoJson
{
    public static JsonObject Collection(ZoneDataset dataset) => new()
    {
        ["type"] = "FeatureCollection",
        ["metadata"] = new JsonObject
        {
            ["source"] = dataset.Source,
            ["requestedDate"] = Day(dataset.RequestedDate),
            // Same text as JavaScript toISOString().
            ["fetchedAt"] = dataset.FetchedAt.UtcDateTime.ToString("yyyy-MM-dd'T'HH:mm:ss.fff'Z'", CultureInfo.InvariantCulture),
        },
        ["features"] = new JsonArray([.. dataset.Zones.Select(z => (JsonNode)Feature(z))]),
    };

    private static JsonObject Feature(PastoralZone zone) => new()
    {
        ["type"] = "Feature",
        ["id"] = zone.Id,
        ["geometry"] = new JsonObject
        {
            ["type"] = "MultiPolygon",
            ["coordinates"] = new JsonArray([.. zone.Geometry.Select(polygon =>
                (JsonNode)new JsonArray([.. polygon.Select(ring =>
                    (JsonNode)new JsonArray([.. ring.Select(position => (JsonNode)new JsonArray([.. position.Select(c => (JsonNode)c)]))]))]))]),
        },
        ["properties"] = new JsonObject
        {
            ["name"] = zone.Name,
            ["quarter"] = zone.Quarter,
            ["presence"] = zone.Presence is not { } p
                ? null
                : new JsonObject
                {
                    ["start"] = Day(p.Start),
                    ["end"] = Day(p.End),
                    ["species"] = new JsonArray([.. p.Species.Select(s => (JsonNode)s)]),
                    ["guardDogs"] = p.GuardDogs,
                    ["weekdays"] = new JsonArray([.. p.Weekdays.Select(d => (JsonNode)d)]),
                },
        },
    };

    private static string Day(DateOnly day) => day.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
}

/// <summary>Keeps the zones of the day up to date: checks every hour, Map Patou is asked at most once a day.</summary>
public sealed class ZoneRefresher(ZoneService zones, ILogger<ZoneRefresher> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromHours(1));
        do
        {
            // Never the data in the logs (docs/decisions.md, D1): only what happened.
            switch (await zones.Refresh(stoppingToken))
            {
                case RefreshOutcome.Fetched:
                    logger.LogInformation("Zones du jour récupérées chez Map Patou.");
                    break;
                case RefreshOutcome.Failed:
                    logger.LogWarning("Map Patou injoignable : les zones précédentes restent servies, nouvel essai dans une heure.");
                    break;
            }
        } while (await timer.WaitForNextTickAsync(stoppingToken));
    }
}
