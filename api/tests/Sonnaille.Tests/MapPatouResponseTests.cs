using System.Text.Json.Nodes;
using Sonnaille.Application;
using Sonnaille.Domain;
using Sonnaille.Infrastructure;

namespace Sonnaille.Tests;

/// <summary>Fictitious responses: the shape of the Map Patou API, none of its data (docs/decisions.md, D1).</summary>
public class MapPatouResponseTests
{
    private static readonly Bounds Territory = new(5.25, 44.68, 6.02, 45.58);

    private static JsonObject Quarter(string id, double west, double south, Action<JsonObject>? with = null)
    {
        var properties = new JsonObject
        {
            ["id"] = id,
            ["nom"] = $"Alpage {id}",
            ["surface"] = $"Quartier {id}",
            ["type_animal"] = null,
            ["chiens"] = false,
            ["debut"] = null,
            ["fin"] = null,
        };
        with?.Invoke(properties);
        return new JsonObject
        {
            ["type"] = "Feature",
            ["geometry"] = new JsonObject
            {
                ["type"] = "MultiPolygon",
                ["coordinates"] = new JsonArray(new JsonArray(new JsonArray(
                    new JsonArray(west, south),
                    new JsonArray(west + 0.05, south),
                    new JsonArray(west + 0.05, south + 0.05),
                    new JsonArray(west, south)))),
            },
            ["properties"] = properties,
        };
    }

    private static string Response(params JsonObject[] features) =>
        new JsonObject
        {
            ["success"] = true,
            ["message"] = "success",
            ["data"] = new JsonObject { ["type"] = "FeatureCollection", ["features"] = new JsonArray(features) },
        }.ToJsonString();

    private static readonly Action<JsonObject> SummerWithDogs = p =>
    {
        p["debut"] = "2026-06-15";
        p["fin"] = "2026-09-30";
        p["type_animal"] = "Ovins Caprins";
        p["chiens"] = true;
        foreach (var day in new[] { "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche" }) p[day] = true;
    };

    [Fact]
    public void Reads_a_quarter_with_its_planned_presence()
    {
        var zones = MapPatouResponse.Parse(Response(Quarter("Q1", 5.6, 45.1, SummerWithDogs)), Territory);

        var zone = Assert.Single(zones);
        Assert.Equal(("Q1", "Alpage Q1", "Quartier Q1"), (zone.Id, zone.Name, zone.Quarter));
        Assert.Equal(new DateOnly(2026, 6, 15), zone.Presence!.Start);
        Assert.Equal(new DateOnly(2026, 9, 30), zone.Presence.End);
        Assert.Equal(["sheep", "goats"], zone.Presence.Species);
        Assert.True(zone.Presence.GuardDogs);
        Assert.Equal([1, 2, 3, 4, 5, 6, 7], zone.Presence.Weekdays);
        Assert.Equal(5.6, zone.Geometry[0][0][0][0]);
    }

    [Fact]
    public void A_quarter_without_dates_has_no_planned_presence() =>
        Assert.Null(Assert.Single(MapPatouResponse.Parse(Response(Quarter("Q1", 5.6, 45.1)), Territory)).Presence);

    [Fact]
    public void Without_weekdays_the_flock_is_there_every_day()
    {
        var zone = Assert.Single(MapPatouResponse.Parse(Response(Quarter("Q1", 5.6, 45.1, p =>
        {
            p["debut"] = "2026-06-15";
            p["fin"] = "2026-09-30";
        })), Territory));

        Assert.Equal([1, 2, 3, 4, 5, 6, 7], zone.Presence!.Weekdays);
        Assert.False(zone.Presence.GuardDogs);
    }

    [Fact]
    public void Keeps_only_the_quarters_overlapping_the_territory() =>
        Assert.Equal(["IN"], MapPatouResponse.Parse(Response(Quarter("IN", 5.6, 45.1), Quarter("OUT", 7.5, 46.5)), Territory).Select(z => z.Id));

    [Theory]
    [InlineData("Ovins", new[] { "sheep" })]
    [InlineData("bovins equins", new[] { "cattle", "horses" })]
    [InlineData("Asins ânes anes", new[] { "donkeys" })]
    [InlineData("mixte lamas", new[] { "mixed" })]
    [InlineData(null, new string[0])]
    public void Reads_the_species_from_free_text(string? raw, string[] expected) =>
        Assert.Equal(expected, MapPatouResponse.ParseSpecies(raw));

    [Fact]
    public void Refuses_an_unexpected_response() =>
        Assert.Throws<MapPatouException>(() => MapPatouResponse.Parse("""{"success":false}""", Territory));
}
