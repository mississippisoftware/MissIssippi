using System;
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

    public string? IdempotencyKey { get; set; }

    public bool AllowPartial { get; set; }

    public bool AllowDuplicateDataset { get; set; }

    public string? MissingSizeBehavior { get; set; }

    public string? UserNote { get; set; }
}

public class InventoryUploadError
{
    public int RowNumber { get; set; }

    public string Message { get; set; } = string.Empty;
}

public class InventoryUploadWarning
{
    public int RowNumber { get; set; }

    public string Message { get; set; } = string.Empty;
}

public class InventoryUploadIssue
{
    public int RowNumber { get; set; }

    public string Severity { get; set; } = "error";

    public string Code { get; set; } = string.Empty;

    public string Field { get; set; } = string.Empty;

    public string Message { get; set; } = string.Empty;

    public List<string> Suggestions { get; set; } = new();
}

public class InventoryUploadPreflightResult
{
    public bool CanUpload { get; set; }

    public bool DuplicateDatasetDetected { get; set; }

    public Guid? DuplicateUploadBatchId { get; set; }

    public string? DatasetHash { get; set; }

    public int TotalRows { get; set; }

    public int ValidRows { get; set; }

    public int InvalidRows { get; set; }

    public int WarningCount { get; set; }

    public int ErrorCount { get; set; }

    public List<InventoryUploadIssue> Issues { get; set; } = new();
}

public class InventoryUploadResult
{
    public bool Success { get; set; }

    public bool PartialApplied { get; set; }

    public bool DuplicateDatasetDetected { get; set; }

    public bool Undone { get; set; }

    public string? Message { get; set; }

    public string? DatasetHash { get; set; }

    public Guid? UploadBatchId { get; set; }

    public Guid? InventoryHistoryBatchId { get; set; }

    public int ProcessedRows { get; set; }

    public int CreatedSkus { get; set; }

    public int CreatedItemColors { get; set; }

    public int CreatedInventory { get; set; }

    public int UpdatedInventory { get; set; }

    public List<InventoryUploadWarning> Warnings { get; set; } = new();

    public List<InventoryUploadError> Errors { get; set; } = new();
}

public class InventoryUploadBatchSummaryDto
{
    public Guid UploadBatchId { get; set; }

    public DateTime CreatedAt { get; set; }

    public string Status { get; set; } = string.Empty;

    public string Mode { get; set; } = string.Empty;

    public string DatasetHash { get; set; } = string.Empty;

    public int RowCount { get; set; }

    public int ProcessedRows { get; set; }

    public int ErrorCount { get; set; }

    public int WarningCount { get; set; }

    public bool IsUndone { get; set; }

    public Guid? InventoryHistoryBatchId { get; set; }

    public Guid? UndoHistoryBatchId { get; set; }

    public string? Message { get; set; }
}
