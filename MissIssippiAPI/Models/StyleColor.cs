using System;
using System.Collections.Generic;

namespace MissIssippiAPI.Models;

public partial class StyleColor
{
    public int StyleColorId { get; set; }

    public int StyleId { get; set; }

    public int ColorId { get; set; }

    public virtual Color Color { get; set; } = null!;

    public virtual ICollection<Inventory> Inventories { get; set; } = new List<Inventory>();

    public virtual ICollection<InventoryActivityLog> InventoryActivityLogs { get; set; } = new List<InventoryActivityLog>();

    public virtual Style Style { get; set; } = null!;
}
