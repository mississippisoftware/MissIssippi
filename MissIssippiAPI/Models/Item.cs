using System;
using System.Collections.Generic;

namespace MissIssippiAPI.Models;

public partial class Item
{
    public int ItemId { get; set; }

    public string ItemNumber { get; set; } = null!;

    public string Description { get; set; } = string.Empty;

    public decimal? CostPrice { get; set; }

    public decimal? WholesalePrice { get; set; }

    public decimal? Weight { get; set; }

    public int SeasonId { get; set; }

    public DateTime ItemDateCreated { get; set; }

    public bool InProduction { get; set; }

    public virtual Season Season { get; set; } = null!;

    public virtual ICollection<ItemColor> ItemColors { get; set; } = new List<ItemColor>();
}
