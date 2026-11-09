namespace Sonnaille.Domain;

/// <summary>A rectangle in degrees (WGS 84).</summary>
public sealed record Bounds(double West, double South, double East, double North)
{
    /// <summary>The Chartreuse and Vercors massifs (V0), as in the web app (src/domain/territory.ts).</summary>
    public static readonly Bounds V0Territory = new(5.25, 44.68, 6.02, 45.58);

    public bool Intersects(Bounds other) =>
        West <= other.East && other.West <= East && South <= other.North && other.South <= North;

    /// <summary>The bounds of a set of [longitude, latitude] positions, null when there are none.</summary>
    public static Bounds? Of(IEnumerable<double[]> positions)
    {
        var list = positions.Where(p => p.Length >= 2).ToList();
        if (list.Count == 0) return null;
        return new Bounds(list.Min(p => p[0]), list.Min(p => p[1]), list.Max(p => p[0]), list.Max(p => p[1]));
    }
}

/// <summary>When a flock is planned on a pastoral quarter: period, species, guard dogs, weekdays (1 = Monday).</summary>
public sealed record Presence(DateOnly Start, DateOnly End, IReadOnlyList<string> Species, bool GuardDogs, IReadOnlyList<int> Weekdays);

/// <summary>A pastoral quarter: an area where flocks graze, as a MultiPolygon ([longitude, latitude]).</summary>
public sealed record PastoralZone(string Id, string Name, string Quarter, double[][][][] Geometry, Presence? Presence)
{
    public Bounds? Bounds => Bounds.Of(Geometry.SelectMany(polygon => polygon).SelectMany(ring => ring));
}

/// <summary>The zones of a day, with where they come from and when they were fetched.</summary>
public sealed record ZoneDataset(IReadOnlyList<PastoralZone> Zones, string Source, DateOnly RequestedDate, DateTimeOffset FetchedAt);
