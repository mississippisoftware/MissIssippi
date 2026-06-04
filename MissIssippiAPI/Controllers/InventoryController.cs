using Microsoft.AspNetCore.Mvc;
using MissIssippiAPI.Dtos;
using MissIssippiAPI.Models;
using MissIssippiAPI.Services;

namespace MissIssippiAPI.Controllers
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    public class InventoryController : ControllerBase
    {
        private readonly InventoryService _inventoryService;

        public InventoryController(InventoryService inventoryService)
        {
            _inventoryService = inventoryService;
        }

        [HttpGet]
        public async Task<List<InventoryRowDto>> GetInventory(string? ItemNumber = null,
                                                            string? Description = null,
                                                            string? ColorName = null,
                                                            string? SizeName = null,
                                                            string? SeasonName = null,
                                                            int? InventoryId = null,
                                                            int? ItemColorId = null,
                                                            int? ItemId = null,
                                                            int? ColorId = null,
                                                            int? SizeId = null,
                                                            int? SeasonId = null)
        {
            return await _inventoryService.GetInventoryAsync(
                ItemNumber,
                Description,
                ColorName,
                SizeName,
                SeasonName,
                InventoryId,
                ItemColorId,
                ItemId,
                ColorId,
                SizeId,
                SeasonId);
        }

        [HttpGet]
        public async Task<IEnumerable<InventoryPivotRow>> GetPivotInventory(string? ItemNumber = null,
                                                                            string? Description = null,
                                                                            string? ColorName = null,
                                                                            string? SizeName = null,
                                                                            string? SeasonName = null,
                                                                            int? InventoryId = null,
                                                                            int? ItemColorId = null,
                                                                            int? ItemId = null,
                                                                            int? ColorId = null,
                                                                            int? SizeId = null,
                                                                            int? SeasonId = null)
        {
            return await _inventoryService.GetPivotInventoryAsync(
                ItemNumber,
                Description,
                ColorName,
                SizeName,
                SeasonName,
                InventoryId,
                ItemColorId,
                ItemId,
                ColorId,
                SizeId,
                SeasonId);
        }

        [HttpPost]
        public async Task<IActionResult> AddOrUpdateInventory(InventoryRowDto? Inventory)
        {
            if (Inventory == null)
            {
                return BadRequest("Inventory update is required.");
            }

            var result = await _inventoryService.AddOrUpdateInventoryAsync(Inventory);
            if (!result)
            {
                return BadRequest("Inventory update failed.");
            }

            return Ok(true);
        }

        [HttpPost]
        public async Task<IActionResult> SaveInventoryUpdates([FromBody] List<InventoryRowDto> updates)
        {
            if (updates == null || updates.Count == 0)
            {
                return BadRequest("No updates provided.");
            }

            var result = await _inventoryService.SaveInventoryUpdatesAsync(updates);
            if (!result)
            {
                return BadRequest("Inventory updates failed.");
            }

            return Ok(true);
        }

        [HttpPost]
        public async Task<IActionResult> SavePivotInventory([FromBody] List<InventoryPivotRow> updates)
        {
            var validationError = _inventoryService.ValidatePivotUpdates(updates);
            if (validationError != null)
            {
                return BadRequest(validationError);
            }

            var result = await _inventoryService.SavePivotInventoryAsync(updates, "edit");
            return Ok(result);
        }

        [HttpDelete]
        public async Task<IActionResult> DeleteInventory(int InventoryId)
        {
            var deleted = await _inventoryService.DeleteInventoryAsync(InventoryId);
            if (!deleted)
            {
                return NotFound("Inventory not found.");
            }

            return Ok(true);
        }

        [HttpGet]
        public async Task<List<SeasonLookupDto>> GetSeasons()
        {
            return await _inventoryService.GetSeasonsAsync();
        }

        [HttpGet]
        public async Task<List<CollectionLookupDto>> GetCollections()
        {
            return await _inventoryService.GetCollectionsAsync();
        }

        [HttpGet]
        public async Task<InventorySearchResult> SearchInventory(
            [FromQuery] int? SeasonId = null,
            [FromQuery] string? ItemNumber = null,
            [FromQuery] string? ColorName = null,
            [FromQuery] string? SizeName = null,
            [FromQuery] int? CollectionId = null,
            [FromQuery] bool InStockOnly = false,
            [FromQuery] bool InProductionOnly = false,
            [FromQuery] int Page = 1,
            [FromQuery] int PageSize = 25)
        {
            return await _inventoryService.SearchInventoryAsync(new InventorySearchQuery
            {
                SeasonId = SeasonId,
                ItemNumber = ItemNumber,
                ColorName = ColorName,
                SizeName = SizeName,
                CollectionId = CollectionId,
                InStockOnly = InStockOnly,
                InProductionOnly = InProductionOnly,
                Page = Page,
                PageSize = PageSize
            });
        }

        [HttpGet]
        public async Task<IActionResult> CheckAvailability(
            [FromQuery] List<string>? SkuValues = null,
            [FromQuery] int? ItemColorId = null,
            [FromQuery] int? SizeId = null)
        {
            if ((SkuValues == null || !SkuValues.Any()) && !ItemColorId.HasValue)
                return BadRequest("Either SkuValues or ItemColorId is required.");

            return Ok(await _inventoryService.CheckAvailabilityAsync(SkuValues, ItemColorId, SizeId));
        }

        [HttpGet]
        public async Task<IActionResult> GetInventoryActivityForVariant(
            [FromQuery] string? SkuValue = null,
            [FromQuery] int? ItemColorId = null,
            [FromQuery] DateTime? FromDate = null,
            [FromQuery] DateTime? ToDate = null,
            [FromQuery] int Page = 1,
            [FromQuery] int PageSize = 50)
        {
            if (string.IsNullOrWhiteSpace(SkuValue) && !ItemColorId.HasValue)
                return BadRequest("Either SkuValue or ItemColorId is required.");

            var result = await _inventoryService.GetInventoryActivityForVariantAsync(new InventoryActivityQuery
            {
                SkuValue = SkuValue,
                ItemColorId = ItemColorId,
                FromDate = FromDate,
                ToDate = ToDate,
                Page = Page,
                PageSize = PageSize
            });

            if (result == null)
                return NotFound($"SKU '{SkuValue}' not found.");

            return Ok(result);
        }

        [HttpGet]
        public async Task<LowStockResult> GetLowStockItems(
            [FromQuery] int MaxQty = 0,
            [FromQuery] int? SeasonId = null,
            [FromQuery] bool InProductionOnly = false,
            [FromQuery] int Page = 1,
            [FromQuery] int PageSize = 50)
        {
            return await _inventoryService.GetLowStockItemsAsync(new LowStockQuery
            {
                MaxQty = MaxQty,
                SeasonId = SeasonId,
                InProductionOnly = InProductionOnly,
                Page = Page,
                PageSize = PageSize
            });
        }

        [HttpGet]
        public async Task<StyleNumberResult> SearchByStyleNumber(
            [FromQuery] string ItemNumber = "",
            [FromQuery] int? SeasonId = null,
            [FromQuery] bool IncludeVariantSummary = false)
        {
            return await _inventoryService.SearchByStyleNumberAsync(new StyleNumberQuery
            {
                ItemNumber = ItemNumber,
                SeasonId = SeasonId,
                IncludeVariantSummary = IncludeVariantSummary
            });
        }

        [HttpGet]
        public async Task<IActionResult> SearchBySeason(
            [FromQuery] int SeasonId = 0,
            [FromQuery] bool InStockOnly = false,
            [FromQuery] bool InProductionOnly = false,
            [FromQuery] int Page = 1,
            [FromQuery] int PageSize = 50)
        {
            if (SeasonId <= 0)
                return BadRequest("SeasonId is required.");

            return Ok(await _inventoryService.SearchBySeasonAsync(new SearchBySeasonQuery
            {
                SeasonId = SeasonId,
                InStockOnly = InStockOnly,
                InProductionOnly = InProductionOnly,
                Page = Page,
                PageSize = PageSize
            }));
        }

        [HttpGet]
        public async Task<IActionResult> GetProductDetails([FromQuery] int ItemId)
        {
            if (ItemId <= 0)
                return BadRequest("ItemId is required.");

            var result = await _inventoryService.GetProductDetailsAsync(ItemId);
            if (result == null)
                return NotFound($"Item {ItemId} not found.");

            return Ok(result);
        }

        [HttpGet]
        public async Task<SearchByColorResult> SearchByColor(
            [FromQuery] string? ColorName = null,
            [FromQuery] int? CollectionId = null,
            [FromQuery] int? SeasonId = null,
            [FromQuery] bool InStockOnly = false,
            [FromQuery] bool IncludePrimary = true,
            [FromQuery] bool IncludeSecondary = false,
            [FromQuery] int Page = 1,
            [FromQuery] int PageSize = 25)
        {
            return await _inventoryService.SearchByColorAsync(new SearchByColorQuery
            {
                ColorName = ColorName,
                CollectionId = CollectionId,
                SeasonId = SeasonId,
                InStockOnly = InStockOnly,
                IncludePrimary = IncludePrimary,
                IncludeSecondary = IncludeSecondary,
                Page = Page,
                PageSize = PageSize
            });
        }
    }
}
