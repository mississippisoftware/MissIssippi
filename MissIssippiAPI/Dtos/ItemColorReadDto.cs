namespace MissIssippiAPI.Dtos;

public class ItemColorReadDto
{
    public string ItemNumber { get; set; } = null!;

    public string ColorName { get; set; } = null!;

    public string? Collection { get; set; }

    public string? PantoneColor { get; set; }

    public string? HexValue { get; set; }

    public int? ColorSeasonId { get; set; }

    public string SeasonName { get; set; } = null!;

    public int ItemColorId { get; set; }

    public int ColorId { get; set; }

    public int ItemId { get; set; }

    public int SeasonId { get; set; }

    public bool ItemColorActive { get; set; }
}
