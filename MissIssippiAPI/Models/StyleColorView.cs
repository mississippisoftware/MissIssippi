using System;
using System.Collections.Generic;

namespace MissIssippiAPI.Models;

public partial class StyleColorView
{
    public string StyleNumber { get; set; } = null!;

    public string ColorName { get; set; } = null!;

    public string SeasonName { get; set; } = null!;

    public int StyleColorId { get; set; }

    public int ColorId { get; set; }

    public int StyleId { get; set; }

    public int SeasonId { get; set; }
}
