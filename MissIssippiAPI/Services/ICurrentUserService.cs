namespace MissIssippiAPI.Services;

public interface ICurrentUserService
{
    string UserId { get; }      // JWT "sub" claim (IdentityUser.Id)
    string? Email { get; }      // JWT "email" claim, may be null
    bool IsAuthenticated { get; }
}
