using System;
using System.Collections.Generic;

namespace MissIssippiAPI.Models;

public partial class ItemColor
{
    public int ItemColorId { get; set; }

    public int ItemId { get; set; }

    public int ColorId { get; set; }

    public virtual Color Color { get; set; } = null!;

    public virtual ICollection<Inventory> Inventories { get; set; } = new List<Inventory>();

    public virtual ICollection<InventoryActivityLog> InventoryActivityLogs { get; set; } = new List<InventoryActivityLog>();

    public virtual ICollection<ItemImage> ItemImages { get; set; } = new List<ItemImage>();

    public virtual ICollection<Sku> Skus { get; set; } = new List<Sku>();

    public virtual Item Item { get; set; } = null!;
}
