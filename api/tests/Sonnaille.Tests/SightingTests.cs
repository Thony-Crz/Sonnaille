using Sonnaille.Domain;

namespace Sonnaille.Tests;

public class SightingTests
{
    private static readonly DateTimeOffset Seen = new(2026, 7, 15, 7, 30, 0, TimeSpan.Zero);

    [Fact]
    public void A_flock_needs_species_headcount_and_guard_dogs()
    {
        var result = Sighting.Create(Seen, 5.65, 45.11, SightingKind.Flock, "donkeys", "few", false);

        Assert.True(result.IsValid);
        Assert.Equal(SightingStatus.Pending, result.Value!.Status);
        Assert.Equal("donkeys", result.Value.Species);
    }

    [Fact]
    public void A_nest_has_no_animal_fields()
    {
        var result = Sighting.Create(Seen, 5.65, 45.11, SightingKind.HornetNest, null, null, null);

        Assert.True(result.IsValid);
        Assert.Null(result.Value!.Species);
    }

    [Theory]
    [InlineData(200, 45, "longitude: out of range")]
    [InlineData(5.6, 95, "latitude: out of range")]
    public void Coordinates_must_be_on_earth(double longitude, double latitude, string error) =>
        Assert.Contains(error, Sighting.Create(Seen, longitude, latitude, SightingKind.Flock, "sheep", "few", true).Errors);

    [Fact]
    public void A_flock_with_unknown_species_or_headcount_is_refused()
    {
        var errors = Sighting.Create(Seen, 5.6, 45, SightingKind.Flock, "yaks", "twelve", null).Errors;

        Assert.Contains("species: unknown", errors);
        Assert.Contains("headcount: unknown", errors);
        Assert.Contains("guardDogs: missing", errors);
    }

    [Fact]
    public void A_nest_with_animal_fields_is_refused() =>
        Assert.Contains("species: not for a nest or beehives", Sighting.Create(Seen, 5.6, 45, SightingKind.BeeNest, "sheep", null, null).Errors);

    [Fact]
    public void Publishing_makes_it_public()
    {
        var sighting = Sighting.Create(Seen, 5.6, 45, SightingKind.Beehives, null, null, null).Value!;

        Assert.Equal(SightingStatus.Published, sighting.Publish().Status);
    }
}
