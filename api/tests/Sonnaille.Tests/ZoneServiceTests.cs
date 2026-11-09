using Sonnaille.Application;
using Sonnaille.Domain;
using Sonnaille.Infrastructure;

namespace Sonnaille.Tests;

/// <summary>A clock the test moves by hand.</summary>
public sealed class ManualClock(DateTimeOffset now) : TimeProvider
{
    public DateTimeOffset Now { get; set; } = now;
    public override DateTimeOffset GetUtcNow() => Now;
}

/// <summary>Counts the requests and answers with one zone, or fails when told to.</summary>
public sealed class FakeMapPatou : IMapPatou
{
    public List<DateOnly> Requests { get; } = [];
    public bool Fails { get; set; }
    /// <summary>When set, Map Patou answers only once the test opens the gate.</summary>
    public TaskCompletionSource? Gate { get; set; }

    public async Task<IReadOnlyList<PastoralZone>> ZonesOn(DateOnly day, CancellationToken cancellation = default)
    {
        lock (Requests) Requests.Add(day);
        if (Gate is not null) await Gate.Task;
        if (Fails) throw new MapPatouException("unreachable");
        return [ZoneSamples.Zone($"Q{day.Day}")];
    }
}

public static class ZoneSamples
{
    public static PastoralZone Zone(string id) => new(
        id,
        $"Alpage {id}",
        $"Quartier {id}",
        [[[[5.6, 45.1], [5.65, 45.1], [5.65, 45.15], [5.6, 45.1]]]],
        new Presence(new DateOnly(2026, 6, 15), new DateOnly(2026, 9, 30), ["sheep"], true, [1, 2, 3, 4, 5, 6, 7]));
}

public class ZoneServiceTests
{
    // 2026-07-15 at 05:00 in Paris (summer time, UTC+2).
    private readonly ManualClock _clock = new(new DateTimeOffset(2026, 7, 15, 3, 0, 0, TimeSpan.Zero));
    private readonly FakeMapPatou _mapPatou = new();
    private readonly InMemoryZoneRepository _repository = new();
    private ZoneService Service => new(_repository, _mapPatou, _clock);

    [Fact]
    public async Task Fetches_the_zones_of_the_day_in_Paris_when_there_are_none()
    {
        Assert.Equal(RefreshOutcome.Fetched, await Service.Refresh());

        var dataset = (await _repository.Current())!;
        Assert.Equal(new DateOnly(2026, 7, 15), dataset.RequestedDate);
        Assert.Equal(_clock.Now, dataset.FetchedAt);
        Assert.Equal("Map Patou — Réseau Pastoral AuRA", dataset.Source);
        Assert.Equal(["Q15"], dataset.Zones.Select(z => z.Id));
    }

    [Fact]
    public async Task Calls_Map_Patou_at_most_once_a_day()
    {
        await Service.Refresh();
        _clock.Now = _clock.Now.AddHours(10);

        Assert.Equal(RefreshOutcome.AlreadyUpToDate, await Service.Refresh());
        Assert.Single(_mapPatou.Requests);
    }

    [Fact]
    public async Task Fetches_again_the_next_day_in_Paris()
    {
        await Service.Refresh();
        // 23:30 UTC on the 15th is already the 16th in Paris.
        _clock.Now = new DateTimeOffset(2026, 7, 15, 23, 30, 0, TimeSpan.Zero);

        await Service.Refresh();

        Assert.Equal([new DateOnly(2026, 7, 15), new DateOnly(2026, 7, 16)], _mapPatou.Requests);
    }

    [Fact]
    public async Task Keeps_the_previous_zones_when_Map_Patou_fails()
    {
        await Service.Refresh();
        _clock.Now = _clock.Now.AddDays(1);
        _mapPatou.Fails = true;

        Assert.Equal(RefreshOutcome.Failed, await Service.Refresh());
        Assert.Equal(new DateOnly(2026, 7, 15), (await _repository.Current())!.RequestedDate);
    }
}
