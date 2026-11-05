using System.Security.Cryptography;
using System.Text;

namespace Sonnaille.Api;

/// <summary>Moderation is closed unless a key is configured (Moderation:Key, a secret never committed).</summary>
public static class ModeratorKey
{
    public const string Header = "X-Moderator-Key";

    public static bool IsValid(string? configured, string? given) =>
        !string.IsNullOrEmpty(configured)
        && !string.IsNullOrEmpty(given)
        && CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(configured), Encoding.UTF8.GetBytes(given));
}
