using System;
using System.Collections.Generic;

namespace MissIssippiAPI.Models;

public partial class Color
{
    public int ColorId { get; set; }

    public string ColorName { get; set; } = null!;

    public virtual ICollection<StyleColor> StyleColors { get; set; } = new List<StyleColor>();
}
