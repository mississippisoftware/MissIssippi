using System;
using System.Collections.Generic;

namespace MissIssippiAPI.Models;

public partial class InventoryAdjustmentBatch
{
    public Guid BatchId { get; set; }

    public DateTime BatchTimestamp { get; set; }

    public string Source { get; set; } = null!;

    public string? Notes { get; set; }

    public virtual ICollection<InventoryActivityLog> InventoryActivityLogs { get; set; } = new List<InventoryActivityLog>();
}
