using Microsoft.AspNetCore.Mvc;
using MissIssippiAPI.Services;

namespace MissIssippiAPI.Controllers
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    public class ViewInventoryController : ControllerBase
    {
        private readonly InventoryService _inventoryService;

        public ViewInventoryController(InventoryService inventoryService)
        {
            _inventoryService = inventoryService;
        }

        // GET: Fetch inventory grouped by item/color for the read-only view page
        [HttpGet]
        public async Task<IActionResult> GetInventory(string? ItemNumber = null,
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
            var grouped = await _inventoryService.GetPivotInventoryAsync(
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

            return Ok(grouped);
        }
    }
}
