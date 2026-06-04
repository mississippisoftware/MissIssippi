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
        private readonly ICurrentUserService _currentUser;

        public InventoryService(MissIssippiContext context, InventoryHistoryLogger historyLogger, ICurrentUserService currentUser)
        {
            _context = context;
            _historyLogger = historyLogger;
            _currentUser = currentUser;
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
                    HexValue = color.HexValue,
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
                    HexValue = row.HexValue,
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
                        HexValue = first.HexValue,
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
                existingInventory.ModifiedAtUtc = DateTime.UtcNow;
                existingInventory.ModifiedByUserId = _currentUser.UserId;
            }
            else
            {
                var now = DateTime.UtcNow;
                var newInventory = new Inventory
                {
                    ItemColorId = inventory.ItemColorId,
                    SizeId = inventory.SizeId,
                    Qty = inventory.Qty,
                    CreatedAtUtc = now,
                    ModifiedAtUtc = now,
                    CreatedByUserId = _currentUser.UserId,
                    ModifiedByUserId = _currentUser.UserId
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
                    existing.ModifiedAtUtc = DateTime.UtcNow;
                    existing.ModifiedByUserId = _currentUser.UserId;
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
                var saveNow = DateTime.UtcNow;
                _context.Inventories.Add(new Inventory
                {
                    Qty = update.Qty,
                    SizeId = update.SizeId,
                    ItemColorId = update.ItemColorId,
                    CreatedAtUtc = saveNow,
                    ModifiedAtUtc = saveNow,
                    CreatedByUserId = _currentUser.UserId,
                    ModifiedByUserId = _currentUser.UserId
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
            var ensureNow = DateTime.UtcNow;
            var ensureUserId = _currentUser.UserId;

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
                    Qty = 0,
                    CreatedAtUtc = ensureNow,
                    ModifiedAtUtc = ensureNow,
                    CreatedByUserId = ensureUserId,
                    ModifiedByUserId = ensureUserId
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
            var skuNow = DateTime.UtcNow;
            var skuUserId = _currentUser.UserId;

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
                    Qty = 0,
                    CreatedAtUtc = skuNow,
                    ModifiedAtUtc = skuNow,
                    CreatedByUserId = skuUserId,
                    ModifiedByUserId = skuUserId
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

        public async Task<List<SeasonLookupDto>> GetSeasonsAsync()
        {
            return await _context.Seasons.AsNoTracking()
                .OrderByDescending(s => s.Active)
                .ThenByDescending(s => s.SeasonDateCreated)
                .Select(s => new SeasonLookupDto
                {
                    SeasonId = s.SeasonId,
                    SeasonName = s.SeasonName,
                    Active = s.Active == true
                })
                .ToListAsync();
        }

        public async Task<List<CollectionLookupDto>> GetCollectionsAsync()
        {
            return await _context.Collections.AsNoTracking()
                .OrderBy(c => c.CollectionName)
                .Select(c => new CollectionLookupDto
                {
                    CollectionId = c.CollectionId,
                    CollectionName = c.CollectionName
                })
                .ToListAsync();
        }

        public async Task<InventorySearchResult> SearchInventoryAsync(InventorySearchQuery query)
        {
            var page = query.Page < 1 ? 1 : query.Page;
            var pageSize = query.PageSize < 1 ? 25 : Math.Min(query.PageSize, 100);

            var q =
                from inv in _context.Inventories.AsNoTracking()
                join ic in _context.ItemColors.AsNoTracking() on inv.ItemColorId equals ic.ItemColorId
                join item in _context.Items.AsNoTracking() on ic.ItemId equals item.ItemId
                join season in _context.Seasons.AsNoTracking() on item.SeasonId equals season.SeasonId
                join color in _context.Colors.AsNoTracking() on ic.ColorId equals color.ColorId
                join size in _context.Sizes.AsNoTracking() on inv.SizeId equals size.SizeId
                where ic.Active == true
                select new
                {
                    inv.ItemColorId,
                    inv.SizeId,
                    inv.Qty,
                    InStock = inv.InStock == 1,
                    ic.ItemId,
                    item.ItemNumber,
                    item.Description,
                    item.InProduction,
                    item.SeasonId,
                    SeasonName = season.SeasonName,
                    PrimaryColorName = color.ColorName,
                    color.CollectionId,
                    SizeName = size.SizeName,
                    size.SizeSequence
                };

            if (query.SeasonId.HasValue)
                q = q.Where(x => x.SeasonId == query.SeasonId.Value);

            if (!string.IsNullOrWhiteSpace(query.ItemNumber))
                q = q.Where(x => x.ItemNumber.Contains(query.ItemNumber));

            // ColorName filters on the primary colour only; secondary-colour matching is not yet supported.
            if (!string.IsNullOrWhiteSpace(query.ColorName))
                q = q.Where(x => x.PrimaryColorName.Contains(query.ColorName));

            if (!string.IsNullOrWhiteSpace(query.SizeName))
                q = q.Where(x => x.SizeName.Contains(query.SizeName));

            if (query.CollectionId.HasValue)
                q = q.Where(x => x.CollectionId == query.CollectionId.Value);

            if (query.InStockOnly)
                q = q.Where(x => x.Qty > 0);

            if (query.InProductionOnly)
                q = q.Where(x => x.InProduction == true);

            var total = await q.CountAsync();

            var baseRows = await q
                .OrderBy(x => x.SeasonName)
                .ThenBy(x => x.ItemNumber)
                .ThenBy(x => x.PrimaryColorName)
                .ThenBy(x => x.SizeSequence)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            if (baseRows.Count == 0)
            {
                return new InventorySearchResult { Page = page, PageSize = pageSize };
            }

            var pageItemColorIds = baseRows.Select(r => r.ItemColorId).Distinct().ToList();
            var pageSizeIds = baseRows.Select(r => r.SizeId).Distinct().ToList();

            var skus = await _context.Skus.AsNoTracking()
                .Where(s => pageItemColorIds.Contains(s.ItemColorId) && pageSizeIds.Contains(s.SizeId))
                .Select(s => new { s.SkuId, s.ItemColorId, s.SizeId, s.SkuValue })
                .ToListAsync();

            var skuMap = skus.ToDictionary(s => (s.ItemColorId, s.SizeId));

            var items = baseRows.Select(row =>
            {
                skuMap.TryGetValue((row.ItemColorId, row.SizeId), out var sku);
                return new InventorySearchRow
                {
                    SkuId = sku?.SkuId,
                    SkuValue = sku?.SkuValue,
                    ItemId = row.ItemId,
                    ItemNumber = row.ItemNumber,
                    Description = row.Description,
                    SeasonName = row.SeasonName,
                    ColorName = row.PrimaryColorName,
                    SizeName = row.SizeName,
                    SizeSequence = row.SizeSequence,
                    Qty = row.Qty,
                    InStock = row.InStock,
                    InProduction = row.InProduction
                };
            }).ToList();

            return new InventorySearchResult
            {
                Items = items,
                Total = total,
                Page = page,
                PageSize = pageSize
            };
        }

        public async Task<ProductDetailsResult?> GetProductDetailsAsync(int itemId)
        {
            var item = await (
                from i in _context.Items.AsNoTracking()
                join s in _context.Seasons.AsNoTracking() on i.SeasonId equals s.SeasonId
                where i.ItemId == itemId
                select new
                {
                    i.ItemId,
                    i.ItemNumber,
                    i.Description,
                    i.WholesalePrice,
                    i.CostPrice,
                    i.Weight,
                    i.InProduction,
                    SeasonName = s.SeasonName
                }).FirstOrDefaultAsync();

            if (item == null)
                return null;

            var itemColors = await (
                from ic in _context.ItemColors.AsNoTracking()
                join c in _context.Colors.AsNoTracking() on ic.ColorId equals c.ColorId
                where ic.ItemId == itemId
                orderby ic.Active descending, c.ColorName
                select new
                {
                    ic.ItemColorId,
                    ic.Active,
                    PrimaryColorName = c.ColorName,
                    PrimaryColorHex = c.HexValue,
                    PantoneColor = c.PantoneColor
                }).ToListAsync();

            var result = new ProductDetailsResult
            {
                ItemId = item.ItemId,
                ItemNumber = item.ItemNumber,
                Description = item.Description,
                SeasonName = item.SeasonName,
                WholesalePrice = item.WholesalePrice,
                CostPrice = item.CostPrice,
                Weight = item.Weight,
                InProduction = item.InProduction
            };

            if (itemColors.Count == 0)
                return result;

            var allItemColorIds = itemColors.Select(ic => ic.ItemColorId).ToList();

            var secondaryColors = await (
                from isc in _context.ItemColorSecondaryColors.AsNoTracking()
                join c in _context.Colors.AsNoTracking() on isc.SecondaryColorId equals c.ColorId
                where allItemColorIds.Contains(isc.ItemColorId)
                orderby isc.ItemColorId, isc.SortOrder
                select new
                {
                    isc.ItemColorId,
                    isc.SortOrder,
                    ColorName = c.ColorName
                }).ToListAsync();

            var secondaryMap = secondaryColors
                .GroupBy(x => x.ItemColorId)
                .ToDictionary(
                    g => g.Key,
                    g => g.Select(x => new ProductVariantSecondaryColorDto
                    {
                        ColorName = x.ColorName,
                        SortOrder = x.SortOrder
                    }).ToList());

            var images = await (
                from img in _context.ItemImages.AsNoTracking()
                join it in _context.ImageTypes.AsNoTracking() on img.ImageTypeId equals it.ImageTypeId
                where allItemColorIds.Contains(img.ItemColorId)
                orderby img.ItemColorId, it.Sequence, img.ImageSequence
                select new
                {
                    img.ItemColorId,
                    ImageType = it.Type,
                    img.ImageUrl,
                    Sequence = img.ImageSequence
                }).ToListAsync();

            var imageMap = images
                .GroupBy(x => x.ItemColorId)
                .ToDictionary(
                    g => g.Key,
                    g => g.Select(x => new ProductVariantImageDto
                    {
                        ImageType = x.ImageType,
                        ImageUrl = x.ImageUrl,
                        Sequence = x.Sequence
                    }).ToList());

            var inventoryRows = await (
                from inv in _context.Inventories.AsNoTracking()
                join size in _context.Sizes.AsNoTracking() on inv.SizeId equals size.SizeId
                join sku in _context.Skus.AsNoTracking()
                    on new { inv.ItemColorId, inv.SizeId } equals new { sku.ItemColorId, sku.SizeId }
                    into skuGroup
                from sku in skuGroup.DefaultIfEmpty()
                where allItemColorIds.Contains(inv.ItemColorId)
                orderby inv.ItemColorId, size.SizeSequence
                select new
                {
                    inv.ItemColorId,
                    SizeName = size.SizeName,
                    size.SizeSequence,
                    SkuValue = sku != null ? sku.SkuValue : null,
                    Qty = inv.Qty,
                    InStock = inv.Qty > 0
                }).ToListAsync();

            var inventoryMap = inventoryRows
                .GroupBy(x => x.ItemColorId)
                .ToDictionary(
                    g => g.Key,
                    g => g.Select(x => new ProductVariantSizeDto
                    {
                        SizeName = x.SizeName,
                        SizeSequence = x.SizeSequence,
                        SkuValue = x.SkuValue,
                        Qty = x.Qty,
                        InStock = x.InStock
                    }).ToList());

            result.Variants = itemColors.Select(ic =>
            {
                secondaryMap.TryGetValue(ic.ItemColorId, out var secondary);
                imageMap.TryGetValue(ic.ItemColorId, out var imgs);
                inventoryMap.TryGetValue(ic.ItemColorId, out var sizes);

                return new ProductVariantDto
                {
                    ItemColorId = ic.ItemColorId,
                    ColorName = ic.PrimaryColorName,
                    PrimaryColorHex = ic.PrimaryColorHex,
                    PantoneColor = ic.PantoneColor,
                    Active = ic.Active,
                    SecondaryColors = secondary ?? new(),
                    Images = imgs ?? new(),
                    Sizes = sizes ?? new()
                };
            }).ToList();

            return result;
        }

        public async Task<SearchByColorResult> SearchByColorAsync(SearchByColorQuery query)
        {
            var page = Math.Max(1, query.Page);
            var pageSize = Math.Clamp(query.PageSize, 1, 100);

            if (!query.IncludePrimary && !query.IncludeSecondary)
                return new SearchByColorResult { Page = page, PageSize = pageSize };

            HashSet<int>? inStockIds = null;
            if (query.InStockOnly)
            {
                var ids = await _context.Inventories.AsNoTracking()
                    .Where(inv => inv.Qty > 0)
                    .Select(inv => inv.ItemColorId)
                    .Distinct()
                    .ToListAsync();
                inStockIds = ids.ToHashSet();
            }

            var primaryMatchIds = new HashSet<int>();
            if (query.IncludePrimary)
            {
                var q =
                    from ic in _context.ItemColors.AsNoTracking()
                    join c in _context.Colors.AsNoTracking() on ic.ColorId equals c.ColorId
                    join item in _context.Items.AsNoTracking() on ic.ItemId equals item.ItemId
                    where ic.Active == true
                    select new { ic.ItemColorId, c.ColorName, c.CollectionId, item.SeasonId };

                if (!string.IsNullOrWhiteSpace(query.ColorName))
                    q = q.Where(x => x.ColorName.Contains(query.ColorName));
                if (query.CollectionId.HasValue)
                    q = q.Where(x => x.CollectionId == query.CollectionId.Value);
                if (query.SeasonId.HasValue)
                    q = q.Where(x => x.SeasonId == query.SeasonId.Value);

                var ids = await q.Select(x => x.ItemColorId).ToListAsync();
                foreach (var id in ids)
                    if (inStockIds == null || inStockIds.Contains(id))
                        primaryMatchIds.Add(id);
            }

            var secondaryMatchIds = new HashSet<int>();
            if (query.IncludeSecondary)
            {
                var q =
                    from isc in _context.ItemColorSecondaryColors.AsNoTracking()
                    join c in _context.Colors.AsNoTracking() on isc.SecondaryColorId equals c.ColorId
                    join ic in _context.ItemColors.AsNoTracking() on isc.ItemColorId equals ic.ItemColorId
                    join item in _context.Items.AsNoTracking() on ic.ItemId equals item.ItemId
                    where ic.Active == true
                    select new { isc.ItemColorId, c.ColorName, c.CollectionId, item.SeasonId };

                if (!string.IsNullOrWhiteSpace(query.ColorName))
                    q = q.Where(x => x.ColorName.Contains(query.ColorName));
                if (query.CollectionId.HasValue)
                    q = q.Where(x => x.CollectionId == query.CollectionId.Value);
                if (query.SeasonId.HasValue)
                    q = q.Where(x => x.SeasonId == query.SeasonId.Value);

                var ids = await q.Select(x => x.ItemColorId).Distinct().ToListAsync();
                foreach (var id in ids)
                    if (!primaryMatchIds.Contains(id) && (inStockIds == null || inStockIds.Contains(id)))
                        secondaryMatchIds.Add(id);
            }

            // Primary results first, then secondary; both sorted for deterministic pagination
            var combined = primaryMatchIds.OrderBy(id => id).Select(id => (ItemColorId: id, MatchedVia: "primary"))
                .Concat(secondaryMatchIds.OrderBy(id => id).Select(id => (ItemColorId: id, MatchedVia: "secondary")))
                .ToList();

            var total = combined.Count;
            var pageEntries = combined
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            if (pageEntries.Count == 0)
                return new SearchByColorResult { Total = total, Page = page, PageSize = pageSize };

            var pageItemColorIds = pageEntries.Select(x => x.ItemColorId).ToList();

            var details = await (
                from ic in _context.ItemColors.AsNoTracking()
                join item in _context.Items.AsNoTracking() on ic.ItemId equals item.ItemId
                join season in _context.Seasons.AsNoTracking() on item.SeasonId equals season.SeasonId
                join color in _context.Colors.AsNoTracking() on ic.ColorId equals color.ColorId
                where pageItemColorIds.Contains(ic.ItemColorId)
                select new
                {
                    ic.ItemColorId,
                    item.ItemNumber,
                    item.Description,
                    SeasonName = season.SeasonName,
                    PrimaryColorName = color.ColorName
                }).ToListAsync();

            var qtyGroups = await _context.Inventories.AsNoTracking()
                .Where(inv => pageItemColorIds.Contains(inv.ItemColorId))
                .GroupBy(inv => inv.ItemColorId)
                .Select(g => new { ItemColorId = g.Key, TotalQty = g.Sum(x => x.Qty) })
                .ToListAsync();

            var qtyMap = qtyGroups.ToDictionary(g => g.ItemColorId, g => g.TotalQty);
            var detailDict = details.ToDictionary(d => d.ItemColorId);

            var items = pageEntries
                .Where(e => detailDict.ContainsKey(e.ItemColorId))
                .Select(e =>
                {
                    var detail = detailDict[e.ItemColorId];
                    qtyMap.TryGetValue(e.ItemColorId, out var totalQty);
                    return new SearchByColorRow
                    {
                        ItemColorId = e.ItemColorId,
                        ItemNumber = detail.ItemNumber,
                        Description = detail.Description,
                        SeasonName = detail.SeasonName,
                        PrimaryColorName = detail.PrimaryColorName,
                        MatchedVia = e.MatchedVia,
                        TotalQty = totalQty
                    };
                }).ToList();

            return new SearchByColorResult
            {
                Items = items,
                Total = total,
                Page = page,
                PageSize = pageSize
            };
        }

        public async Task<InventoryActivityResult?> GetInventoryActivityForVariantAsync(InventoryActivityQuery query)
        {
            var page = Math.Max(1, query.Page);
            var pageSize = Math.Clamp(query.PageSize, 1, 200);

            int? targetItemColorId = null;
            int? targetSizeId = null;

            if (!string.IsNullOrWhiteSpace(query.SkuValue))
            {
                var normalized = query.SkuValue.Trim().ToUpperInvariant();
                var skuEntity = await _context.Skus.AsNoTracking()
                    .Where(s => s.SkuValue == normalized)
                    .Select(s => new { s.ItemColorId, s.SizeId })
                    .FirstOrDefaultAsync();

                if (skuEntity == null)
                    return null;

                targetItemColorId = skuEntity.ItemColorId;
                targetSizeId = skuEntity.SizeId;
            }
            else if (query.ItemColorId.HasValue)
            {
                targetItemColorId = query.ItemColorId.Value;
            }
            else
            {
                return new InventoryActivityResult { Page = page, PageSize = pageSize };
            }

            var itemColorId = targetItemColorId.Value;

            var logQuery = _context.InventoryActivityLogs.AsNoTracking()
                .Where(log => log.ItemColorId == itemColorId);

            if (targetSizeId.HasValue)
            {
                var sizeId = targetSizeId.Value;
                logQuery = logQuery.Where(log => log.SizeId == sizeId);
            }

            if (query.FromDate.HasValue)
            {
                var from = query.FromDate.Value;
                logQuery = logQuery.Where(log => log.InventoryActivityDate >= from);
            }

            if (query.ToDate.HasValue)
            {
                var to = query.ToDate.Value;
                logQuery = logQuery.Where(log => log.InventoryActivityDate <= to);
            }

            var q =
                from log in logQuery
                join batch in _context.InventoryAdjustmentBatches.AsNoTracking() on log.BatchId equals batch.BatchId
                join size in _context.Sizes.AsNoTracking() on log.SizeId equals size.SizeId
                join sku in _context.Skus.AsNoTracking()
                    on new { log.ItemColorId, log.SizeId } equals new { sku.ItemColorId, sku.SizeId }
                    into skuGroup
                from sku in skuGroup.DefaultIfEmpty()
                select new
                {
                    log.LogTimestamp,
                    log.InventoryActivityDate,
                    SizeName = size.SizeName,
                    SkuValue = sku != null ? sku.SkuValue : null,
                    log.OldQty,
                    log.NewQty,
                    log.Delta,
                    log.ActionType,
                    BatchSource = batch.Source,
                    BatchNotes = batch.Notes
                };

            var total = await q.CountAsync();

            var baseRows = await q
                .OrderByDescending(x => x.LogTimestamp)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var lines = baseRows.Select(r => new InventoryActivityRow
            {
                LogTimestamp = r.LogTimestamp,
                ActivityDate = r.InventoryActivityDate,
                SizeName = r.SizeName,
                SkuValue = r.SkuValue,
                OldQty = r.OldQty,
                NewQty = r.NewQty,
                Delta = r.Delta,
                ActionType = r.ActionType,
                BatchSource = r.BatchSource,
                BatchNotes = r.BatchNotes
            }).ToList();

            return new InventoryActivityResult
            {
                Lines = lines,
                Total = total,
                Page = page,
                PageSize = pageSize
            };
        }

        public async Task<LowStockResult> GetLowStockItemsAsync(LowStockQuery query)
        {
            var page = Math.Max(1, query.Page);
            var pageSize = Math.Clamp(query.PageSize, 1, 200);
            var maxQty = Math.Max(0, query.MaxQty);

            var q =
                from inv in _context.Inventories.AsNoTracking()
                join ic in _context.ItemColors.AsNoTracking() on inv.ItemColorId equals ic.ItemColorId
                join item in _context.Items.AsNoTracking() on ic.ItemId equals item.ItemId
                join season in _context.Seasons.AsNoTracking() on item.SeasonId equals season.SeasonId
                join color in _context.Colors.AsNoTracking() on ic.ColorId equals color.ColorId
                join size in _context.Sizes.AsNoTracking() on inv.SizeId equals size.SizeId
                join sku in _context.Skus.AsNoTracking()
                    on new { inv.ItemColorId, inv.SizeId } equals new { sku.ItemColorId, sku.SizeId }
                    into skuGroup
                from sku in skuGroup.DefaultIfEmpty()
                where ic.Active == true && inv.Qty <= maxQty
                select new
                {
                    SkuValue = sku != null ? sku.SkuValue : null,
                    item.ItemNumber,
                    item.Description,
                    SeasonName = season.SeasonName,
                    ColorName = color.ColorName,
                    SizeName = size.SizeName,
                    SizeSequence = size.SizeSequence,
                    Qty = inv.Qty,
                    item.InProduction,
                    item.SeasonId
                };

            if (query.SeasonId.HasValue)
                q = q.Where(x => x.SeasonId == query.SeasonId.Value);

            if (query.InProductionOnly)
                q = q.Where(x => x.InProduction == true);

            var total = await q.CountAsync();

            var baseRows = await q
                .OrderBy(x => x.Qty)
                .ThenBy(x => x.SeasonName)
                .ThenBy(x => x.ItemNumber)
                .ThenBy(x => x.ColorName)
                .ThenBy(x => x.SizeSequence)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var rows = baseRows.Select(x => new LowStockRow
            {
                SkuValue = x.SkuValue,
                ItemNumber = x.ItemNumber,
                Description = x.Description,
                SeasonName = x.SeasonName,
                ColorName = x.ColorName,
                SizeName = x.SizeName,
                Qty = x.Qty,
                InProduction = x.InProduction
            }).ToList();

            return new LowStockResult { Items = rows, Total = total, Page = page, PageSize = pageSize };
        }

        public async Task<StyleNumberResult> SearchByStyleNumberAsync(StyleNumberQuery query)
        {
            if (string.IsNullOrWhiteSpace(query.ItemNumber))
                return new StyleNumberResult();

            var itemQ =
                from item in _context.Items.AsNoTracking()
                join season in _context.Seasons.AsNoTracking() on item.SeasonId equals season.SeasonId
                where item.ItemNumber.Contains(query.ItemNumber)
                select new
                {
                    item.ItemId,
                    item.ItemNumber,
                    item.Description,
                    item.InProduction,
                    item.WholesalePrice,
                    item.SeasonId,
                    SeasonName = season.SeasonName
                };

            if (query.SeasonId.HasValue)
                itemQ = itemQ.Where(x => x.SeasonId == query.SeasonId.Value);

            var items = await itemQ
                .OrderBy(x => x.SeasonName)
                .ThenBy(x => x.ItemNumber)
                .Take(200)
                .ToListAsync();

            if (items.Count == 0)
                return new StyleNumberResult();

            var rows = items.Select(x => new StyleNumberRow
            {
                ItemId = x.ItemId,
                ItemNumber = x.ItemNumber,
                Description = x.Description,
                SeasonName = x.SeasonName,
                InProduction = x.InProduction,
                WholesalePrice = x.WholesalePrice
            }).ToList();

            if (!query.IncludeVariantSummary)
                return new StyleNumberResult { Items = rows, Total = rows.Count };

            var itemIds = items.Select(x => x.ItemId).ToList();

            var variantCounts = await _context.ItemColors.AsNoTracking()
                .Where(ic => ic.Active == true && itemIds.Contains(ic.ItemId))
                .GroupBy(ic => ic.ItemId)
                .Select(g => new { ItemId = g.Key, VariantCount = g.Count() })
                .ToListAsync();

            var qtySums = await (
                from ic in _context.ItemColors.AsNoTracking()
                join inv in _context.Inventories.AsNoTracking() on ic.ItemColorId equals inv.ItemColorId
                where ic.Active == true && itemIds.Contains(ic.ItemId)
                group inv by ic.ItemId into g
                select new { ItemId = g.Key, TotalQty = g.Sum(x => x.Qty) }
            ).ToListAsync();

            var variantCountMap = variantCounts.ToDictionary(x => x.ItemId, x => x.VariantCount);
            var qtyMap = qtySums.ToDictionary(x => x.ItemId, x => x.TotalQty);

            foreach (var row in rows)
            {
                variantCountMap.TryGetValue(row.ItemId, out var vc);
                qtyMap.TryGetValue(row.ItemId, out var qty);
                row.VariantCount = vc;
                row.TotalQty = qty;
            }

            return new StyleNumberResult { Items = rows, Total = rows.Count };
        }

        public async Task<SearchBySeasonResult> SearchBySeasonAsync(SearchBySeasonQuery query)
        {
            var page = Math.Max(1, query.Page);
            var pageSize = Math.Clamp(query.PageSize, 1, 200);

            var itemQ = _context.Items.AsNoTracking()
                .Where(item => item.SeasonId == query.SeasonId);

            if (query.InProductionOnly)
                itemQ = itemQ.Where(item => item.InProduction == true);

            var items = await itemQ
                .OrderBy(item => item.ItemNumber)
                .Select(item => new
                {
                    item.ItemId,
                    item.ItemNumber,
                    item.Description,
                    item.InProduction,
                    item.WholesalePrice
                })
                .ToListAsync();

            if (items.Count == 0)
                return new SearchBySeasonResult { Page = page, PageSize = pageSize };

            var itemIds = items.Select(x => x.ItemId).ToList();

            var variantCounts = await _context.ItemColors.AsNoTracking()
                .Where(ic => ic.Active == true && itemIds.Contains(ic.ItemId))
                .GroupBy(ic => ic.ItemId)
                .Select(g => new { ItemId = g.Key, VariantCount = g.Count() })
                .ToListAsync();

            var qtySums = await (
                from ic in _context.ItemColors.AsNoTracking()
                join inv in _context.Inventories.AsNoTracking() on ic.ItemColorId equals inv.ItemColorId
                where ic.Active == true && itemIds.Contains(ic.ItemId)
                group inv by ic.ItemId into g
                select new { ItemId = g.Key, TotalQty = g.Sum(x => x.Qty) }
            ).ToListAsync();

            // Distinct (ItemId, ItemColorId) pairs where at least one inventory row has qty > 0
            var inStockVariantPairs = await (
                from ic in _context.ItemColors.AsNoTracking()
                join inv in _context.Inventories.AsNoTracking() on ic.ItemColorId equals inv.ItemColorId
                where ic.Active == true && itemIds.Contains(ic.ItemId) && inv.Qty > 0
                select new { ic.ItemId, ic.ItemColorId }
            ).Distinct().ToListAsync();

            var variantCountMap = variantCounts.ToDictionary(x => x.ItemId, x => x.VariantCount);
            var qtyMap = qtySums.ToDictionary(x => x.ItemId, x => x.TotalQty);
            var inStockVariantCountMap = inStockVariantPairs
                .GroupBy(x => x.ItemId)
                .ToDictionary(g => g.Key, g => g.Count());

            var allRows = items.Select(item =>
            {
                variantCountMap.TryGetValue(item.ItemId, out var variantCount);
                qtyMap.TryGetValue(item.ItemId, out var totalQty);
                inStockVariantCountMap.TryGetValue(item.ItemId, out var inStockVariantCount);

                return new SearchBySeasonRow
                {
                    ItemId = item.ItemId,
                    ItemNumber = item.ItemNumber,
                    Description = item.Description,
                    InProduction = item.InProduction,
                    WholesalePrice = item.WholesalePrice,
                    VariantCount = variantCount,
                    TotalQty = totalQty,
                    InStockVariantCount = inStockVariantCount
                };
            }).ToList();

            if (query.InStockOnly)
                allRows = allRows.Where(r => r.TotalQty > 0).ToList();

            var total = allRows.Count;
            var pageRows = allRows
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            return new SearchBySeasonResult
            {
                Items = pageRows,
                Total = total,
                Page = page,
                PageSize = pageSize
            };
        }

        public async Task<CheckAvailabilityResult> CheckAvailabilityAsync(
            List<string>? skuValues,
            int? itemColorId,
            int? sizeId)
        {
            var result = new CheckAvailabilityResult();

            if (skuValues != null && skuValues.Count > 0)
            {
                var normalized = skuValues
                    .Where(s => !string.IsNullOrWhiteSpace(s))
                    .Select(s => s.Trim().ToUpperInvariant())
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToList();

                if (normalized.Count == 0)
                    return result;

                var rows = await (
                    from sku in _context.Skus.AsNoTracking()
                    join ic in _context.ItemColors.AsNoTracking() on sku.ItemColorId equals ic.ItemColorId
                    join item in _context.Items.AsNoTracking() on ic.ItemId equals item.ItemId
                    join color in _context.Colors.AsNoTracking() on ic.ColorId equals color.ColorId
                    join size in _context.Sizes.AsNoTracking() on sku.SizeId equals size.SizeId
                    join inv in _context.Inventories.AsNoTracking()
                        on new { sku.ItemColorId, sku.SizeId } equals new { inv.ItemColorId, inv.SizeId }
                        into invGroup
                    from inv in invGroup.DefaultIfEmpty()
                    where normalized.Contains(sku.SkuValue)
                    select new
                    {
                        SkuValue = sku.SkuValue,
                        ItemNumber = item.ItemNumber,
                        ColorName = color.ColorName,
                        SizeName = size.SizeName,
                        Qty = inv != null ? inv.Qty : 0,
                        InStock = inv != null && inv.Qty > 0
                    }).ToListAsync();

                result.Results = rows.Select(r => new AvailabilityRow
                {
                    SkuValue = r.SkuValue,
                    ItemNumber = r.ItemNumber,
                    ColorName = r.ColorName,
                    SizeName = r.SizeName,
                    Qty = r.Qty,
                    InStock = r.InStock
                }).ToList();
            }
            else if (itemColorId.HasValue)
            {
                var targetItemColorId = itemColorId.Value;

                var invQuery = _context.Inventories.AsNoTracking()
                    .Where(inv => inv.ItemColorId == targetItemColorId);

                if (sizeId.HasValue)
                {
                    var targetSizeId = sizeId.Value;
                    invQuery = invQuery.Where(inv => inv.SizeId == targetSizeId);
                }

                var rows = await (
                    from inv in invQuery
                    join ic in _context.ItemColors.AsNoTracking() on inv.ItemColorId equals ic.ItemColorId
                    join item in _context.Items.AsNoTracking() on ic.ItemId equals item.ItemId
                    join color in _context.Colors.AsNoTracking() on ic.ColorId equals color.ColorId
                    join size in _context.Sizes.AsNoTracking() on inv.SizeId equals size.SizeId
                    join sku in _context.Skus.AsNoTracking()
                        on new { inv.ItemColorId, inv.SizeId } equals new { sku.ItemColorId, sku.SizeId }
                        into skuGroup
                    from sku in skuGroup.DefaultIfEmpty()
                    orderby size.SizeSequence
                    select new
                    {
                        SkuValue = sku != null ? sku.SkuValue : null,
                        ItemNumber = item.ItemNumber,
                        ColorName = color.ColorName,
                        SizeName = size.SizeName,
                        Qty = inv.Qty,
                        InStock = inv.Qty > 0
                    }).ToListAsync();

                result.Results = rows.Select(r => new AvailabilityRow
                {
                    SkuValue = r.SkuValue,
                    ItemNumber = r.ItemNumber,
                    ColorName = r.ColorName,
                    SizeName = r.SizeName,
                    Qty = r.Qty,
                    InStock = r.InStock
                }).ToList();
            }

            return result;
        }
    }
}
