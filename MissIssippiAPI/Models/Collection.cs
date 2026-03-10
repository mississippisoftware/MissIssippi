using System;
using System.Collections.Generic;

namespace MissIssippiAPI.Models;

public partial class Collection
{
    public int CollectionId { get; set; }

    public string CollectionName { get; set; } = null!;

    public virtual ICollection<Color> Colors { get; set; } = new List<Color>();
}
