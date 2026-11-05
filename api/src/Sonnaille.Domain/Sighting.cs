namespace Sonnaille.Domain;

/// <summary>What was seen: a flock (or any grazing animals), beehives, or a nest.</summary>
public enum SightingKind { Flock, Beehives, WaspNest, BeeNest, HornetNest }

public enum SightingStatus { Pending, Published }

/// <summary>Outcome of a creation: the value, or the reasons it was refused.</summary>
public sealed record Result<T>(T? Value, IReadOnlyList<string> Errors)
{
    public bool IsValid => Errors.Count == 0;
}

/// <summary>
/// A sighting reported by a user, same rules as the web app: structured answers only,
/// never free text nor anything about a person (no shepherd, no behaviour of the dogs).
/// </summary>
public sealed record Sighting(
    Guid Id,
    DateTimeOffset ObservedAt,
    double Longitude,
    double Latitude,
    SightingKind Kind,
    string? Species,
    string? Headcount,
    bool? GuardDogs,
    SightingStatus Status)
{
    public static readonly IReadOnlySet<string> AllSpecies =
        new HashSet<string> { "sheep", "cattle", "goats", "horses", "donkeys", "mixed" };

    public static readonly IReadOnlySet<string> AllHeadcounts = new HashSet<string> { "few", "dozens", "hundreds" };

    public static Result<Sighting> Create(
        DateTimeOffset observedAt,
        double longitude,
        double latitude,
        SightingKind kind,
        string? species,
        string? headcount,
        bool? guardDogs)
    {
        var errors = new List<string>();
        if (double.IsNaN(longitude) || longitude is < -180 or > 180) errors.Add("longitude: out of range");
        if (double.IsNaN(latitude) || latitude is < -90 or > 90) errors.Add("latitude: out of range");
        if (!Enum.IsDefined(kind)) errors.Add("kind: unknown");

        if (kind == SightingKind.Flock)
        {
            if (species is null || !AllSpecies.Contains(species)) errors.Add("species: unknown");
            if (headcount is null || !AllHeadcounts.Contains(headcount)) errors.Add("headcount: unknown");
            if (guardDogs is null) errors.Add("guardDogs: missing");
        }
        else
        {
            if (species is not null) errors.Add("species: not for a nest or beehives");
            if (headcount is not null) errors.Add("headcount: not for a nest or beehives");
            if (guardDogs is not null) errors.Add("guardDogs: not for a nest or beehives");
        }

        return errors.Count > 0
            ? new Result<Sighting>(null, errors)
            : new Result<Sighting>(
                new Sighting(Guid.NewGuid(), observedAt, longitude, latitude, kind, species, headcount, guardDogs, SightingStatus.Pending),
                []);
    }

    public Sighting Publish() => this with { Status = SightingStatus.Published };
}
