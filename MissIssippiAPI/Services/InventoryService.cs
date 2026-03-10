using Microsoft.EntityFrameworkCore;
using MissIssippiAPI.Data;
using MissIssippiAPI.Dtos;
using MissIssippiAPI.Models;

namespace MissIssippiAPI.Services
{
    public class InventoryService
    {
        private readonly MissIssippiContext _context;
        private readonly InventoryHistoryLogger _historyLogger;

        public InventoryService(MissIssippiContext context, InventoryHistoryLogger historyLogger)
        {
            _context = context;
            _historyLogger = historyLogger;
        }

        public async Task<List<InventoryRowDto>> GetInventoryAsync(
            string? itemNumber = null,
            string? description = null,
            string? colorName = null,
            string? sizeName = null,
            string? seasonName = null,
            int? inventoryId = null,
            int? itemColorId = null,
            int? itemId = null,
            int? colorId = null,
            int? sizeId = null,
            int? seasonId = null)
        {
            var query =
                from inv in _context.Inventories.AsNoTracking()
                join sc in _context.ItemColors.AsNoTracking() on inv.ItemColorId equals sc.ItemColorId
                join item in _context.Items.AsNoTracking() on sc.ItemId equals item.ItemId
                join season in _context.Seasons.AsNoTracking() on item.SeasonId equals season.SeasonId
                join color in _context.Colors.AsNoTracking() on sc.ColorId equals color.ColorId
                join size in _context.Sizes.AsNoTracking() on inv.SizeId equals size.SizeId
                where sc.Active == true
                select new
                {
                    ItemNumber = item.ItemNumber,
                    Description = item.Description,
                    PrimaryColorName = color.ColorName,
                    SizeName = size.SizeName,
                    Qty = inv.Qty,
                    SeasonName = season.SeasonName,
                    InStock = inv.InStock,
                    InventoryId = inv.InventoryId,
                    ItemColorId = inv.ItemColorId,
                    ItemId = item.ItemId,
                    ColorId = color.ColorId,
                    SizeId = inv.SizeId,
                    SeasonId = season.SeasonId,
                };

            if (!string.IsNullOrWhiteSpace(itemNumber))
            {
                var itemNumbers = itemNumber
                    .Split(new[] { ',', ';', '\n', '\r', '\t', ' ' }, StringSplitOptions.RemoveEmptyEntries)
                    .Select(s => s.Trim())
                    .Where(s => !string.IsNullOrWhiteSpace(s))
                    .Distinct()
                    .ToArray();

                if (itemNumbers.Length == 1)
                {
                    query = query.Where(x => x.ItemNumber.Contains(itemNumbers[0]));
                }
                else if (itemNumbers.Length > 1)
                {
                    query = query.Where(x => itemNumbers.Contains(x.ItemNumber));
                }
            }

            if (!string.IsNullOrWhiteSpace(description))
            {
                query = query.Where(x => x.Description != null && x.Description.Contains(description));
            }

            if (!string.IsNullOrWhiteSpace(sizeName))
            {
                query = query.Where(x => x.SizeName.Contains(sizeName));
            }

            if (!string.IsNullOrWhiteSpace(seasonName))
            {
                query = query.Where(x => x.SeasonName.Contains(seasonName) || x.SeasonName == "Legacy");
            }

            if (inventoryId.HasValue)
            {
                query = query.Where(x => x.InventoryId == inventoryId.Value);
            }

            if (itemColorId.HasValue)
            {
                query = query.Where(x => x.ItemColorId == itemColorId.Value);
            }

            if (itemId.HasValue)
            {
                query = query.Where(x => x.ItemId == itemId.Value);
            }

            if (colorId.HasValue)
            {
                query = query.Where(x => x.ColorId == colorId.Value);
            }

            if (sizeId.HasValue)
            {
                query = query.Where(x => x.SizeId == sizeId.Value);
            }

            if (seasonId.HasValue)
            {
                query = query.Where(x => x.SeasonId == seasonId.Value);
            }

            var baseRows = await query.ToListAsync();
            if (baseRows.Count == 0)
            {
                return new List<InventoryRowDto>();
            }

            var itemColorIds = baseRows.Select(row => row.ItemColorId).Distinct().ToList();
            var secondaryRows = await (
                from isc in _context.ItemColorSecondaryColors.AsNoTracking()
                join c2 in _context.Colors.AsNoTracking() on isc.SecondaryColorId equals c2.ColorId
                where itemColorIds.Contains(isc.ItemColorId)
                orderby isc.ItemColorId, isc.SortOrder, c2.ColorName
                select new
                {
                    isc.ItemColorId,
                    c2.ColorName
                }).ToListAsync();

            var secondaryMap = secondaryRows
                .GroupBy(row => row.ItemColorId)
                .ToDictionary(
                    group => group.Key,
                    group => string.Join("+", group.Select(row => row.ColorName))
                );

            var results = baseRows.Select(row =>
            {
                secondaryMap.TryGetValue(row.ItemColorId, out var secondaryNames);
                var fullColorName = row.PrimaryColorName;
                if (!string.IsNullOrWhiteSpace(secondaryNames))
                {
                    fullColorName = $"{fullColorName}+{secondaryNames}";
                }

                return new InventoryRowDto
                {
                    ItemNumber = row.ItemNumber,
                    Description = row.Description,
                    ColorName = fullColorName,
                    SizeName = row.SizeName,
                    Qty = row.Qty,
                    SeasonName = row.SeasonName,
                    InStock = row.InStock,
                    InventoryId = row.InventoryId,
                    ItemColorId = row.ItemColorId,
                    ItemId = row.ItemId,
                    ColorId = row.ColorId,
                    SizeId = row.SizeId,
                    SeasonId = row.SeasonId
                };
            }).ToList();

            if (!string.IsNullOrWhiteSpace(colorName))
            {
                results = results
                    .Where(row =>
                        row.ColorName != null
                        && row.ColorName.IndexOf(colorName, StringComparison.OrdinalIgnoreCase) >= 0)
                    .ToList();
            }

            return results;
        }

