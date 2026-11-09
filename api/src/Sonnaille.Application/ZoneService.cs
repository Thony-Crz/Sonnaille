using Sonnaille.Domain;

namespace Sonnaille.Application;

/// <summary>Port: where the zones of the day are kept (PostGIS in production).</summary>
public interface IZoneRepository
{
    Task<ZoneDataset?> Current();
    Task Replace(ZoneDataset dataset);
}

/// <summary>Port: the planned presences of a day, from Map Patou.</summary>
public interface IMapPatou
{
    Task<IReadOnlyList<PastoralZone>> ZonesOn(DateOnly day, CancellationToken cancellation = default);
}

/// <summary>Map Patou could not be reached or answered something unexpected.</summary>
public sealed class MapPatouException(string message, Exception? inner = null) : Exception(message, inner);

public enum RefreshOutcome { Fetched, AlreadyUpToDate, Failed }

/// <summary>
/// Keeps the zones of the day: Map Patou is asked at most once per day, Paris time (docs/decisions.md, D1).
/// When it fails, the previous zones stay.
/// </summary>
public sealed class ZoneService(IZoneRepository repository, IMapPatou mapPatou, TimeProvider clock)
{
    public const string Source = "Map Patou — Réseau Pastoral AuRA";

    private static readonly TimeZoneInfo Paris = TimeZoneInfo.FindSystemTimeZoneById("Europe/Paris");

    public DateOnly Today() => DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(clock.GetUtcNow(), Paris).DateTime);

    private readonly Lock _lock = new();
    private Task<RefreshOutcome>? _running;

    public Task<ZoneDataset?> Current() => repository.Current();

    /// <summary>
    /// The zones to show a visitor. On a serverless host the API sleeps between visits, so the visits keep
    /// the zones up to date: the very first visitor waits for them; the first one of a new day gets
    /// yesterday's at once while today's are fetched in the background.
    /// </summary>
    public async Task<ZoneDataset?> ForVisitor()
    {
        var current = await repository.Current();
        if (current is null)
        {
            await Refresh();
            return await repository.Current();
        }
        if (current.RequestedDate != Today()) _ = Refresh();
        return current;
    }

    /// <summary>Waits for a refresh in progress, if any (tests, shutdown).</summary>
    public Task WaitForRefresh()
    {
        lock (_lock) return _running ?? Task.CompletedTask;
    }

    /// <summary>Fetches today's zones if needed; callers arriving meanwhile share the same request.</summary>
    public Task<RefreshOutcome> Refresh(CancellationToken cancellation = default)
    {
        lock (_lock)
        {
            if (_running is { IsCompleted: false }) return _running;
            return _running = RefreshOnce(cancellation);
        }
    }

    private async Task<RefreshOutcome> RefreshOnce(CancellationToken cancellation)
    {
        var today = Today();
        if ((await repository.Current())?.RequestedDate == today) return RefreshOutcome.AlreadyUpToDate;
        try
        {
            var zones = await mapPatou.ZonesOn(today, cancellation);
            await repository.Replace(new ZoneDataset(zones, Source, today, clock.GetUtcNow()));
            return RefreshOutcome.Fetched;
        }
        catch (MapPatouException)
        {
            return RefreshOutcome.Failed;
        }
    }
}
