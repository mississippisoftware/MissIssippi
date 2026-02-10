namespace MissIssippiAPI.Models;

public class SkuLookupResult
{
    public string Sku { get; set; } = null!;

    public int SeasonId { get; set; }

    public string SeasonName { get; set; } = null!;

    public int ItemId { get; set; }

    public string ItemNumber { get; set; } = null!;

    public int ColorId { get; set; }

    public string ColorName { get; set; } = null!;

    public int SizeId { get; set; }

    public string SizeName { get; set; } = null!;

    public int ItemColorId { get; set; }

    public int? InventoryId { get; set; }

    public int? Qty { get; set; }

    public string? ImageUrl { get; set; }
}
