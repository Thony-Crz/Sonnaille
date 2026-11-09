using Sonnaille.Application;
using Sonnaille.Domain;
using Sonnaille.Infrastructure;

namespace Sonnaille.Tests;

/// <summary>
/// On a serverless host the API sleeps between visits: the visits keep the zones up to date,
/// still with at most one Map Patou request a day.
/// </summary>
public class ZonesForVisitorsTests
{
    private readonly ManualClock _clock = new(new DateTimeOffset(2026, 7, 15, 3, 0, 0, TimeSpan.Zero));
    private readonly FakeMapPatou _mapPatou = new();
    private readonly InMemoryZoneRepository _repository = new();
    private readonly ZoneService _service;

    public ZonesForVisitorsTests() => _service = new ZoneService(_repository, _mapPatou, _clock);

    [Fact]
    public async Task The_very_first_visitor_waits_for_the_zones()
    {
        var dataset = await _service.ForVisitor();

        Assert.Equal(["Q15"], dataset!.Zones.Select(z => z.Id));
    }

    [Fact]
    public async Task Without_any_zone_and_Map_Patou_down_there_is_nothing_to_show()
    {
        _mapPatou.Fails = true;

        Assert.Null(await _service.ForVisitor());
    }

    [Fact]
    public async Task The_first_visitor_of_a_new_day_gets_yesterdays_zones_at_once_while_todays_are_fetched()
    {
        await _service.ForVisitor();
        _clock.Now = _clock.Now.AddDays(1);
        _mapPatou.Gate = new TaskCompletionSource();

        var served = await _service.ForVisitor();

        Assert.Equal(new DateOnly(2026, 7, 15), served!.RequestedDate);
        _mapPatou.Gate.SetResult();
        await _service.WaitForRefresh();
        Assert.Equal(new DateOnly(2026, 7, 16), (await _repository.Current())!.RequestedDate);
    }

    [Fact]
    public async Task Visitors_arriving_together_cause_a_single_Map_Patou_request()
    {
        _mapPatou.Gate = new TaskCompletionSource();

        var visits = Enumerable.Range(0, 5).Select(_ => _service.ForVisitor()).ToList();
        _mapPatou.Gate.SetResult();
        await Task.WhenAll(visits);

        Assert.Single(_mapPatou.Requests);
        Assert.All(visits, v => Assert.NotNull(v.Result));
    }
}
