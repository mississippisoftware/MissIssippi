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
            string? styleNumber = null,
            string? description = null,
            string? colorName = null,
            string? sizeName = null,
            string? seasonName = null,
            int? inventoryId = null,
            int? styleColorId = null,
            int? styleId = null,
            int? colorId = null,
            int? sizeId = null,
            int? seasonId = null)
        {
            var query = _context.InventoryViews.AsQueryable();

            if (!string.IsNullOrWhiteSpace(styleNumber))
            {
                query = query.Where(x => x.StyleNumber.Contains(styleNumber));
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
                query = query.Where(x => x.SeasonName.Contains(seasonName));
            }

            if (inventoryId.HasValue)
            {
                query = query.Where(x => x.InventoryId == inventoryId.Value);
            }

            if (styleColorId.HasValue)
            {
                query = query.Where(x => x.StyleColorId == styleColorId.Value);
            }

            if (styleId.HasValue)
            {
                query = query.Where(x => x.StyleId == styleId.Value);
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
            string? styleNumber = null,
            string? description = null,
            string? colorName = null,
            string? sizeName = null,
            string? seasonName = null,
            int? inventoryId = null,
            int? styleColorId = null,
            int? styleId = null,
            int? colorId = null,
            int? sizeId = null,
            int? seasonId = null)
        {
            var inventory = await GetInventoryAsync(
                styleNumber,
                description,
                colorName,
                sizeName,
                seasonName,
                inventoryId,
                styleColorId,
                styleId,
                colorId,
                sizeId,
                seasonId);

            return inventory
                .OrderBy(i => i.StyleNumber)
                .ThenBy(i => i.ColorName)
                .GroupBy(i => new { i.StyleColorId, i.StyleNumber, i.ColorName })
                .Select(group =>
                {
                    var first = group.First();

                    return new InventoryPivotRow
                    {
                        StyleNumber = group.Key.StyleNumber,
                        ColorName = group.Key.ColorName,
                        StyleId = first.StyleId,
                        ColorId = first.ColorId,
                        StyleColorId = group.Key.StyleColorId,
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
                existingInventory.StyleColorId = inventory.StyleColorId;
                existingInventory.SizeId = inventory.SizeId;
                existingInventory.Qty = inventory.Qty;
            }
            else
            {
                var newInventory = new Inventory
                {
                    StyleColorId = inventory.StyleColorId,
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
                    existing.StyleColorId = update.StyleColorId;
                }
                else
                {
                    _context.Inventories.Add(new Inventory
                    {
                        Qty = update.Qty,
                        SizeId = update.SizeId,
                        StyleColorId = update.StyleColorId
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
                if (row == null || row.StyleColorId == 0 || row.Sizes == null)
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
                        StyleColorId = row.StyleColorId,
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
