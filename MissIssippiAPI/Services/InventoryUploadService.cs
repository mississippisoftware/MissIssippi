using System;
using Microsoft.EntityFrameworkCore;
using MissIssippiAPI.Data;
using MissIssippiAPI.Models;

namespace MissIssippiAPI.Services
{
    public class InventoryUploadService
    {
        private readonly MissIssippiContext _context;
        private readonly SkuService _skuService;

        private enum UploadMode
        {
            Replace,
            Add,
            Subtract
        }

        public InventoryUploadService(MissIssippiContext context, SkuService skuService)
        {
            _context = context;
            _skuService = skuService;
        }

        public async Task<InventoryUploadResult> UploadAsync(List<InventoryUploadRow>? rows, string? mode)
        {
            var result = new InventoryUploadResult();
            var uploadMode = ResolveMode(mode);

            if (rows == null || rows.Count == 0)
            {
                result.Errors.Add(new InventoryUploadError
                {
                    RowNumber = 0,
                    Message = "No rows provided."
                });
                return result;
            }

            var seasons = await _context.Seasons.AsNoTracking().ToListAsync();
            var items = await _context.Items.AsNoTracking().ToListAsync();
            var colors = await _context.Colors.AsNoTracking().ToListAsync();
            var sizes = await _context.Sizes.AsNoTracking().ToListAsync();

            var seasonMap = seasons.ToDictionary(s => NormalizeKey(s.SeasonName), s => s, StringComparer.OrdinalIgnoreCase);
            var colorMap = colors.ToDictionary(c => NormalizeKey(c.ColorName), c => c, StringComparer.OrdinalIgnoreCase);
            var sizeMap = sizes.ToDictionary(s => NormalizeKey(s.SizeName), s => s, StringComparer.OrdinalIgnoreCase);
            var itemMap = items.ToDictionary(
                s => BuildItemKey(s.SeasonId, s.ItemNumber),
                s => s,
                StringComparer.OrdinalIgnoreCase);

            var validatedRows = new List<UploadRowData>();
            var seenKeys = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            for (var index = 0; index < rows.Count; index++)
            {
                var row = rows[index];
                if (row == null)
                {
                    continue;
                }

                var rowNumber = row.RowNumber > 0 ? row.RowNumber : index + 2;
                var rowIssues = new List<string>();

                var seasonName = NormalizeKey(row.SeasonName);
                var itemNumber = NormalizeKey(row.ItemNumber);
                var colorName = NormalizeKey(row.ColorName);

                if (string.IsNullOrWhiteSpace(seasonName))
                {
                    rowIssues.Add("Season is required.");
                }

                if (string.IsNullOrWhiteSpace(itemNumber))
                {
                    rowIssues.Add("Item is required.");
                }

                if (string.IsNullOrWhiteSpace(colorName))
                {
                    rowIssues.Add("Color is required.");
                }

                Season? season = null;
                if (!string.IsNullOrWhiteSpace(seasonName))
                {
                    if (!seasonMap.TryGetValue(seasonName, out season))
                    {
                        rowIssues.Add($"Season '{row.SeasonName}' not found.");
                    }
                }

                Item? item = null;
                if (season != null && !string.IsNullOrWhiteSpace(itemNumber))
                {
                    var itemKey = BuildItemKey(season.SeasonId, itemNumber);
                    if (!itemMap.TryGetValue(itemKey, out item))
                    {
                        rowIssues.Add($"Item '{row.ItemNumber}' not found for season '{season.SeasonName}'.");
                    }
                }

                Color? color = null;
                if (!string.IsNullOrWhiteSpace(colorName))
                {
                    if (!colorMap.TryGetValue(colorName, out color))
                    {
                        rowIssues.Add($"Color '{row.ColorName}' not found.");
                    }
                }

                if (row.Sizes == null || row.Sizes.Count == 0)
                {
                    rowIssues.Add("No size columns provided.");
                }

                var sizeQuantities = new Dictionary<int, int>();
                if (row.Sizes != null)
                {
                    foreach (var entry in row.Sizes)
                    {
                        var sizeKey = NormalizeKey(entry.Key);
                        if (!sizeMap.TryGetValue(sizeKey, out var size))
                        {
                            rowIssues.Add($"Size '{entry.Key}' is not recognized.");
                            continue;
                        }

                        var qty = entry.Value ?? 0;
                        if (qty < 0)
                        {
                            rowIssues.Add($"Quantity for size '{size.SizeName}' cannot be negative.");
                            continue;
                        }

                        sizeQuantities[size.SizeId] = qty;
                    }
                }

                if (season != null && item != null && color != null)
                {
                    var uniqueKey = $"{season.SeasonId}|{item.ItemId}|{color.ColorId}";
                    if (!seenKeys.Add(uniqueKey))
                    {
                        rowIssues.Add("Duplicate season/item/color combination.");
                    }
                }

                if (rowIssues.Count > 0)
                {
                    result.Errors.Add(new InventoryUploadError
                    {
                        RowNumber = rowNumber,
                        Message = string.Join(" ", rowIssues)
                    });
                    continue;
                }

                if (season == null || item == null || color == null)
                {
                    result.Errors.Add(new InventoryUploadError
                    {
                        RowNumber = rowNumber,
                        Message = "Unable to resolve season, item, or color."
                    });
                    continue;
                }

                validatedRows.Add(new UploadRowData
                {
                    RowNumber = rowNumber,
                    SeasonId = season.SeasonId,
                    ItemId = item.ItemId,
                    ColorId = color.ColorId,
                    SizeQuantities = sizeQuantities
                });
            }

            if (result.Errors.Count > 0)
            {
                return result;
            }

            await using var transaction = await _context.Database.BeginTransactionAsync();

            foreach (var row in validatedRows)
            {
                var itemColor = await _context.ItemColors
                    .FirstOrDefaultAsync(sc => sc.ItemId == row.ItemId && sc.ColorId == row.ColorId);

                if (itemColor == null)
                {
                    itemColor = new ItemColor
                    {
                        ItemId = row.ItemId,
                        ColorId = row.ColorId
                    };
                    _context.ItemColors.Add(itemColor);
                    await _context.SaveChangesAsync();
                    result.CreatedItemColors += 1;
                }

                var item = await _context.Items
                    .AsNoTracking()
                    .FirstOrDefaultAsync(x => x.ItemId == row.ItemId);
                if (item?.InProduction == true)
                {
                    result.CreatedSkus += await _skuService.EnsureSkusForItemColorAsync(itemColor.ItemColorId);
                }

                foreach (var entry in row.SizeQuantities)
                {
                    var sizeId = entry.Key;
                    var qty = entry.Value;

                    var inventory = await _context.Inventories
                        .FirstOrDefaultAsync(i => i.ItemColorId == itemColor.ItemColorId && i.SizeId == sizeId);

                    if (inventory == null)
                    {
                        var newQty = ApplyMode(qty, 0, uploadMode);
                        _context.Inventories.Add(new Inventory
                        {
                            ItemColorId = itemColor.ItemColorId,
                            SizeId = sizeId,
                            Qty = newQty
                        });
                        result.CreatedInventory += 1;
                    }
                    else
                    {
                        inventory.Qty = ApplyMode(qty, inventory.Qty, uploadMode);
                        result.UpdatedInventory += 1;
                    }
                }
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            result.ProcessedRows = validatedRows.Count;
            return result;
        }

        private static UploadMode ResolveMode(string? mode)
        {
            if (string.IsNullOrWhiteSpace(mode))
            {
                return UploadMode.Replace;
            }

            if (mode.Equals("add", StringComparison.OrdinalIgnoreCase))
            {
                return UploadMode.Add;
            }

            if (mode.Equals("subtract", StringComparison.OrdinalIgnoreCase) || mode.Equals("remove", StringComparison.OrdinalIgnoreCase))
            {
                return UploadMode.Subtract;
            }

            if (mode.Equals("change", StringComparison.OrdinalIgnoreCase) || mode.Equals("replace", StringComparison.OrdinalIgnoreCase))
            {
                return UploadMode.Replace;
            }

            return UploadMode.Replace;
        }

        private static int ApplyMode(int qty, int existingQty, UploadMode mode)
        {
            var nextQty = mode switch
            {
                UploadMode.Add => existingQty + qty,
                UploadMode.Subtract => existingQty - qty,
                _ => qty
            };

            return Math.Max(0, nextQty);
        }

        private static string NormalizeKey(string? value)
        {
            return (value ?? string.Empty).Trim();
        }

        private static string BuildItemKey(int seasonId, string? itemNumber)
        {
            return $"{seasonId}|{NormalizeKey(itemNumber)}";
        }

        private sealed class UploadRowData
        {
            public int RowNumber { get; init; }

            public int SeasonId { get; init; }

            public int ItemId { get; init; }

            public int ColorId { get; init; }

            public Dictionary<int, int> SizeQuantities { get; init; } = new();
        }
    }
}
