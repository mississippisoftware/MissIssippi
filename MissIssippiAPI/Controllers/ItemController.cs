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
    public class ItemController : ControllerBase
    {
        private readonly MissIssippiContext _context;
        private readonly SkuService _skuService;
        private readonly InventoryService _inventoryService;

        public ItemController(MissIssippiContext context, SkuService skuService, InventoryService inventoryService)
        {
            _context = context;
            _skuService = skuService;
            _inventoryService = inventoryService;
        }

        [HttpGet]
        public async Task<List<ItemView>> GetItem(int? ItemId = null, string? ItemNumber = null, string? Description = null, string? SeasonName = null, bool? InProduction = null)
        {
            var seasonFilter = string.IsNullOrWhiteSpace(SeasonName) ? null : SeasonName;
            var includeLegacy = seasonFilter != null;

            var query = from s in _context.ItemViews
                        .Where(x =>
                                (x.ItemId == ItemId || ItemId == null)
                                && (x.ItemNumber.Contains(ItemNumber) || ItemNumber == null)
                                && (x.Description.Contains(Description) || Description == null)
                                && (seasonFilter == null || x.SeasonName.Contains(seasonFilter) || (includeLegacy && x.SeasonName == "Legacy"))
                                && (x.InProduction == InProduction || InProduction == null)
                                )
                        select new ItemView
                        {
                            ItemNumber = s.ItemNumber,
                            Description = s.Description,
                            CostPrice = s.CostPrice,
                            WholesalePrice = s.WholesalePrice,
                            Weight = s.Weight,
                            SeasonName = s.SeasonName,
                            SeasonDateCreated = s.SeasonDateCreated,
                            SeasonActive = s.SeasonActive,
                            ItemDateCreated = s.ItemDateCreated,
                            InProduction = s.InProduction,
                            ItemId = s.ItemId,
                            SeasonId = s.SeasonId,
                        };

            return await query.ToListAsync();
        }

        [HttpPost]
        public async Task<bool> AddOrUpdateItem(ItemSaveRequest? item)
        {
            if (item != null)
            {
                if (string.IsNullOrWhiteSpace(item.Description))
                {
                    return false;
                }

                var existingItem = item.ItemId != 0
                    ? await _context.Items.Where(x => x.ItemId == item.ItemId).FirstOrDefaultAsync()
                    : null;
                var wasInProduction = existingItem?.InProduction ?? false;

                if (existingItem != null)
                {
                    existingItem.ItemNumber = item.ItemNumber;
                    existingItem.Description = item.Description.Trim();
                    existingItem.CostPrice = item.CostPrice;
                    existingItem.WholesalePrice = item.WholesalePrice;
                    existingItem.Weight = item.Weight;
                    existingItem.SeasonId = item.SeasonId;
                    existingItem.InProduction = item.InProduction;
                }
                else
                {
                    existingItem = new Item
                    {
                        ItemNumber = item.ItemNumber,
                        Description = item.Description.Trim(),
                        CostPrice = item.CostPrice,
                        WholesalePrice = item.WholesalePrice,
                        Weight = item.Weight,
                        SeasonId = item.SeasonId,
                        ItemDateCreated = DateTime.Now,
                        InProduction = item.InProduction
                    };
                    _context.Items.Add(existingItem);
                }

                await _context.SaveChangesAsync();

                if (existingItem.InProduction)
                {
                    var itemColorIds = await _context.ItemColors
                        .Where(x => x.ItemId == existingItem.ItemId)
                        .Select(x => x.ItemColorId)
                        .ToListAsync();

                    foreach (var itemColorId in itemColorIds)
                    {
                        await _skuService.EnsureSkusForItemColorAsync(itemColorId);
                        await _inventoryService.EnsureInventoryForItemColorAsync(itemColorId);
                        await _inventoryService.EnsureInventoryForItemColorFromSkusAsync(itemColorId);
                    }
                }
                return true;
            }
            return false;
        }

        [HttpDelete]
        public async Task<bool> DeleteItem(int ItemId)
        {
            var existingItem = await _context.Items.FindAsync(ItemId);
            if (existingItem != null)
            {
                _context.Items.Remove(existingItem);
                await _context.SaveChangesAsync();
            }

            return true;
        }

    }
}
