using Sonnaille.Domain;

namespace Sonnaille.Application;

/// <summary>Port: where sightings are kept (in memory for tests, a database in production).</summary>
public interface ISightingRepository
{
    Task Save(Sighting sighting);
    Task<Sighting?> Find(Guid id);
    Task<IReadOnlyList<Sighting>> WithStatus(SightingStatus status);
}
