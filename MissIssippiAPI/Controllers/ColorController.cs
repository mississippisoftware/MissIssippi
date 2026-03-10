using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Linq;
using MissIssippiAPI.Data;
using MissIssippiAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace MissIssippiAPI.Controllers
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    public class ColorController : ControllerBase
    {
        private readonly MissIssippiContext _context;

        public ColorController(MissIssippiContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<List<ColorDto>> GetColors(int? ColorId = null, string? ColorName = null, int? SeasonId = null)
        {
            var query =
                from c in _context.Colors
                join co in _context.Collections on c.CollectionId equals co.CollectionId into coGroup
                from co in coGroup.DefaultIfEmpty()
                where (c.ColorId == ColorId || ColorId == null)
                      && (c.ColorName.Contains(ColorName) || ColorName == null)
                      && (c.SeasonId == SeasonId || SeasonId == null)
                select new ColorDto
                {
                    ColorId = c.ColorId,
                    ColorName = c.ColorName,
                    SeasonId = c.SeasonId,
                    Collection = co != null ? co.CollectionName : null,
                    PantoneColor = c.PantoneColor,
                    HexValue = c.HexValue
                };

            return await query.ToListAsync();
        }

        [HttpPost]
        public async Task<IActionResult> AddOrUpdateColor(ColorSaveRequest? color)
        {
            if (color == null || string.IsNullOrWhiteSpace(color.ColorName))
            {
                return Ok(false);
            }

            var normalizedName = color.ColorName.Trim();
            var normalizedCollection = string.IsNullOrWhiteSpace(color.Collection)
                ? null
                : color.Collection.Trim();

            var hasDuplicate = await (from c in _context.Colors
                                      join co in _context.Collections on c.CollectionId equals co.CollectionId into coGroup
                                      from co in coGroup.DefaultIfEmpty()
                                      where c.ColorId != color.ColorId
                                            && c.ColorName == normalizedName
                                            && c.SeasonId == color.SeasonId
                                            && (normalizedCollection == null
                                                ? c.CollectionId == null
                                                : co != null && co.CollectionName == normalizedCollection)
                                      select c.ColorId).AnyAsync();

            if (hasDuplicate)
            {
                return Conflict($"Color '{normalizedName}' already exists.");
            }

            Collection? collectionEntity = null;
            if (!string.IsNullOrWhiteSpace(normalizedCollection))
            {
                collectionEntity = await _context.Collections
                    .FirstOrDefaultAsync(x => x.CollectionName == normalizedCollection);
                if (collectionEntity == null)
                {
                    return BadRequest($"Collection '{normalizedCollection}' not found.");
                }
            }

            var existingColor = color.ColorId != 0
                ? await _context.Colors.Where(x => x.ColorId == color.ColorId).FirstOrDefaultAsync()
                : null;

            if (existingColor != null)
            {
                existingColor.ColorName = normalizedName;
                existingColor.SeasonId = color.SeasonId;
                existingColor.Collection = collectionEntity;
                existingColor.PantoneColor = color.PantoneColor;
                existingColor.HexValue = color.HexValue;
            }
            else
            {
                existingColor = new Color
                {
                    ColorName = normalizedName,
                    SeasonId = color.SeasonId,
                    Collection = collectionEntity,
                    PantoneColor = color.PantoneColor,
                    HexValue = color.HexValue
                };
                _context.Colors.Add(existingColor);
            }

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                return Conflict($"Color '{normalizedName}' already exists.");
            }

            return Ok(true);
        }

        [HttpDelete]
        public async Task<bool> DeleteColor(int ColorId)
        {
            var existingColor = await _context.Colors.FindAsync(ColorId);
            if (existingColor != null) {
                _context.Colors.Remove(existingColor);
                await _context.SaveChangesAsync();
            }

            return true;
        }

        [HttpPost]
        public async Task<IActionResult> MigrateColor(ColorMigrationRequest? request)
        {
            if (request == null || request.SourceColorId <= 0 || request.TargetColorId <= 0)
            {
                return BadRequest("Source and target color are required.");
            }

            if (request.SourceColorId == request.TargetColorId)
            {
                return BadRequest("Source and target colors must be different.");
            }

            var sourceColor = await _context.Colors.FirstOrDefaultAsync(x => x.ColorId == request.SourceColorId);
            if (sourceColor == null)
            {
                return NotFound("Source color not found.");
            }

            var targetColor = await _context.Colors.FirstOrDefaultAsync(x => x.ColorId == request.TargetColorId);
            if (targetColor == null)
            {
                return NotFound("Target color not found.");
            }

            await using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var sourceItemColors = await _context.ItemColors
                    .Where(x => x.ColorId == request.SourceColorId)
                    .ToListAsync();
                var targetItemColors = await _context.ItemColors
                    .Where(x => x.ColorId == request.TargetColorId)
                    .ToListAsync();
                var targetByItem = targetItemColors.ToDictionary(x => x.ItemId, x => x);

                var sourceItemColorIds = sourceItemColors.Select(x => x.ItemColorId).ToList();
                var targetItemColorIds = targetItemColors.Select(x => x.ItemColorId).ToList();

                var inventories = await _context.Inventories
                    .Where(x => sourceItemColorIds.Contains(x.ItemColorId) || targetItemColorIds.Contains(x.ItemColorId))
                    .ToListAsync();
                var inventoryByItemColor = inventories
                    .GroupBy(x => x.ItemColorId)
                    .ToDictionary(x => x.Key, x => x.ToList());

                var skus = await _context.Skus
                    .Where(x => sourceItemColorIds.Contains(x.ItemColorId) || targetItemColorIds.Contains(x.ItemColorId))
                    .ToListAsync();
                var skusByItemColor = skus
                    .GroupBy(x => x.ItemColorId)
                    .ToDictionary(x => x.Key, x => x.ToList());

                var images = await _context.ItemImages
                    .Where(x => sourceItemColorIds.Contains(x.ItemColorId) || targetItemColorIds.Contains(x.ItemColorId))
                    .ToListAsync();
                var imagesByItemColor = images
                    .GroupBy(x => x.ItemColorId)
                    .ToDictionary(x => x.Key, x => x.ToList());

                var logs = await _context.InventoryActivityLogs
                    .Where(x => sourceItemColorIds.Contains(x.ItemColorId) || targetItemColorIds.Contains(x.ItemColorId))
                    .ToListAsync();
                var logsByItemColor = logs
                    .GroupBy(x => x.ItemColorId)
                    .ToDictionary(x => x.Key, x => x.ToList());

                var secondaryLinks = await _context.ItemColorSecondaryColors
                    .Where(x => sourceItemColorIds.Contains(x.ItemColorId) || targetItemColorIds.Contains(x.ItemColorId))
                    .ToListAsync();
                var secondaryByItemColor = secondaryLinks
                    .GroupBy(x => x.ItemColorId)
                    .ToDictionary(x => x.Key, x => x.ToList());

                foreach (var sourceItemColor in sourceItemColors)
                {
                    if (targetByItem.TryGetValue(sourceItemColor.ItemId, out var targetItemColor))
                    {
                        var sourceInventories =
                            inventoryByItemColor.TryGetValue(sourceItemColor.ItemColorId, out var inv)
                                ? inv
                                : new List<Inventory>();
                        var targetInventories =
                            inventoryByItemColor.TryGetValue(targetItemColor.ItemColorId, out var tgtInv)
                                ? tgtInv
                                : new List<Inventory>();
                        var targetInvMap = targetInventories.ToDictionary(x => x.SizeId, x => x);
                        foreach (var entry in sourceInventories)
                        {
                            if (targetInvMap.TryGetValue(entry.SizeId, out var targetEntry))
                            {
                                targetEntry.Qty += entry.Qty;
                                _context.Inventories.Remove(entry);
                            }
                            else
                            {
                                entry.ItemColorId = targetItemColor.ItemColorId;
                            }
                        }

                        var sourceSkus =
                            skusByItemColor.TryGetValue(sourceItemColor.ItemColorId, out var skuList)
                                ? skuList
                                : new List<Sku>();
                        var targetSkus =
                            skusByItemColor.TryGetValue(targetItemColor.ItemColorId, out var targetSkuList)
                                ? targetSkuList
                                : new List<Sku>();
                        var targetSkuSizes = new HashSet<int>(targetSkus.Select(x => x.SizeId));
                        foreach (var sku in sourceSkus)
                        {
                            if (targetSkuSizes.Contains(sku.SizeId))
                            {
                                _context.Skus.Remove(sku);
                            }
                            else
                            {
                                sku.ItemColorId = targetItemColor.ItemColorId;
                            }
                        }

                        var sourceImages =
                            imagesByItemColor.TryGetValue(sourceItemColor.ItemColorId, out var imageList)
                                ? imageList
                                : new List<ItemImage>();
                        foreach (var image in sourceImages)
                        {
                            image.ItemColorId = targetItemColor.ItemColorId;
                        }

                        var sourceLogs =
                            logsByItemColor.TryGetValue(sourceItemColor.ItemColorId, out var logList)
                                ? logList
                                : new List<InventoryActivityLog>();
                        foreach (var log in sourceLogs)
                        {
                            log.ItemColorId = targetItemColor.ItemColorId;
                        }

                        var sourceSecondary =
                            secondaryByItemColor.TryGetValue(sourceItemColor.ItemColorId, out var secondaryList)
                                ? secondaryList
                                : new List<ItemColorSecondaryColor>();
                        var targetSecondary =
                            secondaryByItemColor.TryGetValue(targetItemColor.ItemColorId, out var targetSecondaryList)
                                ? targetSecondaryList
                                : new List<ItemColorSecondaryColor>();
                        var targetSecondaryIds = new HashSet<int>(targetSecondary.Select(x => x.SecondaryColorId));
                        foreach (var link in sourceSecondary)
                        {
                            if (targetSecondaryIds.Contains(link.SecondaryColorId))
                            {
                                _context.ItemColorSecondaryColors.Remove(link);
                            }
                            else
                            {
                                link.ItemColorId = targetItemColor.ItemColorId;
                                targetSecondaryIds.Add(link.SecondaryColorId);
                            }
                        }

                        _context.ItemColors.Remove(sourceItemColor);
                    }
                    else
                    {
                        sourceItemColor.ColorId = request.TargetColorId;
                    }
                }

                var secondaryWithSource = await _context.ItemColorSecondaryColors
                    .Where(x => x.SecondaryColorId == request.SourceColorId)
                    .ToListAsync();
                if (secondaryWithSource.Count > 0)
                {
                    var itemColorIds = secondaryWithSource.Select(x => x.ItemColorId).Distinct().ToList();
                    var existingTargetLinks = await _context.ItemColorSecondaryColors
                        .Where(x => x.SecondaryColorId == request.TargetColorId && itemColorIds.Contains(x.ItemColorId))
                        .Select(x => x.ItemColorId)
                        .ToListAsync();
                    var existingTargetSet = new HashSet<int>(existingTargetLinks);

                    foreach (var link in secondaryWithSource)
                    {
                        if (existingTargetSet.Contains(link.ItemColorId))
                        {
                            _context.ItemColorSecondaryColors.Remove(link);
                        }
                        else
                        {
                            link.SecondaryColorId = request.TargetColorId;
                            existingTargetSet.Add(link.ItemColorId);
                        }
                    }
                }

                await _context.SaveChangesAsync();

                var stillUsed = await _context.ItemColors.AnyAsync(x => x.ColorId == request.SourceColorId)
                                || await _context.ItemColorSecondaryColors.AnyAsync(x => x.SecondaryColorId == request.SourceColorId);
                if (!stillUsed)
                {
                    _context.Colors.Remove(sourceColor);
                    await _context.SaveChangesAsync();
                }

                await transaction.CommitAsync();
                return Ok(true);
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                return StatusCode(StatusCodes.Status500InternalServerError, "Unable to migrate color.");
            }
        }

    }
}
