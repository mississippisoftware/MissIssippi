using System.Text;
using Microsoft.EntityFrameworkCore;
using MissIssippiAPI.Data;
using MissIssippiAPI.Models;

namespace MissIssippiAPI.Services
{
    public class SkuService
    {
        private const int SkuMaxLength = 25;
        private readonly MissIssippiContext _context;
        private readonly InventoryHistoryLogger _historyLogger;

        public SkuService(MissIssippiContext context, InventoryHistoryLogger historyLogger)
        {
            _context = context;
            _historyLogger = historyLogger;
        }

        public async Task<int> EnsureSkusForItemColorAsync(int itemColorId)
        {
            var itemColor = await _context.ItemColors
                .Include(ic => ic.Item)
                    .ThenInclude(i => i.Season)
                .Include(ic => ic.Color)
                .Include(ic => ic.ItemColorSecondaryColors)
                    .ThenInclude(link => link.SecondaryColor)
                .FirstOrDefaultAsync(ic => ic.ItemColorId == itemColorId);

            if (itemColor == null)
            {
                throw new InvalidOperationException("Item color not found.");
            }

            var secondaryColorNames = itemColor.ItemColorSecondaryColors
                .OrderBy(link => link.SortOrder)
                .ThenBy(link => link.SecondaryColorId)
                .Select(link => link.SecondaryColor?.ColorName ?? string.Empty)
                .Where(name => !string.IsNullOrWhiteSpace(name))
                .ToList();

            var sizes = await _context.Sizes.AsNoTracking()
                .OrderBy(x => x.SizeSequence)
                .ToListAsync();

            var existingSizeIds = await _context.Skus
                .Where(x => x.ItemColorId == itemColorId)
                .Select(x => x.SizeId)
                .ToListAsync();

            var existingSet = new HashSet<int>(existingSizeIds);
            var newSkus = new List<Sku>();
            var candidateSkuValues = new List<string>();
            var pendingBySizeId = new Dictionary<int, string>();

            foreach (var size in sizes)
            {
                if (existingSet.Contains(size.SizeId))
                {
                    continue;
                }

                var skuValue = BuildSku(
                    itemColor.Item.Season.SeasonName,
                    itemColor.Item.ItemNumber,
                    itemColor.Color.ColorName,
                    size.SizeName,
                    secondaryColorNames);
                pendingBySizeId[size.SizeId] = skuValue;
                candidateSkuValues.Add(skuValue);
            }

            HashSet<string> existingSkuValues = new(StringComparer.OrdinalIgnoreCase);
            if (candidateSkuValues.Count > 0)
            {
                var duplicates = await _context.Skus
                    .AsNoTracking()
                    .Where(x => candidateSkuValues.Contains(x.SkuValue))
                    .Select(x => x.SkuValue)
                    .ToListAsync();
                existingSkuValues = duplicates.ToHashSet(StringComparer.OrdinalIgnoreCase);
            }

            foreach (var size in sizes)
            {
                if (!pendingBySizeId.TryGetValue(size.SizeId, out var skuValue))
                {
                    continue;
                }

                // Reuse existing global SKU values instead of attempting a duplicate insert.
                if (existingSkuValues.Contains(skuValue))
                {
                    continue;
                }

                newSkus.Add(new Sku
                {
                    ItemColorId = itemColorId,
                    SizeId = size.SizeId,
                    SkuValue = skuValue
                });
                existingSkuValues.Add(skuValue);
            }

            if (newSkus.Count > 0)
            {
                _context.Skus.AddRange(newSkus);
                await _context.SaveChangesAsync();
            }

            return newSkus.Count;
        }

        public async Task<SkuLookupResult?> LookupSkuAsync(string sku)
        {
            var normalized = NormalizeSkuInput(sku);
            if (string.IsNullOrWhiteSpace(normalized))
            {
                return null;
            }

            var skuEntity = await _context.Skus
                .Include(s => s.ItemColor)
                    .ThenInclude(ic => ic.Item)
                        .ThenInclude(i => i.Season)
                .Include(s => s.ItemColor)
                    .ThenInclude(ic => ic.Color)
                .Include(s => s.Size)
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.SkuValue == normalized);

            if (skuEntity == null)
            {
                return null;
            }

            var itemColor = skuEntity.ItemColor;
            var item = itemColor.Item;
            var color = itemColor.Color;
            var season = item.Season;

