using System.Reflection;

namespace Sonnaille.Tests;

/// <summary>Clean architecture: each project only depends on more inner ones.</summary>
public class ArchitectureTests
{
    private static string[] SonnailleReferences(Assembly assembly) =>
        assembly.GetReferencedAssemblies()
            .Select(a => a.Name ?? "")
            .Where(n => n.StartsWith("Sonnaille.", StringComparison.Ordinal))
            .OrderBy(n => n, StringComparer.Ordinal)
            .ToArray();

    [Fact]
    public void Domain_depends_on_nothing_else() =>
        Assert.Empty(SonnailleReferences(typeof(Domain.Sighting).Assembly));

    [Fact]
    public void Application_depends_only_on_the_domain() =>
        Assert.Equal(["Sonnaille.Domain"], SonnailleReferences(typeof(Application.SightingService).Assembly));

    [Fact]
    public void Infrastructure_does_not_depend_on_the_api() =>
        Assert.DoesNotContain("Sonnaille.Api", SonnailleReferences(typeof(Infrastructure.InMemorySightingRepository).Assembly));
}
