namespace MissIssippiAPI.Models;

public abstract class AuditableEntity
{
    public DateTime CreatedAtUtc { get; set; }
    public DateTime ModifiedAtUtc { get; set; }
    public string CreatedByUserId { get; set; } = string.Empty;
    public string ModifiedByUserId { get; set; } = string.Empty;
}
