using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Linq;
using MissIssippiAPI.Data;
using MissIssippiAPI.Models;
using MissIssippiAPI.Services;
using Microsoft.EntityFrameworkCore;

namespace MissIssippiAPI
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
        public async Task<List<ItemColorView>> GetItemColor(int? ItemId = null, string? ItemNumber = null, string? SeasonName = null, int? ItemColorId = null, int? ColorId = null, int? SeasonId = null)
        {
            var seasonFilter = string.IsNullOrWhiteSpace(SeasonName) ? null : SeasonName;
            var includeLegacy = seasonFilter != null;

            var query = from s in _context.ItemColorViews
                        .Where(x =>
                                (x.ItemId == ItemId || ItemId == null)
                                && (x.ItemNumber.Contains(ItemNumber) || ItemNumber == null)
                                && (seasonFilter == null || x.SeasonName.Contains(seasonFilter) || (includeLegacy && x.SeasonName == "Legacy"))
                                && (x.ItemColorId == ItemColorId || ItemColorId == null)
                                && (x.ColorId == ColorId || ColorId == null)
                                && (x.SeasonId == SeasonId || SeasonId == null)
                                )
                        select new ItemColorView
                        {
                            ItemNumber = s.ItemNumber,
                            ColorName = s.ColorName,
                            PantoneColor = s.PantoneColor,
                            HexValue = s.HexValue,
                            ColorSeasonId = s.ColorSeasonId,
                            SeasonName = s.SeasonName,
                            ItemColorId = s.ItemColorId,
                            ColorId = s.ColorId,
                            ItemId = s.ItemId,
                            SeasonId = s.SeasonId,
                        };

            return await query.ToListAsync();
        }

        [HttpPost]
        public async Task<bool> AddOrUpdateItemColor(ItemColorSaveRequest? itemColor)
        {
            if (itemColor != null)
            {
                var existingItemColor = itemColor.ItemColorId != 0
                    ? await _context.ItemColors.Where(x => x.ItemColorId == itemColor.ItemColorId).FirstOrDefaultAsync()
                    : null;

                if (existingItemColor != null)
                {
                    existingItemColor.ItemId = itemColor.ItemId;
                    existingItemColor.ColorId = itemColor.ColorId;
                }
                else
                {
                    existingItemColor = new ItemColor
                    {
                        ItemId = itemColor.ItemId,
                        ColorId = itemColor.ColorId
                    };
                    _context.ItemColors.Add(existingItemColor);
                }

                await _context.SaveChangesAsync();

                var item = await _context.Items
                    .AsNoTracking()
                    .FirstOrDefaultAsync(x => x.ItemId == existingItemColor.ItemId);

                if (item?.InProduction == true)
                {
                    await _skuService.EnsureSkusForItemColorAsync(existingItemColor.ItemColorId);
                    await _inventoryService.EnsureInventoryForItemColorAsync(existingItemColor.ItemColorId);
                    await _inventoryService.EnsureInventoryForItemColorFromSkusAsync(existingItemColor.ItemColorId);
                }
                return true;
            }
            return false;
        }

        [HttpDelete]
        public async Task<bool> DeleteItemColor(int ItemColorId)
        {
            var existingItemColor = await _context.ItemColors.FindAsync(ItemColorId);
            if (existingItemColor != null)
            {
                _context.ItemColors.Remove(existingItemColor);
                await _context.SaveChangesAsync();
            }

            return true;
        }

    }
}
