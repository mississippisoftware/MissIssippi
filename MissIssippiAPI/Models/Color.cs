using System;
using System.Collections.Generic;

namespace MissIssippiAPI.Models;

public partial class Color
{
    public int ColorId { get; set; }

    public string ColorName { get; set; } = null!;

    public int? SeasonId { get; set; }

    public string? PantoneColor { get; set; }

    public string? HexValue { get; set; }

    public virtual ICollection<ItemColor> ItemColors { get; set; } = new List<ItemColor>();

    public virtual Season? Season { get; set; }
}
