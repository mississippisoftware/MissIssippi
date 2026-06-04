namespace MissIssippiAPI.Models;

public class InventorySearchQuery
{
    public int? SeasonId { get; set; }

    public string? ItemNumber { get; set; }

    public string? ColorName { get; set; }

    public string? SizeName { get; set; }

    public int? CollectionId { get; set; }

    public bool InStockOnly { get; set; }

    public bool InProductionOnly { get; set; }

    public int Page { get; set; } = 1;

    public int PageSize { get; set; } = 25;
}

public class InventorySearchRow
{
    public int? SkuId { get; set; }

    public string? SkuValue { get; set; }

    public int ItemId { get; set; }

    public string ItemNumber { get; set; } = null!;

    public string Description { get; set; } = null!;

    public string SeasonName { get; set; } = null!;

    public string ColorName { get; set; } = null!;

    public string SizeName { get; set; } = null!;

    public int SizeSequence { get; set; }

    public int Qty { get; set; }

    public bool InStock { get; set; }

    public bool InProduction { get; set; }
}

public class InventorySearchResult
{
    public List<InventorySearchRow> Items { get; set; } = new();

    public int Total { get; set; }

    public int Page { get; set; }

    public int PageSize { get; set; }
}

public class AvailabilityRow
{
    public string? SkuValue { get; set; }

    public string ItemNumber { get; set; } = null!;

    public string ColorName { get; set; } = null!;

    public string SizeName { get; set; } = null!;

    public int Qty { get; set; }

    public bool InStock { get; set; }
}

public class CheckAvailabilityResult
{
    public List<AvailabilityRow> Results { get; set; } = new();
}

// GetProductDetails

public class ProductVariantSecondaryColorDto
{
    public string ColorName { get; set; } = null!;

    public int SortOrder { get; set; }
}

public class ProductVariantImageDto
{
    public string ImageType { get; set; } = null!;

    public string? ImageUrl { get; set; }

    public int Sequence { get; set; }
}

public class ProductVariantSizeDto
{
    public string SizeName { get; set; } = null!;

    public int SizeSequence { get; set; }

    public string? SkuValue { get; set; }

    public int Qty { get; set; }

    public bool InStock { get; set; }
}

public class ProductVariantDto
{
    public int ItemColorId { get; set; }

    public string ColorName { get; set; } = null!;

    public string? PrimaryColorHex { get; set; }

    public string? PantoneColor { get; set; }

    public bool Active { get; set; }

    public List<ProductVariantSecondaryColorDto> SecondaryColors { get; set; } = new();

    public List<ProductVariantImageDto> Images { get; set; } = new();

    public List<ProductVariantSizeDto> Sizes { get; set; } = new();
}

public class ProductDetailsResult
{
    public int ItemId { get; set; }

    public string ItemNumber { get; set; } = null!;

    public string Description { get; set; } = null!;

    public string SeasonName { get; set; } = null!;

    public decimal? WholesalePrice { get; set; }

    public decimal? CostPrice { get; set; }

    public decimal? Weight { get; set; }

    public bool InProduction { get; set; }

    public List<ProductVariantDto> Variants { get; set; } = new();
}

// SearchByColor

public class SearchByColorQuery
{
    public string? ColorName { get; set; }

    public int? CollectionId { get; set; }

    public int? SeasonId { get; set; }

    public bool InStockOnly { get; set; }

    public bool IncludePrimary { get; set; } = true;

    public bool IncludeSecondary { get; set; }

    public int Page { get; set; } = 1;

    public int PageSize { get; set; } = 25;
}

public class SearchByColorRow
{
    public int ItemColorId { get; set; }

    public string ItemNumber { get; set; } = null!;

    public string Description { get; set; } = null!;

    public string SeasonName { get; set; } = null!;

    public string PrimaryColorName { get; set; } = null!;

    public string MatchedVia { get; set; } = null!;

    public int TotalQty { get; set; }
}

