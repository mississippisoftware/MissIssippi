using System;
using System.Collections.Generic;

namespace MissIssippiAPI.Models;

public class InventoryHistoryBatchDto
{
    public Guid BatchId { get; set; }

    public DateTime BatchTimestamp { get; set; }

    public string Source { get; set; } = null!;

    public string? Notes { get; set; }

    public int TotalLines { get; set; }

    public int TotalDelta { get; set; }
}

public class InventoryHistoryLineDto
{
    public string? Sku { get; set; }

    public string ItemNumber { get; set; } = null!;

    public string SeasonName { get; set; } = null!;

    public string ColorName { get; set; } = null!;

    public string SizeName { get; set; } = null!;

    public int OldQty { get; set; }

    public int NewQty { get; set; }

    public int Delta { get; set; }
}

public class InventoryHistoryBatchDetailsDto
{
    public Guid BatchId { get; set; }

    public DateTime BatchTimestamp { get; set; }

    public string Source { get; set; } = null!;

    public string? Notes { get; set; }

    public int TotalLines { get; set; }

    public int TotalDelta { get; set; }

    public List<InventoryHistoryLineDto> Lines { get; set; } = new();
}
