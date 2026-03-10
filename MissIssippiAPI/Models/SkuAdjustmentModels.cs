using System.Collections.Generic;

namespace MissIssippiAPI.Models;

public class SkuAdjustmentRequest
{
    public string Sku { get; set; } = null!;

    public int Delta { get; set; }
}

public class SkuAdjustmentsRequest
{
    public List<SkuAdjustmentRequest> Adjustments { get; set; } = new();

    public string? Notes { get; set; }
}

public class SkuAdjustmentsResult
{
    public int UpdatedCount { get; set; }

    public List<string> MissingSkus { get; set; } = new();
}
