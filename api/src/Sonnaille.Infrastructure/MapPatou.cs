using System.Globalization;
using System.Net.Http.Json;
using System.Text.Json;
using Sonnaille.Application;
using Sonnaille.Domain;

namespace Sonnaille.Infrastructure;

/// <summary>Turns a Map Patou API response (docs/map-patou.md) into the pastoral zones overlapping the territory.</summary>
public static class MapPatouResponse
{
    private static readonly string[] Weekdays = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];

    private static readonly Dictionary<string, string> SpeciesWords = new()
    {
        ["ovins"] = "sheep",
        ["bovins"] = "cattle",
        ["caprins"] = "goats",
        ["equins"] = "horses",
        ["asins"] = "donkeys",
        ["anes"] = "donkeys",
        ["ânes"] = "donkeys",
        ["mixte"] = "mixed",
    };

    /// <summary>Map Patou's free-text "type_animal" ("Ovins Caprins", "bovins"…) as species.</summary>
    public static IReadOnlyList<string> ParseSpecies(string? raw) =>
        raw is null
            ? []
            : raw.ToLowerInvariant()
                .Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries)
                .Select(word => SpeciesWords.GetValueOrDefault(word))
                .OfType<string>()
                .Distinct()
                .ToList();

    public static IReadOnlyList<PastoralZone> Parse(string json, Bounds territory)
    {
        JsonElement features;
        try
        {
            using var document = JsonDocument.Parse(json);
            var root = document.RootElement;
            if (!root.TryGetProperty("success", out var success) || success.ValueKind != JsonValueKind.True
                || !root.TryGetProperty("data", out var data) || !data.TryGetProperty("features", out features)
                || features.ValueKind != JsonValueKind.Array)
                throw new MapPatouException("Unexpected Map Patou response");
            features = features.Clone();
        }
        catch (JsonException e)
        {
            throw new MapPatouException("Unexpected Map Patou response", e);
        }

        var zones = new List<PastoralZone>();
        foreach (var feature in features.EnumerateArray())
        {
            var geometry = feature.GetProperty("geometry").GetProperty("coordinates").Deserialize<double[][][][]>() ?? [];
            var p = feature.GetProperty("properties");
            var zone = new PastoralZone(
                Text(p, "id") ?? "",
                Text(p, "nom") ?? "",
                Text(p, "surface") ?? "",
                geometry,
                ParsePresence(p));
            if (zone.Bounds is { } bounds && bounds.Intersects(territory)) zones.Add(zone);
        }
        return zones;
    }

    private static Presence? ParsePresence(JsonElement p)
    {
        if (Text(p, "debut") is not { } start || Text(p, "fin") is not { } end) return null;
        var weekdays = Weekdays
            .Select((day, index) => p.TryGetProperty(day, out var v) && v.ValueKind == JsonValueKind.True ? index + 1 : 0)
            .Where(d => d > 0)
            .ToList();
        return new Presence(
            DateOnly.Parse(start, CultureInfo.InvariantCulture),
            DateOnly.Parse(end, CultureInfo.InvariantCulture),
            ParseSpecies(Text(p, "type_animal")),
            p.TryGetProperty("chiens", out var dogs) && dogs.ValueKind == JsonValueKind.True,
            weekdays.Count > 0 ? weekdays : [1, 2, 3, 4, 5, 6, 7]);
    }

    private static string? Text(JsonElement element, string name) =>
        element.TryGetProperty(name, out var value) && value.ValueKind == JsonValueKind.String ? value.GetString() : null;
}

/// <summary>One request to the Map Patou API for the planned presences of a day.</summary>
public sealed class MapPatouClient(HttpClient http, Bounds territory) : IMapPatou
{
    public static readonly Uri Endpoint = new("https://mappatous-api.lessem.inrae.fr/api/v1/map/geojson");

    public async Task<IReadOnlyList<PastoralZone>> ZonesOn(DateOnly day, CancellationToken cancellation = default)
    {
        HttpResponseMessage response;
        try
        {
            response = await http.PostAsJsonAsync(Endpoint, new { date = $"{day:yyyy-MM-dd}T10:00:00.000Z" }, cancellation);
        }
        catch (Exception e) when (e is HttpRequestException or TaskCanceledException)
        {
            throw new MapPatouException("Map Patou unreachable", e);
        }
        if (!response.IsSuccessStatusCode) throw new MapPatouException($"Map Patou answered {(int)response.StatusCode}");
        return MapPatouResponse.Parse(await response.Content.ReadAsStringAsync(cancellation), territory);
    }
}
