using Sonnaille.Application;
using Sonnaille.Domain;
using Sonnaille.Infrastructure;

namespace Sonnaille.Tests;

public class SightingServiceTests
{
    private static readonly DateTimeOffset Seen = new(2026, 7, 15, 7, 30, 0, TimeSpan.Zero);
    private readonly SightingService _service = new(new InMemorySightingRepository());

    [Fact]
    public async Task A_submitted_sighting_waits_for_moderation()
    {
        var result = await _service.Submit(Seen, 5.65, 45.11, SightingKind.Flock, "cattle", "hundreds", true);

        Assert.True(result.IsValid);
        Assert.Empty(await _service.Published());
        Assert.Single(await _service.Pending());
    }

    [Fact]
    public async Task An_approved_sighting_is_published()
    {
        var submitted = (await _service.Submit(Seen, 5.65, 45.11, SightingKind.WaspNest, null, null, null)).Value!;

        Assert.True(await _service.Approve(submitted.Id));
        Assert.Equal([submitted.Id], (await _service.Published()).Select(s => s.Id));
    }

    [Fact]
    public async Task Approving_an_unknown_sighting_fails() =>
        Assert.False(await _service.Approve(Guid.NewGuid()));

    [Fact]
    public async Task An_invalid_sighting_is_not_kept()
    {
        var result = await _service.Submit(Seen, 500, 45, SightingKind.Flock, "sheep", "few", true);

        Assert.False(result.IsValid);
        Assert.Empty(await _service.Pending());
    }
}
