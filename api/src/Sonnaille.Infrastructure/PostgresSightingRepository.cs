using Npgsql;
using Sonnaille.Application;
using Sonnaille.Domain;

namespace Sonnaille.Infrastructure;

/// <summary>Sightings in PostgreSQL with PostGIS: the position is a geography point (WGS 84).</summary>
public sealed class PostgresSightingRepository(string connectionString) : ISightingRepository
{
    private readonly NpgsqlDataSource _dataSource = NpgsqlDataSource.Create(connectionString);

    private const string Columns =
        "id, observed_at, ST_X(position::geometry), ST_Y(position::geometry), kind, species, headcount, guard_dogs, status";

    /// <summary>Creates the table if needed (called at start-up).</summary>
    public async Task EnsureSchema()
    {
        await using var command = _dataSource.CreateCommand(
            """
            CREATE EXTENSION IF NOT EXISTS postgis;
            CREATE TABLE IF NOT EXISTS sightings (
                id uuid PRIMARY KEY,
                observed_at timestamptz NOT NULL,
                position geography(Point, 4326) NOT NULL,
                kind text NOT NULL,
                species text,
                headcount text,
                guard_dogs boolean,
                status text NOT NULL
            );
            CREATE INDEX IF NOT EXISTS sightings_status ON sightings (status, observed_at);
            CREATE INDEX IF NOT EXISTS sightings_position ON sightings USING gist (position);
            """);
        await command.ExecuteNonQueryAsync();
    }

    public async Task Save(Sighting sighting)
    {
        await using var command = _dataSource.CreateCommand(
            """
            INSERT INTO sightings (id, observed_at, position, kind, species, headcount, guard_dogs, status)
            VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography, $5, $6, $7, $8, $9)
            ON CONFLICT (id) DO UPDATE SET
                observed_at = excluded.observed_at, position = excluded.position, kind = excluded.kind,
                species = excluded.species, headcount = excluded.headcount, guard_dogs = excluded.guard_dogs,
                status = excluded.status
            """);
        command.Parameters.Add(new NpgsqlParameter { Value = sighting.Id });
        command.Parameters.Add(new NpgsqlParameter { Value = sighting.ObservedAt.ToUniversalTime() });
        command.Parameters.Add(new NpgsqlParameter { Value = sighting.Longitude });
        command.Parameters.Add(new NpgsqlParameter { Value = sighting.Latitude });
        command.Parameters.Add(new NpgsqlParameter { Value = sighting.Kind.ToString() });
        command.Parameters.Add(new NpgsqlParameter { Value = (object?)sighting.Species ?? DBNull.Value, NpgsqlDbType = NpgsqlTypes.NpgsqlDbType.Text });
        command.Parameters.Add(new NpgsqlParameter { Value = (object?)sighting.Headcount ?? DBNull.Value, NpgsqlDbType = NpgsqlTypes.NpgsqlDbType.Text });
        command.Parameters.Add(new NpgsqlParameter { Value = (object?)sighting.GuardDogs ?? DBNull.Value, NpgsqlDbType = NpgsqlTypes.NpgsqlDbType.Boolean });
        command.Parameters.Add(new NpgsqlParameter { Value = sighting.Status.ToString() });
        await command.ExecuteNonQueryAsync();
    }

    public async Task<Sighting?> Find(Guid id)
    {
        await using var command = _dataSource.CreateCommand($"SELECT {Columns} FROM sightings WHERE id = $1");
        command.Parameters.Add(new NpgsqlParameter { Value = id });
        return (await Read(command)).SingleOrDefault();
    }

    public async Task<IReadOnlyList<Sighting>> WithStatus(SightingStatus status)
    {
        await using var command = _dataSource.CreateCommand($"SELECT {Columns} FROM sightings WHERE status = $1 ORDER BY observed_at");
        command.Parameters.Add(new NpgsqlParameter { Value = status.ToString() });
        return await Read(command);
    }

    private static async Task<List<Sighting>> Read(NpgsqlCommand command)
    {
        var sightings = new List<Sighting>();
        await using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            sightings.Add(new Sighting(
                reader.GetGuid(0),
                new DateTimeOffset(reader.GetFieldValue<DateTime>(1), TimeSpan.Zero),
                reader.GetDouble(2),
                reader.GetDouble(3),
                Enum.Parse<SightingKind>(reader.GetString(4)),
                reader.IsDBNull(5) ? null : reader.GetString(5),
                reader.IsDBNull(6) ? null : reader.GetString(6),
                reader.IsDBNull(7) ? null : reader.GetBoolean(7),
                Enum.Parse<SightingStatus>(reader.GetString(8))));
        }

        return sightings;
    }
}
