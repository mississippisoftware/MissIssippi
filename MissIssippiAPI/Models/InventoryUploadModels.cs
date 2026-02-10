using System.Collections.Generic;

namespace MissIssippiAPI.Models;

public class InventoryUploadRow
{
    public int RowNumber { get; set; }

    public string? SeasonName { get; set; }

    public string? ItemNumber { get; set; }

    public string? ColorName { get; set; }

    public Dictionary<string, int?> Sizes { get; set; } = new();
}

public class InventoryUploadRequest
{
    public List<InventoryUploadRow> Rows { get; set; } = new();

    public string? Mode { get; set; }
}

public class InventoryUploadError
{
    public int RowNumber { get; set; }

    public string Message { get; set; } = string.Empty;
}

public class InventoryUploadResult
{
    public int ProcessedRows { get; set; }

    public int CreatedSkus { get; set; }

    public int CreatedItemColors { get; set; }

    public int CreatedInventory { get; set; }

    public int UpdatedInventory { get; set; }

    public List<InventoryUploadError> Errors { get; set; } = new();
}
