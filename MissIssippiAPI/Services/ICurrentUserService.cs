namespace MissIssippiAPI.Services;

public interface ICurrentUserService
{
    string UserId { get; }      // Entra object ID ("oid" claim)
    string? Email { get; }      // "preferred_username" claim, may be null
    bool IsAuthenticated { get; }
}
