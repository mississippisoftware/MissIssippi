using System.Collections.Generic;

namespace MissIssippiAPI.Models;

public class ItemColorSaveRequest
{
    public int ItemColorId { get; set; }

    public int ItemId { get; set; }

    public int ColorId { get; set; }

    public List<int>? SecondaryColorIds { get; set; }
}

public class ItemColorActiveRequest
{
    public int ItemColorId { get; set; }

    public bool Active { get; set; }
}
