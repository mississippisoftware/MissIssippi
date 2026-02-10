namespace MissIssippiAPI.Models;

public class ItemSaveRequest
{
    public int ItemId { get; set; }

    public string ItemNumber { get; set; } = null!;

    public string Description { get; set; } = string.Empty;

    public decimal? CostPrice { get; set; }

    public decimal? WholesalePrice { get; set; }

    public decimal? Weight { get; set; }

    public int SeasonId { get; set; }

    public bool InProduction { get; set; }
}
