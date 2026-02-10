using System;
using System.Collections.Generic;

namespace MissIssippiAPI.Models;

public partial class ItemView
{
    public int ItemId { get; set; }

    public string ItemNumber { get; set; } = null!;

    public string Description { get; set; } = string.Empty;

    public decimal? CostPrice { get; set; }

    public decimal? WholesalePrice { get; set; }

    public decimal? Weight { get; set; }

    public int SeasonId { get; set; }

    public string SeasonName { get; set; } = null!;

    public DateTime SeasonDateCreated { get; set; }

    public bool? SeasonActive { get; set; }

    public DateTime ItemDateCreated { get; set; }

    public bool InProduction { get; set; }
}
