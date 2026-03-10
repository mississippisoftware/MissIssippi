using Microsoft.AspNetCore.Mvc;
using MissIssippiAPI.Models;
using MissIssippiAPI.Services;

namespace MissIssippiAPI.Controllers
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    public class InventoryUploadController : ControllerBase
    {
        private readonly InventoryUploadService _uploadService;

        public InventoryUploadController(InventoryUploadService uploadService)
        {
            _uploadService = uploadService;
        }

        [HttpPost]
        public async Task<ActionResult<InventoryUploadResult>> UploadInventory([FromBody] InventoryUploadRequest? request)
        {
            try
            {
                var headerKey = Request.Headers.TryGetValue("Idempotency-Key", out var values)
                    ? values.ToString()
                    : null;
                var result = await _uploadService.UploadAsync(request, headerKey);
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest($"Inventory upload validation failed: {ex.Message}");
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest($"Inventory upload validation failed: {ex.Message}");
            }
        }

        [HttpPost]
        public async Task<ActionResult<InventoryUploadPreflightResult>> PreflightInventory([FromBody] InventoryUploadRequest? request)
        {
            try
            {
                var result = await _uploadService.PreflightAsync(request);
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest($"Inventory preflight failed: {ex.Message}");
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest($"Inventory preflight failed: {ex.Message}");
            }
        }

        [HttpGet]
        public async Task<ActionResult<List<InventoryUploadBatchSummaryDto>>> GetUploadBatches([FromQuery] int take = 50)
        {
            var result = await _uploadService.GetRecentUploadBatchesAsync(take);
            return Ok(result);
        }

        [HttpPost]
        public async Task<ActionResult<InventoryUploadResult>> UndoUploadBatch([FromQuery] Guid uploadBatchId)
        {
            var result = await _uploadService.UndoUploadBatchAsync(uploadBatchId);
            return Ok(result);
        }
    }
}
