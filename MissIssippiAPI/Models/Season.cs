using System;
using System.Collections.Generic;

namespace MissIssippiAPI.Models;

public partial class Season
{
    public int SeasonId { get; set; }

    public string SeasonName { get; set; } = null!;

    public DateTime SeasonDateCreated { get; set; }

    public bool? Active { get; set; }

    public virtual ICollection<Style> Styles { get; set; } = new List<Style>();
}
