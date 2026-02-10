using System;
using System.Collections.Generic;

namespace MissIssippiAPI.Models;

public partial class ItemImage
{
    public int ItemImageId { get; set; }

    public int ItemColorId { get; set; }

    public int ImageTypeId { get; set; }

    public string? ImageUrl { get; set; }

    public int ImageSequenceWithinType { get; set; }

    public int ImageSequence { get; set; }

    public virtual ImageType ImageType { get; set; } = null!;

    public virtual ItemColor ItemColor { get; set; } = null!;
}
