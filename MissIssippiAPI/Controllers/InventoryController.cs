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
    }
}
