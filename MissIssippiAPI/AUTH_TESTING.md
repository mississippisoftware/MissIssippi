# Auth Testing Guide

## Getting a Test Token

1. Register the API in Azure Portal under **App registrations** and note the Tenant ID, Client ID, and Audience.
2. Fill real values into `appsettings.Development.json` (never commit this file).
3. Use [jwt.ms](https://jwt.ms) or the MSAL browser flow to acquire a token for your app registration.
   - Quick option: [Microsoft Graph Explorer](https://developer.microsoft.com/en-us/graph/graph-explorer) — sign in and copy the access token from the **Access token** tab.
   - MSAL option: use `@azure/msal-browser` in a scratch HTML file pointing at your Client ID.

## curl Examples

### /api/health — no auth required (expect 200)
```bash
curl -i http://localhost:5167/api/health
```

### Existing endpoint without auth (expect 401)
```bash
curl -i http://localhost:5167/api/color/getcolors
```

### Existing endpoint with valid bearer token (expect 200)
```bash
TOKEN="eyJ..."   # paste your token here
curl -i -H "Authorization: Bearer $TOKEN" http://localhost:5167/api/color/getcolors
```

## Notes

- The API port (`5167`) may differ; check `Properties/launchSettings.json`.
- If the token is rejected with 401, confirm `TenantId`, `ClientId`, and `Audience` in `appsettings.Development.json` match your App Registration.
