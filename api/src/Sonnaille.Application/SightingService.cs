using Sonnaille.Domain;

namespace Sonnaille.Application;

/// <summary>Use cases: submit a sighting, moderate it, list what is public.</summary>
public sealed class SightingService(ISightingRepository repository)
{
    public async Task<Result<Sighting>> Submit(
        DateTimeOffset observedAt,
        double longitude,
        double latitude,
        SightingKind kind,
        string? species,
        string? headcount,
        bool? guardDogs)
    {
        var result = Sighting.Create(observedAt, longitude, latitude, kind, species, headcount, guardDogs);
        if (result.IsValid) await repository.Save(result.Value!);
        return result;
    }

    public async Task<bool> Approve(Guid id)
    {
        var sighting = await repository.Find(id);
        if (sighting is null) return false;
        await repository.Save(sighting.Publish());
        return true;
    }

    public Task<IReadOnlyList<Sighting>> Published() => repository.WithStatus(SightingStatus.Published);

    public Task<IReadOnlyList<Sighting>> Pending() => repository.WithStatus(SightingStatus.Pending);
}
