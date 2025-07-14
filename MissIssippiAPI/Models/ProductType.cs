using System;
using System.Collections.Generic;

namespace MissIssippiAPI.Models;

public partial class ProductType
{
    public int ProductTypeId { get; set; }

    public string ProductTypeName { get; set; } = null!;

    public virtual ICollection<Style> Styles { get; set; } = new List<Style>();
}
