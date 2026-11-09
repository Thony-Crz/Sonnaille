using System.Text.Json;
using Npgsql;
using NpgsqlTypes;
using Sonnaille.Application;
using Sonnaille.Domain;

namespace Sonnaille.Infrastructure;

/// <summary>
/// The zones of the day in PostgreSQL with PostGIS: one row per quarter (MultiPolygon, WGS 84),
/// and the dataset (source, day requested, time fetched). A new day replaces everything, in one transaction.
/// </summary>
public sealed class PostgresZoneRepository(string connectionString) : IZoneRepository
{
    private readonly NpgsqlDataSource _dataSource = NpgsqlDataSource.Create(connectionString);

    public async Task EnsureSchema()
    {
        await using var command = _dataSource.CreateCommand(
            """
            CREATE EXTENSION IF NOT EXISTS postgis;
            CREATE TABLE IF NOT EXISTS zone_dataset (
                id int PRIMARY KEY CHECK (id = 1),
                source text NOT NULL,
                requested_date date NOT NULL,
                fetched_at timestamptz NOT NULL
            );
            CREATE TABLE IF NOT EXISTS pastoral_zones (
                id text PRIMARY KEY,
                name text NOT NULL,
                quarter text NOT NULL,
                geometry geometry(MultiPolygon, 4326) NOT NULL,
                presence_start date,
                presence_end date,
                species text[],
                guard_dogs boolean,
                weekdays int[]
            );
            CREATE INDEX IF NOT EXISTS pastoral_zones_geometry ON pastoral_zones USING gist (geometry);
            """);
        await command.ExecuteNonQueryAsync();
    }

    public async Task<ZoneDataset?> Current()
    {
        await using var connection = await _dataSource.OpenConnectionAsync();
        await using var datasetCommand = new NpgsqlCommand("SELECT source, requested_date, fetched_at FROM zone_dataset WHERE id = 1", connection);
        string source;
        DateOnly requestedDate;
        DateTimeOffset fetchedAt;
        await using (var reader = await datasetCommand.ExecuteReaderAsync())
        {
            if (!await reader.ReadAsync()) return null;
            source = reader.GetString(0);
            requestedDate = reader.GetFieldValue<DateOnly>(1);
            fetchedAt = new DateTimeOffset(reader.GetFieldValue<DateTime>(2), TimeSpan.Zero);
        }

        await using var zonesCommand = new NpgsqlCommand(
            "SELECT id, name, quarter, ST_AsGeoJSON(geometry), presence_start, presence_end, species, guard_dogs, weekdays FROM pastoral_zones",
            connection);
        var zones = new List<PastoralZone>();
        await using (var reader = await zonesCommand.ExecuteReaderAsync())
        {
            while (await reader.ReadAsync())
            {
                var geometry = JsonDocument.Parse(reader.GetString(3)).RootElement.GetProperty("coordinates").Deserialize<double[][][][]>()!;
                var presence = reader.IsDBNull(4)
                    ? null
                    : new Presence(
                        reader.GetFieldValue<DateOnly>(4),
                        reader.GetFieldValue<DateOnly>(5),
                        reader.GetFieldValue<string[]>(6),
                        reader.GetBoolean(7),
                        reader.GetFieldValue<int[]>(8));
                zones.Add(new PastoralZone(reader.GetString(0), reader.GetString(1), reader.GetString(2), geometry, presence));
            }
        }
        return new ZoneDataset(zones, source, requestedDate, fetchedAt);
    }

    public async Task Replace(ZoneDataset dataset)
    {
        await using var connection = await _dataSource.OpenConnectionAsync();
        await using var transaction = await connection.BeginTransactionAsync();

        await using (var clear = new NpgsqlCommand("DELETE FROM pastoral_zones; DELETE FROM zone_dataset;", connection, transaction))
            await clear.ExecuteNonQueryAsync();

        await using (var insertDataset = new NpgsqlCommand(
            "INSERT INTO zone_dataset (id, source, requested_date, fetched_at) VALUES (1, $1, $2, $3)", connection, transaction))
        {
            insertDataset.Parameters.Add(new NpgsqlParameter { Value = dataset.Source });
            insertDataset.Parameters.Add(new NpgsqlParameter { Value = dataset.RequestedDate });
            insertDataset.Parameters.Add(new NpgsqlParameter { Value = dataset.FetchedAt.ToUniversalTime() });
            await insertDataset.ExecuteNonQueryAsync();
        }

        foreach (var zone in dataset.Zones)
        {
            await using var insert = new NpgsqlCommand(
                """
                INSERT INTO pastoral_zones (id, name, quarter, geometry, presence_start, presence_end, species, guard_dogs, weekdays)
                VALUES ($1, $2, $3, ST_SetSRID(ST_GeomFromGeoJSON($4), 4326), $5, $6, $7, $8, $9)
                """,
                connection,
                transaction);
            var p = zone.Presence;
            insert.Parameters.Add(new NpgsqlParameter { Value = zone.Id });
            insert.Parameters.Add(new NpgsqlParameter { Value = zone.Name });
            insert.Parameters.Add(new NpgsqlParameter { Value = zone.Quarter });
            insert.Parameters.Add(new NpgsqlParameter { Value = JsonSerializer.Serialize(new { type = "MultiPolygon", coordinates = zone.Geometry }) });
            insert.Parameters.Add(new NpgsqlParameter { Value = (object?)p?.Start ?? DBNull.Value, NpgsqlDbType = NpgsqlDbType.Date });
            insert.Parameters.Add(new NpgsqlParameter { Value = (object?)p?.End ?? DBNull.Value, NpgsqlDbType = NpgsqlDbType.Date });
            insert.Parameters.Add(new NpgsqlParameter { Value = (object?)p?.Species.ToArray() ?? DBNull.Value, NpgsqlDbType = NpgsqlDbType.Array | NpgsqlDbType.Text });
            insert.Parameters.Add(new NpgsqlParameter { Value = (object?)p?.GuardDogs ?? DBNull.Value, NpgsqlDbType = NpgsqlDbType.Boolean });
            insert.Parameters.Add(new NpgsqlParameter { Value = (object?)p?.Weekdays.ToArray() ?? DBNull.Value, NpgsqlDbType = NpgsqlDbType.Array | NpgsqlDbType.Integer });
            await insert.ExecuteNonQueryAsync();
        }

        await transaction.CommitAsync();
    }
}
