using Microsoft.AspNetCore.Mvc;
using MissIssippiAPI.Models;
using MissIssippiAPI.Services;

namespace MissIssippiAPI.Controllers
{
    [ApiController]
    [Route("api/skus")]
    public class SkusController : ControllerBase
    {
        private readonly SkuService _skuService;

        public SkusController(SkuService skuService)
        {
            _skuService = skuService;
        }

        [HttpGet]
        public async Task<ActionResult<SkuListResponse>> GetSkus(
            [FromQuery] string? q,
            [FromQuery] int? seasonId,
            [FromQuery] bool? inStock,
            [FromQuery] bool? inProduction,
            [FromQuery] int? page,
            [FromQuery] int? pageSize,
            [FromQuery] string? sortField,
            [FromQuery] string? sortOrder)
        {
            var query = new SkuListQuery
            {
                Query = q,
                SeasonId = seasonId,
                InStock = inStock,
                InProduction = inProduction,
                Page = page ?? 1,
                PageSize = pageSize ?? 25,
                SortField = sortField,
                SortOrder = sortOrder
            };

            var result = await _skuService.GetSkuListAsync(query);
            return Ok(result);
        }

        [HttpPost("labels")]
        public async Task<ActionResult<List<SkuLabelRowDto>>> GetSkuLabels([FromBody] SkuLabelRequest? request)
        {
            var itemColorIds = request?.ItemColorIds ?? new List<int>();
            if (itemColorIds.Count == 0)
            {
                return Ok(new List<SkuLabelRowDto>());
            }

            var result = await _skuService.GetSkuLabelRowsAsync(itemColorIds);
            return Ok(result);
        }

        [HttpPut("{skuId:int}")]
        public async Task<ActionResult<SkuUpdateResponse>> UpdateSku(int skuId, [FromBody] SkuUpdateRequest? request)
        {
            try
            {
                var result = await _skuService.UpdateSkuAsync(skuId, request?.Sku);
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(ex.Message);
            }
        }

        [HttpPost("bulk-update")]
        public async Task<ActionResult<SkuBulkUpdateResponse>> BulkUpdateSkus([FromBody] SkuBulkUpdateRequest? request)
        {
            var result = await _skuService.BulkUpdateSkusAsync(request?.Rows);
            return Ok(result);
        }
    }
}