            var inventory = await _context.Inventories
                .AsNoTracking()
                .FirstOrDefaultAsync(i =>
                    i.ItemColorId == skuEntity.ItemColorId &&
                    i.SizeId == skuEntity.SizeId);

            var imageUrl = await _context.ItemImages
                .Include(img => img.ImageType)
                .AsNoTracking()
                .Where(img => img.ItemColorId == skuEntity.ItemColorId)
                .OrderBy(img => img.ImageType.Sequence)
                .ThenBy(img => img.ImageSequence)
                .Select(img => img.ImageUrl)
                .FirstOrDefaultAsync();

            return new SkuLookupResult
            {
                Sku = skuEntity.SkuValue,
                SeasonId = item.SeasonId,
                SeasonName = season.SeasonName,
                ItemId = item.ItemId,
                ItemNumber = item.ItemNumber,
                ColorId = color.ColorId,
                ColorName = color.ColorName,
                SizeId = skuEntity.SizeId,
                SizeName = skuEntity.Size.SizeName,
                ItemColorId = skuEntity.ItemColorId,
                InventoryId = inventory?.InventoryId,
                Qty = inventory?.Qty,
                ImageUrl = imageUrl
            };
        }

        public async Task<SkuAdjustmentsResult> ApplyAdjustmentsAsync(
            IEnumerable<SkuAdjustmentRequest> adjustments,
            string? notes = null)
        {
            var result = new SkuAdjustmentsResult();

            if (adjustments == null)
            {
                return result;
            }

            var grouped = adjustments
                .Where(a => a != null && !string.IsNullOrWhiteSpace(a.Sku) && a.Delta != 0)
                .GroupBy(a => NormalizeSkuInput(a.Sku))
                .Select(g => new { Sku = g.Key, Delta = g.Sum(x => x.Delta) })
                .Where(x => !string.IsNullOrWhiteSpace(x.Sku) && x.Delta != 0)
                .ToList();

            if (grouped.Count == 0)
            {
                return result;
            }

            var changes = new List<InventoryHistoryChange>();
            var skuValues = grouped.Select(g => g.Sku).ToList();
            var skuEntities = await _context.Skus
                .AsNoTracking()
                .Where(s => skuValues.Contains(s.SkuValue))
                .ToListAsync();

            var skuMap = skuEntities.ToDictionary(s => s.SkuValue, StringComparer.OrdinalIgnoreCase);

            foreach (var group in grouped)
            {
                if (!skuMap.TryGetValue(group.Sku, out var skuEntity))
                {
                    result.MissingSkus.Add(group.Sku);
                    continue;
                }

                var inventory = await _context.Inventories
                    .FirstOrDefaultAsync(i =>
                        i.ItemColorId == skuEntity.ItemColorId &&
                        i.SizeId == skuEntity.SizeId);

                if (inventory == null)
                {
                    var oldQty = 0;
                    var newQty = Math.Max(0, group.Delta);
                    inventory = new Inventory
                    {
                        ItemColorId = skuEntity.ItemColorId,
                        SizeId = skuEntity.SizeId,
                        Qty = newQty
                    };
                    _context.Inventories.Add(inventory);
                    if (newQty != oldQty)
                    {
                        changes.Add(new InventoryHistoryChange
                        {
                            ItemColorId = skuEntity.ItemColorId,
                            SizeId = skuEntity.SizeId,
                            OldQty = oldQty,
                            NewQty = newQty
                        });
                    }
                }
                else
                {
                    var oldQty = inventory.Qty;
                    var newQty = Math.Max(0, inventory.Qty + group.Delta);
                    inventory.Qty = newQty;
                    if (newQty != oldQty)
                    {
                        changes.Add(new InventoryHistoryChange
                        {
                            ItemColorId = skuEntity.ItemColorId,
                            SizeId = skuEntity.SizeId,
                            OldQty = oldQty,
                            NewQty = newQty
                        });
                    }
                }

                result.UpdatedCount += 1;
            }

            await _context.SaveChangesAsync();
            if (changes.Count > 0)
            {
                try
                {
                    var normalizedNotes = string.IsNullOrWhiteSpace(notes) ? null : notes.Trim();
                    await _historyLogger.LogAdjustmentsAsync("scan", changes, normalizedNotes);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Inventory history logging failed: {ex.Message}");
                }
            }
            return result;
        }

