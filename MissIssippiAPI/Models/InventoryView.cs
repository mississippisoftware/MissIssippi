using System;
using System.Collections.Generic;

namespace MissIssippiAPI.Models;

public partial class InventoryView
{
    public string StyleNumber { get; set; } = null!;

    public string? Description { get; set; }

    public string ColorName { get; set; } = null!;

    public string SizeName { get; set; } = null!;

    public int Qty { get; set; }

    public string SeasonName { get; set; } = null!;

    public int InStock { get; set; }

    public int InventoryId { get; set; }

    public int StyleColorId { get; set; }

    public int StyleId { get; set; }

    public int ColorId { get; set; }

    public int SizeId { get; set; }

    public int SeasonId { get; set; }
}
