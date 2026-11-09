namespace Sonnaille.Api;

/// <summary>
/// Hosted databases (Neon…) give a URL, postgresql://user:password@host/database?sslmode=require;
/// Npgsql wants "Host=…;Username=…". An Npgsql connection string is left as it is.
/// </summary>
public static class DatabaseUrl
{
    public static string ToConnectionString(string value)
    {
        if (!value.StartsWith("postgres://", StringComparison.Ordinal) && !value.StartsWith("postgresql://", StringComparison.Ordinal))
            return value;

        var url = new Uri(value);
        var credentials = url.UserInfo.Split(':', 2);
        var parts = new List<string>
        {
            $"Host={url.Host}",
            $"Port={(url.IsDefaultPort || url.Port < 0 ? 5432 : url.Port)}",
            $"Database={url.AbsolutePath.TrimStart('/')}",
            $"Username={Uri.UnescapeDataString(credentials[0])}",
        };
        if (credentials.Length > 1) parts.Add($"Password={Uri.UnescapeDataString(credentials[1])}");
        if (url.Query.Contains("sslmode=require", StringComparison.OrdinalIgnoreCase)) parts.Add("SSL Mode=Require");
        return string.Join(';', parts);
    }
}
