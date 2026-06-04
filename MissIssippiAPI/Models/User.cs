using Microsoft.AspNetCore.Identity;

namespace MissIssippiAPI.Models;

public class User : IdentityUser
{
    // IdentityUser provides: Id, Email, UserName, PasswordHash, etc.
    public string DisplayName { get; set; } = string.Empty;
    public string Role { get; set; } = "owner";
    public bool Active { get; set; } = true;
    public DateTime CreatedAtUtc { get; set; }
    public DateTime ModifiedAtUtc { get; set; }
}
