using System.Globalization;
using System.Text.Json;
using System.Text.Json.Nodes;
using Sonnaille.Domain;

namespace Sonnaille.Api;

/// <summary>A sighting as read from a GeoJSON Feature, before the domain rules are applied.</summary>
public sealed record SightingRequest(
    DateTimeOffset ObservedAt,
    double Longitude,
    double Latitude,
    SightingKind Kind,
    string? Species,
    string? Headcount,
    bool? GuardDogs);

/// <summary>
/// Same GeoJSON as the web app's content/observations.geojson: flocks are written without a kind,
/// nests and beehives carry their kind only. Any other property is refused (no free text).
/// </summary>
public static class SightingGeoJson
{
    private static readonly Dictionary<string, SightingKind> Kinds = new()
    {
        ["flock"] = SightingKind.Flock,
        ["beehives"] = SightingKind.Beehives,
        ["wasp-nest"] = SightingKind.WaspNest,
        ["bee-nest"] = SightingKind.BeeNest,
        ["hornet-nest"] = SightingKind.HornetNest,
    };

    private static readonly HashSet<string> AllowedProperties = ["observedAt", "kind", "species", "headcount", "guardDogs"];

    public static string KindName(SightingKind kind) => Kinds.First(k => k.Value == kind).Key;

    public static (SightingRequest? Request, List<string> Errors) Read(JsonElement feature)
    {
        var errors = new List<string>();
        if (feature.ValueKind != JsonValueKind.Object || !Has(feature, "type", "Feature"))
            return (null, ["not a Feature"]);

        double longitude = double.NaN, latitude = double.NaN;
        if (!feature.TryGetProperty("geometry", out var geometry) || geometry.ValueKind != JsonValueKind.Object || !Has(geometry, "type", "Point"))
            errors.Add("geometry: not a Point");
        else if (!geometry.TryGetProperty("coordinates", out var c) || c.ValueKind != JsonValueKind.Array || c.GetArrayLength() != 2
                 || c[0].ValueKind != JsonValueKind.Number || c[1].ValueKind != JsonValueKind.Number)
            errors.Add("geometry: invalid coordinates");
        else
            (longitude, latitude) = (c[0].GetDouble(), c[1].GetDouble());

        if (!feature.TryGetProperty("properties", out var p) || p.ValueKind != JsonValueKind.Object)
            return (null, [.. errors, "properties: missing"]);

        foreach (var property in p.EnumerateObject())
            if (!AllowedProperties.Contains(property.Name)) errors.Add($"properties.{property.Name}: not allowed");

        DateTimeOffset observedAt = default;
        if (!p.TryGetProperty("observedAt", out var at) || at.ValueKind != JsonValueKind.String
            || !DateTimeOffset.TryParse(at.GetString(), CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal, out observedAt))
            errors.Add("properties.observedAt: not a date and time");

        var kind = SightingKind.Flock;
        if (p.TryGetProperty("kind", out var k) && (k.ValueKind != JsonValueKind.String || !Kinds.TryGetValue(k.GetString()!, out kind)))
            errors.Add("properties.kind: unknown");

        var species = Text(p, "species", errors);
        var headcount = Text(p, "headcount", errors);
        bool? guardDogs = null;
        if (p.TryGetProperty("guardDogs", out var dogs))
        {
            if (dogs.ValueKind is JsonValueKind.True or JsonValueKind.False) guardDogs = dogs.GetBoolean();
            else errors.Add("properties.guardDogs: not a boolean");
        }

        return errors.Count > 0
            ? (null, errors)
            : (new SightingRequest(observedAt, longitude, latitude, kind, species, headcount, guardDogs), errors);
    }

    public static JsonObject Feature(Sighting s)
    {
        // Same text as JavaScript toISOString(), like the web app writes it.
        var properties = new JsonObject { ["observedAt"] = s.ObservedAt.UtcDateTime.ToString("yyyy-MM-dd'T'HH:mm:ss.fff'Z'", CultureInfo.InvariantCulture) };
        if (s.Kind == SightingKind.Flock)
        {
            properties["species"] = s.Species;
            properties["headcount"] = s.Headcount;
            properties["guardDogs"] = s.GuardDogs;
        }
        else
        {
            properties["kind"] = KindName(s.Kind);
        }

        return new JsonObject
        {
            ["type"] = "Feature",
            ["id"] = s.Id.ToString(),
            ["geometry"] = new JsonObject { ["type"] = "Point", ["coordinates"] = new JsonArray(s.Longitude, s.Latitude) },
            ["properties"] = properties,
        };
    }

    public static JsonObject Collection(IEnumerable<Sighting> sightings) => new()
    {
        ["type"] = "FeatureCollection",
        ["features"] = new JsonArray([.. sightings.Select(s => (JsonNode)Feature(s))]),
    };

    private static bool Has(JsonElement element, string name, string value) =>
        element.TryGetProperty(name, out var v) && v.ValueKind == JsonValueKind.String && v.GetString() == value;

    private static string? Text(JsonElement properties, string name, List<string> errors)
    {
        if (!properties.TryGetProperty(name, out var value)) return null;
        if (value.ValueKind == JsonValueKind.String) return value.GetString();
        errors.Add($"properties.{name}: not a text");
        return null;
    }
}
