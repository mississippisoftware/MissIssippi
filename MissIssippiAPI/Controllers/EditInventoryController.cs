using Microsoft.AspNetCore.Mvc;
using MissIssippiAPI.Models;
using MissIssippiAPI.Services;

namespace MissIssippiAPI.Controllers
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    public class EditInventoryController : ControllerBase
    {
        private readonly InventoryService _inventoryService;

        public EditInventoryController(InventoryService inventoryService)
        {
            _inventoryService = inventoryService;
        }

        // GET: Used by the edit page to search items and colors before editing
        [HttpGet]
        public async Task<IActionResult> SearchInventory(string? ItemNumber = null,
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

        [HttpPost]
        public async Task<IActionResult> SaveInventory([FromBody] List<InventoryPivotRow> updates)
        {
            var validationError = _inventoryService.ValidatePivotUpdates(updates);
            if (validationError != null)
            {
                return BadRequest(validationError);
            }

            var result = await _inventoryService.SavePivotInventoryAsync(updates, "edit");
            return Ok(result);
        }
    }
}
