using System.Collections.Concurrent;
using Sonnaille.Application;
using Sonnaille.Domain;

namespace Sonnaille.Infrastructure;

/// <summary>Adapter for tests and the first alpha: sightings live as long as the process.</summary>
public sealed class InMemorySightingRepository : ISightingRepository
{
    private readonly ConcurrentDictionary<Guid, Sighting> _sightings = new();

    public Task Save(Sighting sighting)
    {
        _sightings[sighting.Id] = sighting;
        return Task.CompletedTask;
    }

    public Task<Sighting?> Find(Guid id) => Task.FromResult(_sightings.GetValueOrDefault(id));

    public Task<IReadOnlyList<Sighting>> WithStatus(SightingStatus status) =>
        Task.FromResult<IReadOnlyList<Sighting>>(
            _sightings.Values.Where(s => s.Status == status).OrderBy(s => s.ObservedAt).ToList());
}
