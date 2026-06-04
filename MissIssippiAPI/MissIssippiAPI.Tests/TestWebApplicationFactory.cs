using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace MissIssippiAPI.Tests;

public class TestWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        var testConnStr = Environment.GetEnvironmentVariable("TEST_DB_CONNECTION_STRING");
        if (string.IsNullOrWhiteSpace(testConnStr))
            throw new InvalidOperationException(
                "TEST_DB_CONNECTION_STRING environment variable is not set. " +
                "Set it to the staging Azure SQL connection string before running tests.");

        // Override the connection string that Program.cs reads at startup.
        // ConfigureAppConfiguration callbacks run before builder.Build() resolves config,
        // so the in-memory collection shadows appsettings values.
        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = testConnStr,
                // Provide dummy AzureAd values so AddMicrosoftIdentityWebApi
                // doesn't throw on missing config.  The scheme is never used in tests.
                ["AzureAd:Instance"] = "https://login.microsoftonline.com/",
                ["AzureAd:TenantId"] = "test-tenant-id",
                ["AzureAd:ClientId"] = "test-client-id",
                ["AzureAd:Audience"] = "test-client-id",
            });
        });

        builder.ConfigureTestServices(services =>
        {
            // Register a test authentication scheme that auto-authenticates every request.
            // This bypasses the global RequireAuthenticatedUser AuthorizeFilter added in Program.cs.
            services.AddAuthentication()
                .AddScheme<AuthenticationSchemeOptions, TestAuthHandler>("Test", _ => { });

            // PostConfigure runs after all Configure calls, so this overrides the
            // Microsoft Identity default scheme and makes "Test" the active scheme.
            services.PostConfigure<AuthenticationOptions>(opts =>
            {
                opts.DefaultAuthenticateScheme = "Test";
                opts.DefaultChallengeScheme = "Test";
                opts.DefaultForbidScheme = "Test";
            });
        });
    }
}

/// <summary>
/// Always returns a successful authentication result with a synthetic test identity.
/// </summary>
public class TestAuthHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    public TestAuthHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder)
        : base(options, logger, encoder) { }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var claims = new[] { new Claim(ClaimTypes.Name, "test-user@example.com") };
        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, "Test");
        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}
