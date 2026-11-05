using System.Text.Json;
using Sonnaille.Api;
using Sonnaille.Application;
using Sonnaille.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

// Composition root.
builder.Services.AddSingleton<ISightingRepository, InMemorySightingRepository>();
builder.Services.AddSingleton<SightingService>();
var origins = builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ?? ["https://thony-crz.github.io"];
builder.Services.AddCors(o => o.AddDefaultPolicy(p => p.WithOrigins(origins).WithMethods("GET", "POST").WithHeaders("Content-Type")));

var app = builder.Build();
app.UseCors();

bool IsModerator(HttpRequest request) =>
    ModeratorKey.IsValid(app.Configuration["Moderation:Key"], request.Headers[ModeratorKey.Header].ToString());

var sightings = app.MapGroup("/api/sightings");

// Public: what moderators approved, in the format the web app already reads.
sightings.MapGet("/", async (SightingService service) => Results.Json(SightingGeoJson.Collection(await service.Published())));

sightings.MapPost("/", async (JsonElement feature, SightingService service) =>
{
    var (request, errors) = SightingGeoJson.Read(feature);
    if (request is null) return Results.BadRequest(new { errors });

    var result = await service.Submit(
        request.ObservedAt, request.Longitude, request.Latitude, request.Kind, request.Species, request.Headcount, request.GuardDogs);
    return result.IsValid
        ? Results.Created($"/api/sightings/{result.Value!.Id}", new { id = result.Value.Id, status = "pending" })
        : Results.BadRequest(new { errors = result.Errors });
});

// Moderation: needs the moderator key.
sightings.MapGet("/pending", async (HttpRequest http, SightingService service) =>
    IsModerator(http) ? Results.Json(SightingGeoJson.Collection(await service.Pending())) : Results.Unauthorized());

sightings.MapPost("/{id:guid}/approve", async (Guid id, HttpRequest http, SightingService service) =>
    !IsModerator(http) ? Results.Unauthorized()
    : await service.Approve(id) ? Results.NoContent()
    : Results.NotFound());

app.Run();

/// <summary>Visible to the HTTP tests.</summary>
public partial class Program;
