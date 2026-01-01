namespace MissIssippiAPI.Models
{
    public class InventoryPivotRow
    {
        public string StyleNumber { get; set; } = string.Empty;

        public string ColorName { get; set; } = string.Empty;

        public int StyleId { get; set; }

        public int ColorId { get; set; }

        public int StyleColorId { get; set; }

        public string? SeasonName { get; set; }

        public Dictionary<string, InventoryPivotCell> Sizes { get; set; } = new();
    }
}
