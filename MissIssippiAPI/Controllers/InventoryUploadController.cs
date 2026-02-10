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
            var result = await _uploadService.UploadAsync(request?.Rows, request?.Mode);
            return Ok(result);
        }
    }
}
