using System.Security.Claims;

namespace MissIssippiAPI.Services;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public bool IsAuthenticated =>
        _httpContextAccessor.HttpContext?.User?.Identity?.IsAuthenticated == true;

    public string UserId
    {
        get
        {
            if (!IsAuthenticated)
                throw new InvalidOperationException("User is not authenticated.");

            var principal = _httpContextAccessor.HttpContext!.User;
            return principal.FindFirstValue("oid")
                ?? principal.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? throw new InvalidOperationException("Unable to determine user ID: neither 'oid' nor 'sub' claim is present.");
        }
    }

    public string? Email =>
        _httpContextAccessor.HttpContext?.User?.FindFirstValue("preferred_username");
}