        public async Task<SkuListResponse> GetSkuListAsync(SkuListQuery query)
        {
            var page = query.Page < 1 ? 1 : query.Page;
            var pageSize = query.PageSize < 1 ? 25 : query.PageSize;
            if (pageSize > 200)
            {
                pageSize = 200;
            }

            var search = query.Query?.Trim();
            var sortField = query.SortField?.Trim().ToLowerInvariant();
            var sortOrder = query.SortOrder?.Trim().ToLowerInvariant();
            var descending = sortOrder == "desc" || sortOrder == "descending" || sortOrder == "-1";

            var baseQuery =
                from sku in _context.Skus.AsNoTracking()
                join itemColor in _context.ItemColors.AsNoTracking().Where(ic => ic.Active == true)
                    on sku.ItemColorId equals itemColor.ItemColorId
                join item in _context.Items.AsNoTracking().Where(i => i.InProduction == true)
                    on itemColor.ItemId equals item.ItemId
                join color in _context.Colors.AsNoTracking() on itemColor.ColorId equals color.ColorId
                join size in _context.Sizes.AsNoTracking() on sku.SizeId equals size.SizeId
                join season in _context.Seasons.AsNoTracking() on item.SeasonId equals season.SeasonId
                join inventory in _context.Inventories.AsNoTracking()
                    on new { sku.ItemColorId, sku.SizeId } equals new { inventory.ItemColorId, inventory.SizeId }
                    into inventoryGroup
                from inventory in inventoryGroup.DefaultIfEmpty()
                select new
                {
                    sku,
                    item,
                    color,
                    size,
                    season,
                    Qty = inventory != null ? inventory.Qty : 0
                };

            if (!string.IsNullOrWhiteSpace(search))
            {
                baseQuery = baseQuery.Where(x =>
                    x.sku.SkuValue.Contains(search) ||
                    x.item.ItemNumber.Contains(search) ||
                    x.color.ColorName.Contains(search));
            }

            if (query.SeasonId.HasValue)
            {
                baseQuery = baseQuery.Where(x => x.item.SeasonId == query.SeasonId.Value);
            }

            if (query.InProduction.HasValue)
            {
                baseQuery = baseQuery.Where(x => x.item.InProduction == query.InProduction.Value);
            }

            if (query.InStock.HasValue)
            {
                baseQuery = query.InStock.Value
                    ? baseQuery.Where(x => x.Qty > 0)
                    : baseQuery.Where(x => x.Qty <= 0);
            }

            var total = await baseQuery.CountAsync();

            var orderedQuery = descending
                ? sortField switch
                {
                    "sku" => baseQuery
                        .OrderByDescending(x => x.season.SeasonName)
                        .ThenByDescending(x => x.item.ItemNumber)
                        .ThenByDescending(x => x.color.ColorName)
                        .ThenByDescending(x => x.size.SizeSequence)
                        .ThenByDescending(x => x.size.SizeName)
                        .ThenByDescending(x => x.sku.SkuValue),
                    "seasonname" => baseQuery.OrderByDescending(x => x.season.SeasonName),
                    "itemnumber" => baseQuery.OrderByDescending(x => x.item.ItemNumber),
                    "description" => baseQuery.OrderByDescending(x => x.item.Description),
                    "colorname" => baseQuery.OrderByDescending(x => x.color.ColorName),
                    "sizesequence" => baseQuery.OrderByDescending(x => x.size.SizeSequence),
                    "sizename" => baseQuery.OrderByDescending(x => x.size.SizeSequence).ThenByDescending(x => x.size.SizeName),
                    "qty" => baseQuery.OrderByDescending(x => x.Qty),
                    "inproduction" => baseQuery.OrderByDescending(x => x.item.InProduction),
                    _ => baseQuery.OrderByDescending(x => x.sku.SkuValue)
                }
                : sortField switch
                {
                    "sku" => baseQuery
                        .OrderBy(x => x.season.SeasonName)
                        .ThenBy(x => x.item.ItemNumber)
                        .ThenBy(x => x.color.ColorName)
                        .ThenBy(x => x.size.SizeSequence)
                        .ThenBy(x => x.size.SizeName)
                        .ThenBy(x => x.sku.SkuValue),
                    "seasonname" => baseQuery.OrderBy(x => x.season.SeasonName),
                    "itemnumber" => baseQuery.OrderBy(x => x.item.ItemNumber),
                    "description" => baseQuery.OrderBy(x => x.item.Description),
                    "colorname" => baseQuery.OrderBy(x => x.color.ColorName),
                    "sizesequence" => baseQuery.OrderBy(x => x.size.SizeSequence),
                    "sizename" => baseQuery.OrderBy(x => x.size.SizeSequence).ThenBy(x => x.size.SizeName),
                    "qty" => baseQuery.OrderBy(x => x.Qty),
                    "inproduction" => baseQuery.OrderBy(x => x.item.InProduction),
                    _ => baseQuery.OrderBy(x => x.sku.SkuValue)
                };

            var items = await orderedQuery
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(x => new SkuListItemDto
                {
                    SkuId = x.sku.SkuId,
                    Sku = x.sku.SkuValue,
                    SeasonName = x.season.SeasonName,
                    ItemNumber = x.item.ItemNumber,
                    Description = x.item.Description,
                    ColorName = x.color.ColorName,
                    SizeName = x.size.SizeName,
                    SizeSequence = x.size.SizeSequence,
                    Qty = x.Qty,
                    InProduction = x.item.InProduction
                })
                .ToListAsync();

            return new SkuListResponse
            {
                Items = items,
                Total = total
            };
        }

