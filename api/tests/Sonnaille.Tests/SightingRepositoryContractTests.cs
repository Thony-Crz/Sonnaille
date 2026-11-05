using Sonnaille.Application;
using Sonnaille.Domain;
using Sonnaille.Infrastructure;

namespace Sonnaille.Tests;

/// <summary>
/// Same behaviour for every repository. PostGIS is tested when a database is given
/// (SONNAILLE_TEST_POSTGRES connection string, set by the CI with a PostGIS service).
/// </summary>
public class SightingRepositoryContractTests
{
    private static readonly string? Postgres = Environment.GetEnvironmentVariable("SONNAILLE_TEST_POSTGRES");
    private static readonly DateTimeOffset Seen = new(2026, 7, 15, 7, 30, 0, TimeSpan.Zero);

    public static TheoryData<string> Repositories()
    {
        var data = new TheoryData<string> { "memory" };
        if (!string.IsNullOrEmpty(Postgres)) data.Add("postgres");
        return data;
    }

    private static async Task<ISightingRepository> Create(string name)
    {
        if (name == "memory") return new InMemorySightingRepository();
        var repository = new PostgresSightingRepository(Postgres!);
        await repository.EnsureSchema();
        return repository;
    }

    private static Sighting Flock() => Sighting.Create(Seen, 5.65123, 45.11235, SightingKind.Flock, "donkeys", "few", true).Value!;

    private static Sighting Nest() => Sighting.Create(Seen, 5.7, 45.2, SightingKind.HornetNest, null, null, null).Value!;

    [Theory]
    [MemberData(nameof(Repositories))]
    public async Task Keeps_every_field(string name)
    {
        var repository = await Create(name);
        var flock = Flock();

        await repository.Save(flock);

        Assert.Equal(flock, await repository.Find(flock.Id));
    }

    [Theory]
    [MemberData(nameof(Repositories))]
    public async Task Keeps_a_nest_without_animal_fields(string name)
    {
        var repository = await Create(name);
        var nest = Nest();

        await repository.Save(nest);

        Assert.Equal(nest, await repository.Find(nest.Id));
    }

    [Theory]
    [MemberData(nameof(Repositories))]
    public async Task Saving_again_replaces_it(string name)
    {
        var repository = await Create(name);
        var nest = Nest();
        await repository.Save(nest);

        await repository.Save(nest.Publish());

        Assert.Equal(SightingStatus.Published, (await repository.Find(nest.Id))!.Status);
        Assert.Contains(nest.Id, (await repository.WithStatus(SightingStatus.Published)).Select(s => s.Id));
        Assert.DoesNotContain(nest.Id, (await repository.WithStatus(SightingStatus.Pending)).Select(s => s.Id));
    }

    [Theory]
    [MemberData(nameof(Repositories))]
    public async Task An_unknown_id_is_not_found(string name) =>
        Assert.Null(await (await Create(name)).Find(Guid.NewGuid()));
}