        public async Task<IEnumerable<InventoryPivotRow>> GetPivotInventoryAsync(
            string? itemNumber = null,
            string? description = null,
            string? colorName = null,
            string? sizeName = null,
            string? seasonName = null,
            int? inventoryId = null,
            int? itemColorId = null,
            int? itemId = null,
            int? colorId = null,
            int? sizeId = null,
            int? seasonId = null)
        {
            var inventory = await GetInventoryAsync(
                itemNumber,
                description,
                colorName,
                sizeName,
                seasonName,
                inventoryId,
                itemColorId,
                itemId,
                colorId,
                sizeId,
                seasonId);

            return inventory
                .OrderBy(i => i.ItemNumber)
                .ThenBy(i => i.ColorName)
                .GroupBy(i => new { i.ItemColorId, i.ItemNumber, i.ColorName })
                .Select(group =>
                {
                    var first = group.First();

                    return new InventoryPivotRow
                    {
                        ItemNumber = group.Key.ItemNumber,
                        ColorName = group.Key.ColorName,
                        Description = first.Description ?? string.Empty,
                        ItemId = first.ItemId,
                        ColorId = first.ColorId,
                        ItemColorId = group.Key.ItemColorId,
                        SeasonName = first.SeasonName,
                        Sizes = group
                            .GroupBy(x => x.SizeName)
                            .ToDictionary(
                                x => x.Key,
                                x => new InventoryPivotCell
                                {
                                    Qty = x.First().Qty,
                                    InventoryId = x.First().InventoryId,
                                    SizeId = x.First().SizeId
                                })
                    };
                });
        }

