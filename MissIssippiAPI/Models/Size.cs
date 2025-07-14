using System;
using System.Collections.Generic;

namespace MissIssippiAPI.Models;

public partial class Size
{
    public int SizeId { get; set; }

    public string SizeName { get; set; } = null!;

    public int SizeSequence { get; set; }

    public virtual ICollection<Inventory> Inventories { get; set; } = new List<Inventory>();

    public virtual ICollection<InventoryActivityLog> InventoryActivityLogs { get; set; } = new List<InventoryActivityLog>();
}
