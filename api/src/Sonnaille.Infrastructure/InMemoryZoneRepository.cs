using Sonnaille.Application;
using Sonnaille.Domain;

namespace Sonnaille.Infrastructure;

/// <summary>Adapter for tests and local runs: the zones live as long as the process.</summary>
public sealed class InMemoryZoneRepository : IZoneRepository
{
    private ZoneDataset? _dataset;

    public Task<ZoneDataset?> Current() => Task.FromResult(_dataset);

    public Task Replace(ZoneDataset dataset)
    {
        _dataset = dataset;
        return Task.CompletedTask;
    }
}
