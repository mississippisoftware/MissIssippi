# MissIssippiAPI

## Database Connection Configuration

This API uses `ConnectionStrings:DefaultConnection` for EF Core.

- `Development` uses the local SQL connection string from `appsettings.Development.json`.
- `Production` (when run locally for Azure DB testing) should use `dotnet user-secrets` so Azure SQL credentials are not stored in git.
- Azure App Service should set the `DefaultConnection` connection string in App Service Configuration (type: `SQLAzure`) so it overrides files at runtime.

### Local development (default)

- Run with `ASPNETCORE_ENVIRONMENT=Development` (the existing launch profiles already do this).
- `appsettings.Development.json` is configured for local SQL using Windows authentication (`Trusted_Connection=True`) and `TrustServerCertificate=True`.
- Your Windows user must have access to `MissIssippiDB`.
- If your local SQL instance is `SQLEXPRESS` or LocalDB, update the `Server=` value accordingly (for example `localhost\\SQLEXPRESS` or `(localdb)\\MSSQLLocalDB`).

### Local Production environment (Azure SQL testing)

1. Set `ASPNETCORE_ENVIRONMENT=Production` (or use the `API (Production - Azure DB)` launch profile).
2. Store the Azure SQL connection string in user-secrets (from the `MissIssippiAPI` project folder).

Example commands:

```powershell
dotnet user-secrets init
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "<AZURE CONNECTION STRING HERE>"
```

### Azure App Service configuration

- In Azure App Service, open `Configuration` -> `Connection strings`.
- Add a connection string named `DefaultConnection`.
- Set the type to `SQLAzure`.
- Do not store the Azure SQL password in `appsettings*.json`, `launchSettings.json`, or source control.
