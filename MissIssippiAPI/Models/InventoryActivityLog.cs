using System;
using System.Collections.Generic;

namespace MissIssippiAPI.Models;

public partial class InventoryActivityLog
{
    public int InventoryActivityLogId { get; set; }

    public int ItemColorId { get; set; }

    public int SizeId { get; set; }

    public int Qty { get; set; }

    public string ActionType { get; set; } = null!;

    public DateTime InventoryActivityDate { get; set; }

    public virtual Size Size { get; set; } = null!;

    public virtual ItemColor ItemColor { get; set; } = null!;
}
