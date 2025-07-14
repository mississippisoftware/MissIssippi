using System;
using System.Collections.Generic;

namespace MissIssippiAPI.Models;

public partial class Style
{
    public int StyleId { get; set; }

    public string StyleNumber { get; set; } = null!;

    public string? Description { get; set; }

    public int ProductTypeId { get; set; }

    public decimal? CostPrice { get; set; }

    public decimal? WholesalePrice { get; set; }

    public decimal? Weight { get; set; }

    public int SeasonId { get; set; }

    public DateTime StyleDateCreated { get; set; }

    public bool InProduction { get; set; }

    public virtual ProductType ProductType { get; set; } = null!;

    public virtual Season Season { get; set; } = null!;

    public virtual ICollection<StyleColor> StyleColors { get; set; } = new List<StyleColor>();
}
