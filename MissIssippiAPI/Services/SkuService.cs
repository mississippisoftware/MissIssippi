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

        public SkuService(MissIssippiContext context)
        {
            _context = context;
        }

        public async Task<int> EnsureSkusForItemColorAsync(int itemColorId)
        {
            var itemColor = await _context.ItemColors
                .Include(ic => ic.Item)
                    .ThenInclude(i => i.Season)
                .Include(ic => ic.Color)
                .FirstOrDefaultAsync(ic => ic.ItemColorId == itemColorId);

            if (itemColor == null)
            {
                throw new InvalidOperationException("Item color not found.");
            }

            var sizes = await _context.Sizes.AsNoTracking()
                .OrderBy(x => x.SizeSequence)
                .ToListAsync();

            var existingSizeIds = await _context.Skus
                .Where(x => x.ItemColorId == itemColorId)
                .Select(x => x.SizeId)
                .ToListAsync();

            var existingSet = new HashSet<int>(existingSizeIds);
            var newSkus = new List<Sku>();

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
                    size.SizeName);

                newSkus.Add(new Sku
                {
                    ItemColorId = itemColorId,
                    SizeId = size.SizeId,
                    SkuValue = skuValue
                });
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

        public async Task<SkuAdjustmentsResult> ApplyAdjustmentsAsync(IEnumerable<SkuAdjustmentRequest> adjustments)
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
                    var newQty = Math.Max(0, group.Delta);
                    inventory = new Inventory
                    {
                        ItemColorId = skuEntity.ItemColorId,
                        SizeId = skuEntity.SizeId,
                        Qty = newQty
                    };
                    _context.Inventories.Add(inventory);
                }
                else
                {
                    inventory.Qty = Math.Max(0, inventory.Qty + group.Delta);
                }

                result.UpdatedCount += 1;
            }

            await _context.SaveChangesAsync();
            return result;
        }

        private static string NormalizeSkuInput(string sku)
        {
            return (sku ?? string.Empty).Trim().ToUpperInvariant();
        }

        private static string BuildSku(string seasonName, string itemNumber, string colorName, string sizeName)
        {
            var season = NormalizeSkuToken(seasonName);
            var item = NormalizeSkuToken(itemNumber);
            var size = NormalizeSkuToken(sizeName);
            var color = NormalizeSkuColor(colorName);

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
    }
}
