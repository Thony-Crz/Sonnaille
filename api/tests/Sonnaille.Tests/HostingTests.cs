using System.Net;
using Microsoft.AspNetCore.Mvc.Testing;
using Sonnaille.Api;

namespace Sonnaille.Tests;

public class DatabaseUrlTests
{
    [Fact]
    public void Turns_a_postgres_url_such_as_Neon_gives_into_an_Npgsql_connection_string() =>
        Assert.Equal(
            "Host=ep-cool-name-123.eu-central-1.aws.neon.tech;Port=5432;Database=sonnaille;Username=sonnaille_owner;Password=p@ss:word;SSL Mode=Require",
            DatabaseUrl.ToConnectionString("postgresql://sonnaille_owner:p%40ss%3Aword@ep-cool-name-123.eu-central-1.aws.neon.tech/sonnaille?sslmode=require"));

    [Fact]
    public void Keeps_the_port_when_given() =>
        Assert.Contains("Port=6543", DatabaseUrl.ToConnectionString("postgres://u:p@db.example.org:6543/d"));

    [Fact]
    public void Leaves_an_Npgsql_connection_string_as_it_is() =>
        Assert.Equal("Host=localhost;Username=postgres", DatabaseUrl.ToConnectionString("Host=localhost;Username=postgres"));
}

public class HealthTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    [Fact]
    public async Task Answers_that_it_is_alive_for_the_host_checks()
    {
        var client = factory.WithWebHostBuilder(b => b.UseSetting("Zones:Refresh", "false")).CreateClient();

        var response = await client.GetAsync("/api/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("ok", await response.Content.ReadAsStringAsync());
    }
}
