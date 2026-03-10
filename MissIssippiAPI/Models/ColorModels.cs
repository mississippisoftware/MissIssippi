namespace MissIssippiAPI.Models;

public class ColorDto
{
    public int ColorId { get; set; }

    public string ColorName { get; set; } = null!;

    public int? SeasonId { get; set; }

    public string? Collection { get; set; }

    public string? PantoneColor { get; set; }

    public string? HexValue { get; set; }
}

public class ColorSaveRequest
{
    public int ColorId { get; set; }

    public string ColorName { get; set; } = null!;

    public int? SeasonId { get; set; }

    public string? Collection { get; set; }

    public string? PantoneColor { get; set; }

    public string? HexValue { get; set; }
}

public class ColorMigrationRequest
{
    public int SourceColorId { get; set; }

    public int TargetColorId { get; set; }
}
