using System;
using System.Collections.Generic;

namespace MissIssippiAPI.Models;

public partial class Sku
{
    public int SkuId { get; set; }

    public int ItemColorId { get; set; }

    public int SizeId { get; set; }

    public string SkuValue { get; set; } = null!;

    public virtual ItemColor ItemColor { get; set; } = null!;

    public virtual Size Size { get; set; } = null!;
}
