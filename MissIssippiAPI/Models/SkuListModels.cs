using System.Collections.Generic;

namespace MissIssippiAPI.Models;

public class SkuListQuery
{
    public string? Query { get; set; }

    public int? SeasonId { get; set; }

    public bool? InStock { get; set; }

    public bool? InProduction { get; set; }

    public int Page { get; set; } = 1;

    public int PageSize { get; set; } = 25;

    public string? SortField { get; set; }

    public string? SortOrder { get; set; }
}

public class SkuListItemDto
{
    public int SkuId { get; set; }

    public string Sku { get; set; } = null!;

    public string SeasonName { get; set; } = null!;

    public string ItemNumber { get; set; } = null!;

    public string Description { get; set; } = null!;

    public string ColorName { get; set; } = null!;

    public string SizeName { get; set; } = null!;

    public int SizeSequence { get; set; }

    public int Qty { get; set; }

    public bool InProduction { get; set; }
}

public class SkuUpdateRequest
{
    public string Sku { get; set; } = string.Empty;
}

public class SkuUpdateResponse
{
    public int SkuId { get; set; }

    public string Sku { get; set; } = string.Empty;
}

public class SkuBulkUpdateRowRequest
{
    public int RowNumber { get; set; }

    public int SkuId { get; set; }

    public string Sku { get; set; } = string.Empty;
}

public class SkuBulkUpdateRequest
{
    public List<SkuBulkUpdateRowRequest> Rows { get; set; } = new();
}

public class SkuBulkUpdateError
{
    public int RowNumber { get; set; }

    public int? SkuId { get; set; }

    public string Message { get; set; } = string.Empty;
}

public class SkuBulkUpdateResponse
{
    public bool Success { get; set; }

    public int Processed { get; set; }

    public int Updated { get; set; }

    public List<SkuBulkUpdateError> Errors { get; set; } = new();
}

public class SkuListResponse
{
    public List<SkuListItemDto> Items { get; set; } = new();

    public int Total { get; set; }
}

public class SkuLabelRequest
{
    public List<int> ItemColorIds { get; set; } = new();
}

public class SkuLabelRowDto
{
    public int ItemColorId { get; set; }

    public string Sku { get; set; } = null!;

    public string ItemNumber { get; set; } = null!;

    public string ColorName { get; set; } = null!;

    public string SizeName { get; set; } = null!;

    public int SizeSequence { get; set; }

    public int Qty { get; set; }
}
