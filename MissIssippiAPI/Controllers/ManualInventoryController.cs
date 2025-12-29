using Microsoft.AspNetCore.Mvc;
using MissIssippiAPI.Models;
using MissIssippiAPI.Services;

namespace MissIssippiAPI.Controllers
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    public class InventoryPageController : ControllerBase
    {
        private readonly InventoryService _inventoryService;

        public InventoryPageController(InventoryService inventoryService)
        {
            _inventoryService = inventoryService;
        }

        // GET: Fetch inventory grouped by style/color for your page
        [HttpGet]
        public async Task<IActionResult> GetPageInventory(string? StyleNumber = null,
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
    }
}