        public async Task<bool> AddOrUpdateInventoryAsync(InventoryRowDto? inventory)
        {
            if (inventory == null)
            {
                return false;
            }

            var existingInventory = await _context.Inventories
                .FirstOrDefaultAsync(x => x.InventoryId == inventory.InventoryId);

            if (existingInventory != null)
            {
                existingInventory.ItemColorId = inventory.ItemColorId;
                existingInventory.SizeId = inventory.SizeId;
                existingInventory.Qty = inventory.Qty;
            }
            else
            {
                var newInventory = new Inventory
                {
                    ItemColorId = inventory.ItemColorId,
                    SizeId = inventory.SizeId,
                    Qty = inventory.Qty
                };

                await _context.Inventories.AddAsync(newInventory);
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> SaveInventoryUpdatesAsync(List<InventoryRowDto> updates, string? source = null)
        {
            if (updates == null || updates.Count == 0)
            {
                return false;
            }

            var trackHistory = !string.IsNullOrWhiteSpace(source);
            var changes = trackHistory ? new List<InventoryHistoryChange>() : null;

            var updateIds = updates
                .Select(update => update.InventoryId)
                .Where(id => id > 0)
                .Distinct()
                .ToList();

            var existingInventory = updateIds.Count == 0
                ? new Dictionary<int, Inventory>()
                : await _context.Inventories
                    .Where(x => updateIds.Contains(x.InventoryId))
                    .ToDictionaryAsync(x => x.InventoryId);

            foreach (var update in updates)
            {
                if (update.InventoryId > 0 && existingInventory.TryGetValue(update.InventoryId, out var existing))
                {
                    var oldQty = existing.Qty;
                    existing.Qty = update.Qty;
                    existing.SizeId = update.SizeId;
                    existing.ItemColorId = update.ItemColorId;
                    if (trackHistory && update.Qty != oldQty)
                    {
                        changes!.Add(new InventoryHistoryChange
                        {
                            ItemColorId = update.ItemColorId,
                            SizeId = update.SizeId,
                            OldQty = oldQty,
                            NewQty = update.Qty
                        });
                    }
                    continue;
                }

                var oldNewQty = 0;
                _context.Inventories.Add(new Inventory
                {
                    Qty = update.Qty,
                    SizeId = update.SizeId,
                    ItemColorId = update.ItemColorId
                });
                if (trackHistory && update.Qty != oldNewQty)
                {
                    changes!.Add(new InventoryHistoryChange
                    {
                        ItemColorId = update.ItemColorId,
                        SizeId = update.SizeId,
                        OldQty = oldNewQty,
                        NewQty = update.Qty
                    });
                }
            }

            await _context.SaveChangesAsync();

            if (trackHistory && changes!.Count > 0)
            {
                try
                {
                    await _historyLogger.LogAdjustmentsAsync(source!, changes);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Inventory history logging failed: {ex.Message}");
                }
            }
            return true;
        }

        public async Task<bool> SavePivotInventoryAsync(
            IEnumerable<InventoryPivotRow>? pivotRows,
            string? source = null)
        {
            if (pivotRows == null)
            {
                return false;
            }

            var updates = new List<InventoryRowDto>();

            foreach (var row in pivotRows)
            {
                if (row == null || row.ItemColorId == 0 || row.Sizes == null)
                {
                    continue;
                }

                foreach (var cell in row.Sizes.Values)
                {
                    if (cell == null)
                    {
                        continue;
                    }

                    updates.Add(new InventoryRowDto
                    {
                        InventoryId = cell.InventoryId ?? 0,
                        ItemColorId = row.ItemColorId,
                        SizeId = cell.SizeId,
                        Qty = cell.Qty,
                        // The rest of the view properties are not required for persistence here.
                    });
                }
            }

            if (updates.Count == 0)
            {
                return false;
            }

            return await SaveInventoryUpdatesAsync(updates, source);
        }

        public async Task<int> EnsureInventoryForItemColorAsync(int itemColorId)
        {
            var sizes = await _context.Sizes.AsNoTracking()
                .OrderBy(x => x.SizeSequence)
                .ToListAsync();

            var existingSizeIds = await _context.Inventories
                .Where(x => x.ItemColorId == itemColorId)
                .Select(x => x.SizeId)
                .ToListAsync();

            var existingSet = new HashSet<int>(existingSizeIds);
            var newRows = new List<Inventory>();

            foreach (var size in sizes)
            {
                if (existingSet.Contains(size.SizeId))
                {
                    continue;
                }

                newRows.Add(new Inventory
                {
                    ItemColorId = itemColorId,
                    SizeId = size.SizeId,
                    Qty = 0
                });
            }

            if (newRows.Count > 0)
            {
                _context.Inventories.AddRange(newRows);
                await _context.SaveChangesAsync();
            }

            return newRows.Count;
        }

        public async Task<int> EnsureInventoryForItemColorFromSkusAsync(int itemColorId)
        {
            var skuSizeIds = await _context.Skus.AsNoTracking()
                .Where(x => x.ItemColorId == itemColorId)
                .Select(x => x.SizeId)
                .Distinct()
                .ToListAsync();

            if (skuSizeIds.Count == 0)
            {
                return 0;
            }

            var existingSizeIds = await _context.Inventories
                .Where(x => x.ItemColorId == itemColorId)
                .Select(x => x.SizeId)
                .ToListAsync();

            var existingSet = new HashSet<int>(existingSizeIds);
            var newRows = new List<Inventory>();

            foreach (var sizeId in skuSizeIds)
            {
                if (existingSet.Contains(sizeId))
                {
                    continue;
                }

                newRows.Add(new Inventory
                {
                    ItemColorId = itemColorId,
                    SizeId = sizeId,
                    Qty = 0
                });
            }

            if (newRows.Count > 0)
            {
                _context.Inventories.AddRange(newRows);
                await _context.SaveChangesAsync();
            }

            return newRows.Count;
        }

        public string? ValidatePivotUpdates(IEnumerable<InventoryPivotRow>? pivotRows)
        {
            if (pivotRows == null)
            {
                return "No updates provided";
            }

            if (!pivotRows.Any())
            {
                return "No updates provided";
            }

            return null;
        }

        public async Task<bool> DeleteInventoryAsync(int inventoryId)
        {
            var existingInventory = await _context.Inventories.FindAsync(inventoryId);
            if (existingInventory == null)
            {
                return false;
            }

            _context.Inventories.Remove(existingInventory);
            await _context.SaveChangesAsync();

            return true;
        }
    }
}
