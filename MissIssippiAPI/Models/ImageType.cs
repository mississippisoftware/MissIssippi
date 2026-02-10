using System;
using System.Collections.Generic;

namespace MissIssippiAPI.Models;

public partial class ImageType
{
    public int ImageTypeId { get; set; }

    public string Type { get; set; } = null!;

    public int Sequence { get; set; }

    public virtual ICollection<ItemImage> ItemImages { get; set; } = new List<ItemImage>();
}
