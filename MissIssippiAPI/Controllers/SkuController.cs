using Microsoft.AspNetCore.Mvc;
using MissIssippiAPI.Models;
using MissIssippiAPI.Services;

namespace MissIssippiAPI.Controllers
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    public class SkuController : ControllerBase
    {
        private readonly SkuService _skuService;

        public SkuController(SkuService skuService)
        {
            _skuService = skuService;
        }

        [HttpGet]
        public async Task<ActionResult<SkuLookupResult>> LookupSku(string sku)
        {
            if (string.IsNullOrWhiteSpace(sku))
            {
                return BadRequest("SKU is required.");
            }

            var result = await _skuService.LookupSkuAsync(sku);
            if (result == null)
            {
                return NotFound();
            }

            return Ok(result);
        }

        [HttpPost]
        public async Task<ActionResult<SkuAdjustmentsResult>> ApplySkuAdjustments(SkuAdjustmentsRequest? request)
        {
            if (request?.Adjustments == null || request.Adjustments.Count == 0)
            {
                return BadRequest("Adjustments are required.");
            }

            var result = await _skuService.ApplyAdjustmentsAsync(request.Adjustments, request.Notes);
            return Ok(result);
        }
    }
}
