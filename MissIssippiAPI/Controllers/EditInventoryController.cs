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

        // GET: Used by the edit page to search styles and colors before editing
        [HttpGet]
        public async Task<IActionResult> SearchInventory(string? StyleNumber = null,
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
            var grouped = await _inventoryService.GetPivotInventoryAsync(
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

            return Ok(grouped);
        }

        [HttpPost]
        public async Task<IActionResult> SaveInventory([FromBody] List<InventoryPivotRow> updates)
        {
            if (updates == null || updates.Count == 0)
            {
                return BadRequest("No updates provided");
            }

            var result = await _inventoryService.SavePivotInventoryAsync(updates);
            return Ok(result);
        }
    }
}
