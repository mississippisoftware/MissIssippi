namespace MissIssippiAPI.Models;

public class CollectionDto
{
    public int CollectionId { get; set; }

    public string CollectionName { get; set; } = null!;
}

public class CollectionSaveRequest
{
    public string CollectionName { get; set; } = null!;
}
