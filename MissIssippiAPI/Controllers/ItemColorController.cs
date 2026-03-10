using Microsoft.AspNetCore.Mvc;
using System.Linq;
using MissIssippiAPI.Data;
using MissIssippiAPI.Dtos;
using MissIssippiAPI.Models;
using MissIssippiAPI.Services;
using Microsoft.EntityFrameworkCore;

namespace MissIssippiAPI.Controllers
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    public class ItemColorController : ControllerBase
    {
        private readonly MissIssippiContext _context;
        private readonly SkuService _skuService;
        private readonly InventoryService _inventoryService;

        public ItemColorController(MissIssippiContext context, SkuService skuService, InventoryService inventoryService)
        {
            _context = context;
            _skuService = skuService;
            _inventoryService = inventoryService;
        }

        [HttpGet]
        public async Task<List<ItemColorReadDto>> GetItemColor(int? ItemId = null, string? ItemNumber = null, string? SeasonName = null, int? ItemColorId = null, int? ColorId = null, int? SeasonId = null)
        {
            var seasonFilter = string.IsNullOrWhiteSpace(SeasonName) ? null : SeasonName;
            var includeLegacy = seasonFilter != null;

            var baseRows = await (
                from sc in _context.ItemColors.AsNoTracking()
                join item in _context.Items.AsNoTracking() on sc.ItemId equals item.ItemId
                join season in _context.Seasons.AsNoTracking() on item.SeasonId equals season.SeasonId
                join color in _context.Colors.AsNoTracking() on sc.ColorId equals color.ColorId
                join collection in _context.Collections.AsNoTracking() on color.CollectionId equals collection.CollectionId into collectionGroup
                from collection in collectionGroup.DefaultIfEmpty()
                where (ItemId == null || sc.ItemId == ItemId)
                      && (ItemNumber == null || item.ItemNumber.Contains(ItemNumber))
                      && (seasonFilter == null
                          || season.SeasonName.Contains(seasonFilter)
                          || (includeLegacy && season.SeasonName == "Legacy"))
                      && (ItemColorId == null || sc.ItemColorId == ItemColorId)
                      && (ColorId == null || sc.ColorId == ColorId)
                      && (SeasonId == null || season.SeasonId == SeasonId)
                select new
                {
                    sc.ItemColorId,
                    sc.ItemId,
                    sc.ColorId,
                    sc.Active,
                    item.ItemNumber,
                    SeasonId = season.SeasonId,
                    SeasonName = season.SeasonName,
                    PrimaryColorName = color.ColorName,
                    color.PantoneColor,
                    color.HexValue,
                    ColorSeasonId = color.SeasonId,
                    Collection = collection != null ? collection.CollectionName : null
                }).ToListAsync();

            if (baseRows.Count == 0)
            {
                return new List<ItemColorReadDto>();
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
                var colorName = row.PrimaryColorName;
                if (!string.IsNullOrWhiteSpace(secondaryNames))
                {
                    colorName = $"{colorName}+{secondaryNames}";
                }

                return new ItemColorReadDto
                {
                    ItemNumber = row.ItemNumber,
                    ColorName = colorName,
                    Collection = row.Collection,
                    PantoneColor = row.PantoneColor,
                    HexValue = row.HexValue,
                    ColorSeasonId = row.ColorSeasonId,
                    SeasonName = row.SeasonName,
                    ItemColorId = row.ItemColorId,
                    ColorId = row.ColorId,
                    ItemId = row.ItemId,
                    SeasonId = row.SeasonId,
                    ItemColorActive = row.Active,
                };
            }).ToList();

            return results;
        }

        [HttpPost]
        public async Task<IActionResult> AddOrUpdateItemColor(ItemColorSaveRequest? itemColor)
        {
            if (itemColor == null)
            {
                return BadRequest("Item color is required.");
            }

            var desiredSecondaryIds = itemColor.SecondaryColorIds != null
                ? NormalizeSecondaryIds(itemColor.SecondaryColorIds, itemColor.ColorId)
                : null;

            var requestedCompositeSignature = desiredSecondaryIds != null
                ? BuildCompositeSignature(desiredSecondaryIds)
                : null;

            ItemColor? existingItemColor;
            if (itemColor.ItemColorId != 0)
            {
                existingItemColor = await _context.ItemColors
                    .FirstOrDefaultAsync(x => x.ItemColorId == itemColor.ItemColorId);
            }
            else
            {
                var targetSignature = requestedCompositeSignature ?? string.Empty;
                existingItemColor = await _context.ItemColors.FirstOrDefaultAsync(x =>
                    x.ItemId == itemColor.ItemId &&
                    x.ColorId == itemColor.ColorId &&
                    (x.CompositeSignature ?? string.Empty) == targetSignature);
            }

            if (existingItemColor != null)
            {
                var targetSignature = requestedCompositeSignature ?? (existingItemColor.CompositeSignature ?? string.Empty);
                var conflictingItemColor = await _context.ItemColors
                    .AsNoTracking()
                    .FirstOrDefaultAsync(x =>
                        x.ItemColorId != existingItemColor.ItemColorId &&
                        x.ItemId == itemColor.ItemId &&
                        x.ColorId == itemColor.ColorId &&
                        (x.CompositeSignature ?? string.Empty) == targetSignature);

                if (conflictingItemColor != null)
                {
                    return Conflict("This style already has that exact primary + secondary color combination.");
                }

                existingItemColor.ItemId = itemColor.ItemId;
                existingItemColor.ColorId = itemColor.ColorId;
                if (requestedCompositeSignature != null)
                {
                    existingItemColor.CompositeSignature = requestedCompositeSignature;
                }
                else if (string.IsNullOrWhiteSpace(existingItemColor.CompositeSignature))
                {
                    existingItemColor.CompositeSignature = string.Empty;
                }
            }
            else
            {
                existingItemColor = new ItemColor
                {
                    ItemId = itemColor.ItemId,
                    ColorId = itemColor.ColorId,
                    Active = true,
                    CompositeSignature = requestedCompositeSignature ?? string.Empty
                };
                _context.ItemColors.Add(existingItemColor);
            }

            await _context.SaveChangesAsync();

            if (itemColor.SecondaryColorIds != null)
            {
                var normalizedSecondaryIds = desiredSecondaryIds ?? new List<int>();

                var existingSecondary = await _context.ItemColorSecondaryColors
                    .Where(x => x.ItemColorId == existingItemColor.ItemColorId)
                    .ToListAsync();

                var desiredSet = normalizedSecondaryIds.ToHashSet();
                var toRemove = existingSecondary
                    .Where(x => !desiredSet.Contains(x.SecondaryColorId))
                    .ToList();
                if (toRemove.Count > 0)
                {
                    _context.ItemColorSecondaryColors.RemoveRange(toRemove);
                }

                var existingMap = existingSecondary.ToDictionary(x => x.SecondaryColorId);
                for (var i = 0; i < normalizedSecondaryIds.Count; i += 1)
                {
                    var secondaryId = normalizedSecondaryIds[i];
                    if (existingMap.TryGetValue(secondaryId, out var row))
                    {
                        row.SortOrder = i + 1;
                    }
                    else
                    {
                        _context.ItemColorSecondaryColors.Add(new ItemColorSecondaryColor
                        {
                            ItemColorId = existingItemColor.ItemColorId,
                            SecondaryColorId = secondaryId,
                            SortOrder = i + 1,
                        });
                    }
                }

                existingItemColor.CompositeSignature = BuildCompositeSignature(normalizedSecondaryIds);
                await _context.SaveChangesAsync();
            }

            var item = await _context.Items
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.ItemId == existingItemColor.ItemId);

            if (item?.InProduction == true)
            {
                await _skuService.EnsureSkusForItemColorAsync(existingItemColor.ItemColorId);
                await _inventoryService.EnsureInventoryForItemColorAsync(existingItemColor.ItemColorId);
                await _inventoryService.EnsureInventoryForItemColorFromSkusAsync(existingItemColor.ItemColorId);
            }
            return Ok(true);
        }

        private static List<int> NormalizeSecondaryIds(IEnumerable<int> secondaryColorIds, int primaryColorId)
        {
            return secondaryColorIds
                .Where(id => id > 0 && id != primaryColorId)
                .Distinct()
                .ToList();
        }

        private static string BuildCompositeSignature(IEnumerable<int> secondaryColorIds)
        {
            var sortedIds = secondaryColorIds
                .Where(id => id > 0)
                .Distinct()
                .OrderBy(id => id)
                .ToList();

            return sortedIds.Count == 0
                ? string.Empty
                : string.Join("|", sortedIds);
        }

        [HttpPost]
        public async Task<IActionResult> SetItemColorActive(ItemColorActiveRequest? request)
        {
            if (request == null || request.ItemColorId <= 0)
            {
                return BadRequest("Item color is required.");
            }

            var itemColor = await _context.ItemColors
                .Include(x => x.Item)
                .Include(x => x.Color)
                .FirstOrDefaultAsync(x => x.ItemColorId == request.ItemColorId);

            if (itemColor == null)
            {
                return NotFound("Item color not found.");
            }

            if (itemColor.Active == request.Active)
            {
                return Ok(true);
            }

            if (!request.Active)
            {
                var qtyInStock = await _context.Inventories
                    .Where(x => x.ItemColorId == request.ItemColorId)
                    .SumAsync(x => (int?)x.Qty) ?? 0;

                if (qtyInStock > 0)
                {
                    var itemNumber = itemColor.Item?.ItemNumber ?? "Unknown";
                    var colorName = itemColor.Color?.ColorName ?? "Unknown";
                    return Conflict(
                        $"Cannot remove color '{colorName}' from style '{itemNumber}' because inventory quantity is {qtyInStock}. Move or zero inventory first.");
                }

                itemColor.Active = false;
                await _context.SaveChangesAsync();

                var skus = await _context.Skus
                    .Where(x => x.ItemColorId == request.ItemColorId)
                    .ToListAsync();
                if (skus.Count > 0)
                {
                    _context.Skus.RemoveRange(skus);
                }

                await _context.SaveChangesAsync();
                return Ok(true);
            }

            itemColor.Active = true;
            await _context.SaveChangesAsync();

            if (itemColor.Item?.InProduction == true)
            {
                await _skuService.EnsureSkusForItemColorAsync(itemColor.ItemColorId);
                await _inventoryService.EnsureInventoryForItemColorAsync(itemColor.ItemColorId);
                await _inventoryService.EnsureInventoryForItemColorFromSkusAsync(itemColor.ItemColorId);
            }

            return Ok(true);
        }

        [HttpDelete]
        public async Task<IActionResult> DeleteItemColor(int ItemColorId)
        {
            var existingItemColor = await _context.ItemColors.FindAsync(ItemColorId);
            if (existingItemColor == null)
            {
                return NotFound("Item color not found.");
            }

            _context.ItemColors.Remove(existingItemColor);
            await _context.SaveChangesAsync();

            return Ok(true);
        }

    }
}
