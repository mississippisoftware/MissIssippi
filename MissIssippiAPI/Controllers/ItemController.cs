using Microsoft.AspNetCore.Mvc;
using System.Linq;
using MissIssippiAPI.Data;
using MissIssippiAPI.Dtos;
using MissIssippiAPI.Models;
using MissIssippiAPI.Services;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;

namespace MissIssippiAPI.Controllers
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    public class ItemController : ControllerBase
    {
        private readonly MissIssippiContext _context;
        private readonly SkuService _skuService;
        private readonly InventoryService _inventoryService;
        private readonly IConfiguration _configuration;

        public ItemController(
            MissIssippiContext context,
            SkuService skuService,
            InventoryService inventoryService,
            IConfiguration configuration)
        {
            _context = context;
            _skuService = skuService;
            _inventoryService = inventoryService;
            _configuration = configuration;
        }

        [HttpGet]
        public async Task<List<ItemReadDto>> GetItem(int? ItemId = null, string? ItemNumber = null, string? Description = null, string? SeasonName = null, bool? InProduction = null)
        {
            var seasonFilter = string.IsNullOrWhiteSpace(SeasonName) ? null : SeasonName;
            var includeLegacy = seasonFilter != null;

            var query =
                from item in _context.Items.AsNoTracking()
                join season in _context.Seasons.AsNoTracking() on item.SeasonId equals season.SeasonId
                where (ItemId == null || item.ItemId == ItemId)
                      && (ItemNumber == null || item.ItemNumber.Contains(ItemNumber))
                      && (Description == null || item.Description.Contains(Description))
                      && (seasonFilter == null
                          || season.SeasonName.Contains(seasonFilter)
                          || (includeLegacy && season.SeasonName == "Legacy"))
                      && (InProduction == null || item.InProduction == InProduction)
                select new ItemReadDto
                {
                    ItemNumber = item.ItemNumber,
                    Description = item.Description,
                    CostPrice = item.CostPrice,
                    WholesalePrice = item.WholesalePrice,
                    Weight = item.Weight,
                    SeasonName = season.SeasonName,
                    SeasonDateCreated = season.SeasonDateCreated,
                    SeasonActive = season.Active,
                    ItemDateCreated = item.ItemDateCreated,
                    InProduction = item.InProduction,
                    ItemId = item.ItemId,
                    SeasonId = item.SeasonId,
                };

            return await query.ToListAsync();
        }

        [HttpPost]
        public async Task<IActionResult> AddOrUpdateItem(ItemSaveRequest? item)
        {
            if (item == null)
            {
                return BadRequest("Item is required.");
            }

            if (string.IsNullOrWhiteSpace(item.Description))
            {
                return BadRequest("Description is required.");
            }

            var existingItem = item.ItemId != 0
                ? await _context.Items.Where(x => x.ItemId == item.ItemId).FirstOrDefaultAsync()
                : null;

            var isNew = existingItem == null;
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
                    ItemDateCreated = DateTime.UtcNow,
                    InProduction = item.InProduction
                };
                _context.Items.Add(existingItem);
            }

            await _context.SaveChangesAsync();

            if (!wasInProduction && existingItem.InProduction)
            {
                var itemColorsToActivate = await _context.ItemColors
                    .Where(x => x.ItemId == existingItem.ItemId && x.Active == false)
                    .ToListAsync();
                if (itemColorsToActivate.Count > 0)
                {
                    itemColorsToActivate.ForEach(color => color.Active = true);
                    await _context.SaveChangesAsync();
                }
            }

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

            if (isNew)
            {
                return CreatedAtAction(nameof(GetItem), new { ItemId = existingItem.ItemId }, true);
            }

            return Ok(true);
        }

        [HttpDelete]
        public async Task<IActionResult> DeleteItem(int ItemId)
        {
            var existingItem = await _context.Items.FindAsync(ItemId);
            if (existingItem == null)
            {
                return NotFound("Item not found.");
            }

            _context.Items.Remove(existingItem);
            await _context.SaveChangesAsync();

            return Ok(true);
        }

        [HttpPost]
        public async Task<IActionResult> AdminHardDeleteItems(ItemAdminHardDeleteRequest? request)
        {
            if (request == null)
            {
                return BadRequest("Request is required.");
            }

            var configuredPassword = _configuration["AdminActions:HardDeletePassword"];
            if (string.IsNullOrWhiteSpace(configuredPassword))
            {
                return StatusCode(StatusCodes.Status500InternalServerError,
                    "Admin hard delete password is not configured. Set 'AdminActions:HardDeletePassword' in secure configuration.");
            }

            if (string.IsNullOrWhiteSpace(request.Password) || !PasswordsMatch(request.Password, configuredPassword))
            {
                return Unauthorized("Invalid admin password.");
            }

            var requestedItemIds = (request.ItemIds ?? new List<int>())
                .Where(id => id > 0)
                .Distinct()
                .ToList();

            if (requestedItemIds.Count == 0)
            {
                return BadRequest("At least one valid item id is required.");
            }

            var existingItems = await _context.Items
                .AsNoTracking()
                .Where(x => requestedItemIds.Contains(x.ItemId))
                .Select(x => new { x.ItemId, x.ItemNumber })
                .ToListAsync();

            if (existingItems.Count == 0)
            {
                return NotFound("No matching items were found.");
            }

            var existingItemIds = existingItems.Select(x => x.ItemId).ToList();
            var existingItemIdSet = existingItemIds.ToHashSet();

            var result = new ItemAdminHardDeleteResult
            {
                RequestedItemCount = requestedItemIds.Count,
                DeletedItemIds = existingItemIds.OrderBy(x => x).ToList(),
                MissingItemIds = requestedItemIds.Where(id => !existingItemIdSet.Contains(id)).OrderBy(x => x).ToList(),
                DeletedItemNumbers = existingItems
                    .Select(x => x.ItemNumber)
                    .Where(x => !string.IsNullOrWhiteSpace(x))
                    .Distinct()
                    .OrderBy(x => x)
                    .ToList(),
            };

            var itemColorIds = await _context.ItemColors
                .AsNoTracking()
                .Where(x => existingItemIds.Contains(x.ItemId))
                .Select(x => x.ItemColorId)
                .ToListAsync();

            await using var tx = await _context.Database.BeginTransactionAsync();

            if (itemColorIds.Count > 0)
            {
                result.DeletedInventoryActivityLogCount = await _context.InventoryActivityLogs
                    .Where(x => itemColorIds.Contains(x.ItemColorId))
                    .ExecuteDeleteAsync();

                result.DeletedInventoryCount = await _context.Inventories
                    .Where(x => itemColorIds.Contains(x.ItemColorId))
                    .ExecuteDeleteAsync();

                result.DeletedSkuCount = await _context.Skus
                    .Where(x => itemColorIds.Contains(x.ItemColorId))
                    .ExecuteDeleteAsync();

                result.DeletedItemImageCount = await _context.ItemImages
                    .Where(x => itemColorIds.Contains(x.ItemColorId))
                    .ExecuteDeleteAsync();

                result.DeletedItemColorSecondaryColorCount = await _context.ItemColorSecondaryColors
                    .Where(x => itemColorIds.Contains(x.ItemColorId))
                    .ExecuteDeleteAsync();

                result.DeletedItemColorCount = await _context.ItemColors
                    .Where(x => existingItemIds.Contains(x.ItemId))
                    .ExecuteDeleteAsync();
            }

            result.DeletedItemCount = await _context.Items
                .Where(x => existingItemIds.Contains(x.ItemId))
                .ExecuteDeleteAsync();

            await tx.CommitAsync();
            return Ok(result);
        }

        private static bool PasswordsMatch(string provided, string expected)
        {
            var providedBytes = Encoding.UTF8.GetBytes(provided);
            var expectedBytes = Encoding.UTF8.GetBytes(expected);
            return CryptographicOperations.FixedTimeEquals(providedBytes, expectedBytes);
        }
    }
}
