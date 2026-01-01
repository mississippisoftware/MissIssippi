using Microsoft.AspNetCore.Mvc;
using MissIssippiAPI.Models;
using MissIssippiAPI.Services;

namespace MissIssippiAPI
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
        public async Task<List<InventoryView>> GetInventory(string? StyleNumber = null,
                                                            string? Description = null,
                                                            string? ColorName = null,
                                                            string? SizeName = null,
                                                            string? SeasonName = null,
                                                            int? InventoryId = null,
                                                            int? StyleColorId = null,
                                                            int? StyleId = null,
                                                            int? ColorId = null,
                                                            int? SizeId = null,
                                                            int? SeasonId = null)
        {
            return await _inventoryService.GetInventoryAsync(
                StyleNumber,
                Description,
                ColorName,
                SizeName,
                SeasonName,
                InventoryId,
                StyleColorId,
                StyleId,
                ColorId,
                SizeId,
                SeasonId);
        }

        [HttpGet]
        public async Task<IEnumerable<InventoryPivotRow>> GetPivotInventory(string? StyleNumber = null,
                                                                            string? Description = null,
                                                                            string? ColorName = null,
                                                                            string? SizeName = null,
                                                                            string? SeasonName = null,
                                                                            int? InventoryId = null,
                                                                            int? StyleColorId = null,
                                                                            int? StyleId = null,
                                                                            int? ColorId = null,
                                                                            int? SizeId = null,
                                                                            int? SeasonId = null)
        {
            return await _inventoryService.GetPivotInventoryAsync(
                StyleNumber,
                Description,
                ColorName,
                SizeName,
                SeasonName,
                InventoryId,
                StyleColorId,
                StyleId,
                ColorId,
                SizeId,
                SeasonId);
        }

        [HttpPost]
        public async Task<bool> AddOrUpdateInventory(InventoryView? Inventory)
        {
            return await _inventoryService.AddOrUpdateInventoryAsync(Inventory);
        }

        [HttpPost]
        public async Task<bool> SaveInventoryUpdates([FromBody] List<InventoryView> updates)
        {
            return await _inventoryService.SaveInventoryUpdatesAsync(updates);
        }

        [HttpPost]
        public async Task<IActionResult> SavePivotInventory([FromBody] List<InventoryPivotRow> updates)
        {
            if (updates == null || updates.Count == 0)
            {
                return BadRequest("No updates provided");
            }

            var result = await _inventoryService.SavePivotInventoryAsync(updates);
            return Ok(result);
        }

        [HttpDelete]
        public async Task<bool> DeleteInventory(int InventoryId)
        {
            return await _inventoryService.DeleteInventoryAsync(InventoryId);
        }
    }
}
