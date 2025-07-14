using System;
using System.Collections.Generic;

namespace MissIssippiAPI.Models;

public partial class StyleView
{
    public int StyleId { get; set; }

    public string StyleNumber { get; set; } = null!;

    public string? Description { get; set; }

    public int ProductTypeId { get; set; }

    public string ProductTypeName { get; set; } = null!;

    public decimal? CostPrice { get; set; }

    public decimal? WholesalePrice { get; set; }

    public decimal? Weight { get; set; }

    public int SeasonId { get; set; }

    public string SeasonName { get; set; } = null!;

    public DateTime SeasonDateCreated { get; set; }

    public bool? SeasonActive { get; set; }

    public DateTime StyleDateCreated { get; set; }

    public bool InProduction { get; set; }
}
