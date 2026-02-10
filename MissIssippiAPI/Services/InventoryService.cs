using Microsoft.EntityFrameworkCore;
using MissIssippiAPI.Data;
using MissIssippiAPI.Models;

namespace MissIssippiAPI.Services
{
    public class InventoryService
    {
        private readonly MissIssippiContext _context;

        public InventoryService(MissIssippiContext context)
        {
            _context = context;
        }

        public async Task<List<InventoryView>> GetInventoryAsync(
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
            var query = _context.InventoryViews.AsQueryable();

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

            if (!string.IsNullOrWhiteSpace(colorName))
            {
                query = query.Where(x => x.ColorName.Contains(colorName));
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

            return await query.ToListAsync();
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

        public async Task<bool> AddOrUpdateInventoryAsync(InventoryView? inventory)
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

        public async Task<bool> SaveInventoryUpdatesAsync(List<InventoryView> updates)
        {
            if (updates == null || updates.Count == 0)
            {
                return false;
            }

            foreach (var update in updates)
            {
                var existing = await _context.Inventories
                    .FirstOrDefaultAsync(x => x.InventoryId == update.InventoryId);

                if (existing != null)
                {
                    existing.Qty = update.Qty;
                    existing.SizeId = update.SizeId;
                    existing.ItemColorId = update.ItemColorId;
                }
                else
                {
                    _context.Inventories.Add(new Inventory
                    {
                        Qty = update.Qty,
                        SizeId = update.SizeId,
                        ItemColorId = update.ItemColorId
                    });
                }
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> SavePivotInventoryAsync(IEnumerable<InventoryPivotRow>? pivotRows)
        {
            if (pivotRows == null)
            {
                return false;
            }

            var updates = new List<InventoryView>();

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

                    updates.Add(new InventoryView
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

            return await SaveInventoryUpdatesAsync(updates);
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
            if (existingInventory != null)
            {
                _context.Inventories.Remove(existingInventory);
                await _context.SaveChangesAsync();
            }

            return true;
        }
    }
}
