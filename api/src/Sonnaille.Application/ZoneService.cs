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

    public Task<ZoneDataset?> Current() => repository.Current();

    public async Task<RefreshOutcome> Refresh(CancellationToken cancellation = default)
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
