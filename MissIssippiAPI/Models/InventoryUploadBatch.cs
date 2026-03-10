using System;

namespace MissIssippiAPI.Models;

public partial class InventoryUploadBatch
{
    public Guid UploadBatchId { get; set; }

    public DateTime CreatedAt { get; set; }

    public string Status { get; set; } = null!;

    public string Mode { get; set; } = null!;

    public string DatasetHash { get; set; } = null!;

    public string? IdempotencyKey { get; set; }

    public int RowCount { get; set; }

    public int ProcessedRows { get; set; }

    public int ErrorCount { get; set; }

    public int WarningCount { get; set; }

    public int CreatedSkus { get; set; }

    public int CreatedItemColors { get; set; }

    public int CreatedInventory { get; set; }

    public int UpdatedInventory { get; set; }

    public bool IsUndone { get; set; }

    public DateTime? UndoneAt { get; set; }

    public Guid? DuplicateOfUploadBatchId { get; set; }

    public Guid? InventoryHistoryBatchId { get; set; }

    public Guid? UndoHistoryBatchId { get; set; }

    public string? Message { get; set; }

    public string? ResultJson { get; set; }
}