public class SearchByColorResult
{
    public List<SearchByColorRow> Items { get; set; } = new();

    public int Total { get; set; }

    public int Page { get; set; }

    public int PageSize { get; set; }
}

// GetLowStockItems

public class LowStockQuery
{
    public int MaxQty { get; set; }

    public int? SeasonId { get; set; }

    public bool InProductionOnly { get; set; }

    public int Page { get; set; } = 1;

    public int PageSize { get; set; } = 50;
}

public class LowStockRow
{
    public string? SkuValue { get; set; }

    public string ItemNumber { get; set; } = null!;

    public string Description { get; set; } = null!;

    public string SeasonName { get; set; } = null!;

    public string ColorName { get; set; } = null!;

    public string SizeName { get; set; } = null!;

    public int Qty { get; set; }

    public bool InProduction { get; set; }
}

public class LowStockResult
{
    public List<LowStockRow> Items { get; set; } = new();

    public int Total { get; set; }

    public int Page { get; set; }

    public int PageSize { get; set; }
}

// SearchByStyleNumber

public class StyleNumberQuery
{
    public string ItemNumber { get; set; } = string.Empty;

    public int? SeasonId { get; set; }

    public bool IncludeVariantSummary { get; set; }
}

public class StyleNumberRow
{
    public int ItemId { get; set; }

    public string ItemNumber { get; set; } = null!;

    public string Description { get; set; } = null!;

    public string SeasonName { get; set; } = null!;

    public bool InProduction { get; set; }

    public decimal? WholesalePrice { get; set; }

    public int? VariantCount { get; set; }

    public int? TotalQty { get; set; }
}

public class StyleNumberResult
{
    public List<StyleNumberRow> Items { get; set; } = new();

    public int Total { get; set; }
}

// SearchBySeason

public class SearchBySeasonQuery
{
    public int SeasonId { get; set; }

    public bool InStockOnly { get; set; }

    public bool InProductionOnly { get; set; }

    public int Page { get; set; } = 1;

    public int PageSize { get; set; } = 50;
}

public class SearchBySeasonRow
{
    public int ItemId { get; set; }

    public string ItemNumber { get; set; } = null!;

    public string Description { get; set; } = null!;

    public bool InProduction { get; set; }

    public decimal? WholesalePrice { get; set; }

    public int VariantCount { get; set; }

    public int TotalQty { get; set; }

    public int InStockVariantCount { get; set; }
}

public class SearchBySeasonResult
{
    public List<SearchBySeasonRow> Items { get; set; } = new();

    public int Total { get; set; }

    public int Page { get; set; }

    public int PageSize { get; set; }
}

// Lookup tables for AI routing

public class SeasonLookupDto
{
    public int SeasonId { get; set; }

    public string SeasonName { get; set; } = null!;

    public bool Active { get; set; }
}

public class CollectionLookupDto
{
    public int CollectionId { get; set; }

    public string CollectionName { get; set; } = null!;
}

// GetInventoryActivityForVariant

public class InventoryActivityQuery
{
    public string? SkuValue { get; set; }

    public int? ItemColorId { get; set; }

    public DateTime? FromDate { get; set; }

    public DateTime? ToDate { get; set; }

    public int Page { get; set; } = 1;

    public int PageSize { get; set; } = 50;
}

public class InventoryActivityRow
{
    public DateTime LogTimestamp { get; set; }

    public DateTime ActivityDate { get; set; }

    public string SizeName { get; set; } = null!;

    public string? SkuValue { get; set; }

    public int OldQty { get; set; }

    public int NewQty { get; set; }

    public int Delta { get; set; }

    public string ActionType { get; set; } = null!;

    public string BatchSource { get; set; } = null!;

    public string? BatchNotes { get; set; }
}

public class InventoryActivityResult
{
    public List<InventoryActivityRow> Lines { get; set; } = new();

    public int Total { get; set; }

    public int Page { get; set; }

    public int PageSize { get; set; }
}
