namespace MissIssippiAPI.Models;

public class ItemAdminHardDeleteRequest
{
    public List<int> ItemIds { get; set; } = new();

    public string Password { get; set; } = string.Empty;
}

public class ItemAdminHardDeleteResult
{
    public int RequestedItemCount { get; set; }

    public int DeletedItemCount { get; set; }

    public int DeletedItemColorCount { get; set; }

    public int DeletedSkuCount { get; set; }

    public int DeletedInventoryCount { get; set; }

    public int DeletedInventoryActivityLogCount { get; set; }

    public int DeletedItemImageCount { get; set; }

    public int DeletedItemColorSecondaryColorCount { get; set; }

    public List<int> DeletedItemIds { get; set; } = new();

    public List<int> MissingItemIds { get; set; } = new();

    public List<string> DeletedItemNumbers { get; set; } = new();
}
