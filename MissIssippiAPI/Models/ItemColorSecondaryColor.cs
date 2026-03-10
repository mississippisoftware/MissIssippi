namespace MissIssippiAPI.Models;

public partial class ItemColorSecondaryColor
{
    public int ItemColorId { get; set; }

    public int SecondaryColorId { get; set; }

    public int SortOrder { get; set; }

    public virtual ItemColor ItemColor { get; set; } = null!;

    public virtual Color SecondaryColor { get; set; } = null!;
}
