namespace MissIssippiAPI.Models
{
    public class InventoryPivotRow
    {
        public string ItemNumber { get; set; } = string.Empty;

        public string ColorName { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public int ItemId { get; set; }

        public int ColorId { get; set; }

        public int ItemColorId { get; set; }

        public string? SeasonName { get; set; }

        public Dictionary<string, InventoryPivotCell> Sizes { get; set; } = new();
    }
}
