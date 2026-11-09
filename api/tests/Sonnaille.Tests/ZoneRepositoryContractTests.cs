using Sonnaille.Application;
using Sonnaille.Domain;
using Sonnaille.Infrastructure;

namespace Sonnaille.Tests;

/// <summary>
/// Same behaviour for every zone repository. PostGIS is tested when a database is given
/// (SONNAILLE_TEST_POSTGRES, set by the CI with a PostGIS service).
/// </summary>
[Collection("zones in the database")]
public class ZoneRepositoryContractTests
{
    private static readonly string? Postgres = Environment.GetEnvironmentVariable("SONNAILLE_TEST_POSTGRES");

    public static TheoryData<string> Repositories()
    {
        var data = new TheoryData<string> { "memory" };
        if (!string.IsNullOrEmpty(Postgres)) data.Add("postgres");
        return data;
    }

    private static async Task<IZoneRepository> Create(string name)
    {
        if (name == "memory") return new InMemoryZoneRepository();
        var repository = new PostgresZoneRepository(Postgres!);
        await repository.EnsureSchema();
        return repository;
    }

    private static ZoneDataset Dataset(DateOnly day, params PastoralZone[] zones) =>
        new(zones, ZoneService.Source, day, new DateTimeOffset(day.Year, day.Month, day.Day, 3, 0, 0, TimeSpan.Zero));

    [Theory]
    [MemberData(nameof(Repositories))]
    public async Task Keeps_every_field_of_the_zones_and_the_dataset(string name)
    {
        var repository = await Create(name);
        var withoutPresence = ZoneSamples.Zone("Q2") with { Presence = null };
        var dataset = Dataset(new DateOnly(2026, 7, 15), ZoneSamples.Zone("Q1"), withoutPresence);

        await repository.Replace(dataset);
        var current = (await repository.Current())!;

        Assert.Equal((dataset.Source, dataset.RequestedDate, dataset.FetchedAt), (current.Source, current.RequestedDate, current.FetchedAt));
        var zones = current.Zones.OrderBy(z => z.Id).ToList();
        Assert.Equal(["Q1", "Q2"], zones.Select(z => z.Id));
        Assert.Equal(("Alpage Q1", "Quartier Q1"), (zones[0].Name, zones[0].Quarter));
        Assert.Equal(ZoneSamples.Zone("Q1").Geometry, zones[0].Geometry);
        var presence = zones[0].Presence!;
        Assert.Equal((new DateOnly(2026, 6, 15), new DateOnly(2026, 9, 30), true), (presence.Start, presence.End, presence.GuardDogs));
        Assert.Equal(["sheep"], presence.Species);
        Assert.Equal([1, 2, 3, 4, 5, 6, 7], presence.Weekdays);
        Assert.Null(zones[1].Presence);
    }

    [Theory]
    [MemberData(nameof(Repositories))]
    public async Task The_zones_of_a_new_day_replace_the_previous_ones(string name)
    {
        var repository = await Create(name);
        await repository.Replace(Dataset(new DateOnly(2026, 7, 15), ZoneSamples.Zone("Q1"), ZoneSamples.Zone("Q2")));

        await repository.Replace(Dataset(new DateOnly(2026, 7, 16), ZoneSamples.Zone("Q3")));

        var current = (await repository.Current())!;
        Assert.Equal(new DateOnly(2026, 7, 16), current.RequestedDate);
        Assert.Equal(["Q3"], current.Zones.Select(z => z.Id));
    }
}

[CollectionDefinition("zones in the database", DisableParallelization = true)]
public class ZonesInTheDatabase;