        public async Task<SkuUpdateResponse> UpdateSkuAsync(int skuId, string? skuValue)
        {
            if (skuId <= 0)
            {
                throw new ArgumentException("A valid SKU id is required.");
            }

            var normalizedSku = NormalizeSkuInput(skuValue);
            if (string.IsNullOrWhiteSpace(normalizedSku))
            {
                throw new ArgumentException("SKU is required.");
            }

            if (normalizedSku.Length > SkuMaxLength)
            {
                throw new ArgumentException($"SKU must be {SkuMaxLength} characters or fewer.");
            }

            var sku = await _context.Skus.FirstOrDefaultAsync(x => x.SkuId == skuId);
            if (sku == null)
            {
                throw new KeyNotFoundException("SKU not found.");
            }

            var duplicateExists = await _context.Skus
                .AsNoTracking()
                .AnyAsync(x => x.SkuId != skuId && x.SkuValue == normalizedSku);
            if (duplicateExists)
            {
                throw new InvalidOperationException($"SKU '{normalizedSku}' already exists.");
            }

            sku.SkuValue = normalizedSku;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                throw new InvalidOperationException($"SKU '{normalizedSku}' already exists.");
            }

            return new SkuUpdateResponse
            {
                SkuId = sku.SkuId,
                Sku = sku.SkuValue
            };
        }

        public async Task<SkuBulkUpdateResponse> BulkUpdateSkusAsync(List<SkuBulkUpdateRowRequest>? rows)
        {
            var response = new SkuBulkUpdateResponse();
            var inputRows = rows ?? new List<SkuBulkUpdateRowRequest>();
            if (inputRows.Count == 0)
            {
                response.Success = false;
                response.Errors.Add(new SkuBulkUpdateError
                {
                    RowNumber = 0,
                    Message = "No rows provided."
                });
                return response;
            }

            var sanitizedRows = new List<(int RowNumber, int SkuId, string SkuValue)>(inputRows.Count);
            var seenSkuIds = new Dictionary<int, int>();
            var seenTargetSkus = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

            foreach (var row in inputRows)
            {
                var rowNumber = row?.RowNumber > 0 ? row.RowNumber : 0;
                var skuId = row?.SkuId ?? 0;
                var normalizedSku = NormalizeSkuInput(row?.Sku);

                if (skuId <= 0)
                {
                    response.Errors.Add(new SkuBulkUpdateError
                    {
                        RowNumber = rowNumber,
                        SkuId = skuId > 0 ? skuId : null,
                        Message = "SkuId is required."
                    });
                    continue;
                }

                if (string.IsNullOrWhiteSpace(normalizedSku))
                {
                    response.Errors.Add(new SkuBulkUpdateError
                    {
                        RowNumber = rowNumber,
                        SkuId = skuId,
                        Message = "SKU is required."
                    });
                    continue;
                }

                if (normalizedSku.Length > SkuMaxLength)
                {
                    response.Errors.Add(new SkuBulkUpdateError
                    {
                        RowNumber = rowNumber,
                        SkuId = skuId,
                        Message = $"SKU must be {SkuMaxLength} characters or fewer."
                    });
                    continue;
                }

                if (seenSkuIds.TryGetValue(skuId, out var existingSkuIdRow))
                {
                    response.Errors.Add(new SkuBulkUpdateError
                    {
                        RowNumber = rowNumber,
                        SkuId = skuId,
                        Message = $"Duplicate SkuId in upload (also row {existingSkuIdRow})."
                    });
                    continue;
                }
                seenSkuIds[skuId] = rowNumber;

                if (seenTargetSkus.TryGetValue(normalizedSku, out var existingTargetRow))
                {
                    response.Errors.Add(new SkuBulkUpdateError
                    {
                        RowNumber = rowNumber,
                        SkuId = skuId,
                        Message = $"Duplicate target SKU '{normalizedSku}' in upload (also row {existingTargetRow})."
                    });
                    continue;
                }
                seenTargetSkus[normalizedSku] = rowNumber;

                sanitizedRows.Add((rowNumber, skuId, normalizedSku));
            }

            response.Processed = sanitizedRows.Count;
            if (response.Errors.Count > 0 || sanitizedRows.Count == 0)
            {
                response.Success = false;
                return response;
            }

            var targetIds = sanitizedRows.Select(x => x.SkuId).ToList();
            var skuEntities = await _context.Skus
                .Where(x => targetIds.Contains(x.SkuId))
                .ToListAsync();
            var skuById = skuEntities.ToDictionary(x => x.SkuId);

            foreach (var row in sanitizedRows)
            {
                if (!skuById.ContainsKey(row.SkuId))
                {
                    response.Errors.Add(new SkuBulkUpdateError
                    {
                        RowNumber = row.RowNumber,
                        SkuId = row.SkuId,
                        Message = "SkuId not found."
                    });
                }
            }

            var targetValues = sanitizedRows.Select(x => x.SkuValue).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
            var existingValueRows = await _context.Skus
                .AsNoTracking()
                .Where(x => targetValues.Contains(x.SkuValue))
                .Select(x => new { x.SkuId, x.SkuValue })
                .ToListAsync();
            var existingByValue = existingValueRows
                .GroupBy(x => x.SkuValue, StringComparer.OrdinalIgnoreCase)
                .ToDictionary(g => g.Key, g => g.Select(x => x.SkuId).ToList(), StringComparer.OrdinalIgnoreCase);

            foreach (var row in sanitizedRows)
            {
                if (!existingByValue.TryGetValue(row.SkuValue, out var matches))
                {
                    continue;
                }

                if (matches.Any(id => id != row.SkuId))
                {
                    response.Errors.Add(new SkuBulkUpdateError
                    {
                        RowNumber = row.RowNumber,
                        SkuId = row.SkuId,
                        Message = $"SKU '{row.SkuValue}' already exists."
                    });
                }
            }

            if (response.Errors.Count > 0)
            {
                response.Success = false;
                return response;
            }

            await using var tx = await _context.Database.BeginTransactionAsync();
            try
            {
                foreach (var row in sanitizedRows)
                {
                    var entity = skuById[row.SkuId];
                    if (!string.Equals(entity.SkuValue, row.SkuValue, StringComparison.OrdinalIgnoreCase))
                    {
                        entity.SkuValue = row.SkuValue;
                        response.Updated += 1;
                    }
                }

                await _context.SaveChangesAsync();
                await tx.CommitAsync();
                response.Success = true;
                return response;
            }
            catch (DbUpdateException ex)
            {
                await tx.RollbackAsync();
                response.Success = false;
                response.Errors.Add(new SkuBulkUpdateError
                {
                    RowNumber = 0,
                    Message = ex.InnerException?.Message ?? ex.Message
                });
                return response;
            }
        }

        public async Task<List<SkuLabelRowDto>> GetSkuLabelRowsAsync(List<int> itemColorIds)
        {
            if (itemColorIds == null || itemColorIds.Count == 0)
            {
                return new List<SkuLabelRowDto>();
            }

            var ids = itemColorIds.Distinct().ToList();

            var baseRows = await (
                from sku in _context.Skus.AsNoTracking()
                join itemColor in _context.ItemColors.AsNoTracking() on sku.ItemColorId equals itemColor.ItemColorId
                join item in _context.Items.AsNoTracking() on itemColor.ItemId equals item.ItemId
                join color in _context.Colors.AsNoTracking() on itemColor.ColorId equals color.ColorId
                join size in _context.Sizes.AsNoTracking() on sku.SizeId equals size.SizeId
                join inventory in _context.Inventories.AsNoTracking()
                    on new { sku.ItemColorId, sku.SizeId } equals new { inventory.ItemColorId, inventory.SizeId }
                    into inventoryGroup
                from inventory in inventoryGroup.DefaultIfEmpty()
                where ids.Contains(itemColor.ItemColorId) && itemColor.Active == true
                select new
                {
                    itemColor.ItemColorId,
                    Sku = sku.SkuValue,
                    ItemNumber = item.ItemNumber,
                    PrimaryColorName = color.ColorName,
                    SizeName = size.SizeName,
                    size.SizeSequence,
                    Qty = inventory != null ? inventory.Qty : 0
                }).ToListAsync();

            if (baseRows.Count == 0)
            {
                return new List<SkuLabelRowDto>();
            }

            var secondaryRows = await (
                from isc in _context.ItemColorSecondaryColors.AsNoTracking()
                join color in _context.Colors.AsNoTracking() on isc.SecondaryColorId equals color.ColorId
                where ids.Contains(isc.ItemColorId)
                orderby isc.ItemColorId, isc.SortOrder, color.ColorName
                select new
                {
                    isc.ItemColorId,
                    color.ColorName
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
                var colorName = row.PrimaryColorName;
                if (!string.IsNullOrWhiteSpace(secondaryNames))
                {
                    colorName = $"{colorName}+{secondaryNames}";
                }

                return new SkuLabelRowDto
                {
                    ItemColorId = row.ItemColorId,
                    Sku = row.Sku,
                    ItemNumber = row.ItemNumber,
                    ColorName = colorName,
                    SizeName = row.SizeName,
                    SizeSequence = row.SizeSequence,
                    Qty = row.Qty
                };
            })
            .OrderBy(row => row.ItemNumber)
            .ThenBy(row => row.ColorName)
            .ThenBy(row => row.SizeSequence)
            .ToList();

            return results;
        }

        private static string NormalizeSkuInput(string? sku)
        {
            return (sku ?? string.Empty).Trim().ToUpperInvariant();
        }

        private static string BuildSku(
            string seasonName,
            string itemNumber,
            string colorName,
            string sizeName,
            IReadOnlyCollection<string>? secondaryColorNames = null)
        {
            var season = NormalizeSkuToken(seasonName);
            var item = NormalizeSkuToken(itemNumber);
            var size = NormalizeSkuToken(sizeName);
            var color = NormalizeSkuCompositeColor(colorName, secondaryColorNames);

            var reservedLength = 2 + season.Length + item.Length + size.Length;
            var maxColorLength = Math.Max(0, SkuMaxLength - reservedLength);
            if (color.Length > maxColorLength)
            {
                color = color.Substring(0, maxColorLength);
            }

            return $"*{season}{item}{color}{size}*";
        }

        private static string NormalizeSkuToken(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return string.Empty;
            }

            var builder = new StringBuilder(value.Length);

            foreach (var ch in value)
            {
                if (char.IsLetterOrDigit(ch))
                {
                    builder.Append(char.ToUpperInvariant(ch));
                }
            }

            return builder.ToString();
        }

        private static string NormalizeSkuColor(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return string.Empty;
            }

            var builder = new StringBuilder(value.Length);

            foreach (var ch in value)
            {
                if (!char.IsLetterOrDigit(ch))
                {
                    continue;
                }

                var upper = char.ToUpperInvariant(ch);
                if (upper == 'A' || upper == 'E' || upper == 'I' || upper == 'O' || upper == 'U')
                {
                    continue;
                }

                builder.Append(upper);
            }

            return builder.ToString();
        }

        private static string NormalizeSkuCompositeColor(
            string? primaryColorName,
            IReadOnlyCollection<string>? secondaryColorNames)
        {
            var builder = new StringBuilder();
            builder.Append(NormalizeSkuColor(primaryColorName));

            if (secondaryColorNames == null || secondaryColorNames.Count == 0)
            {
                return builder.ToString();
            }

            foreach (var secondary in secondaryColorNames)
            {
                var token = NormalizeSkuColor(secondary);
                if (token.Length == 0)
                {
                    continue;
                }

                // Prefix each secondary segment so "White+Blue" and "WhiteBlue" don't collapse identically.
                builder.Append('X');
                builder.Append(token);
            }

            return builder.ToString();
        }
    }
}
