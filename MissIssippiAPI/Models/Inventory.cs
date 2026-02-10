using System;
using System.Collections.Generic;

namespace MissIssippiAPI.Models;

public partial class Inventory
{
    public int InventoryId { get; set; }

    public int ItemColorId { get; set; }

    public int SizeId { get; set; }

    public int Qty { get; set; }

    public int InStock { get; set; }

    public virtual Size Size { get; set; } = null!;

    public virtual ItemColor ItemColor { get; set; } = null!;
}
