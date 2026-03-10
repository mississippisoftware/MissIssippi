using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MissIssippiAPI.Data;
using MissIssippiAPI.Models;

namespace MissIssippiAPI.Controllers
{
    [ApiController]
    [Route("api/inventory-history")]
    public class InventoryHistoryController : ControllerBase
    {
        private readonly MissIssippiContext _context;

        private static readonly HashSet<string> AllowedSources = new(StringComparer.OrdinalIgnoreCase)
        {
            "scan",
            "edit",
            "upload"
        };

        public InventoryHistoryController(MissIssippiContext context)
        {
            _context = context;
        }

        [HttpGet("batches")]
        public async Task<ActionResult<IEnumerable<InventoryHistoryBatchDto>>> GetBatches(
            [FromQuery] string? batchId,
            [FromQuery] string? source,
            [FromQuery] DateTime? from,
            [FromQuery] DateTime? to,
            [FromQuery] int? take)
        {
            Guid? parsedBatchId = null;
            if (!string.IsNullOrWhiteSpace(batchId))
            {
                if (!Guid.TryParse(batchId, out var guid))
                {
                    return BadRequest("Invalid batchId.");
                }
                parsedBatchId = guid;
            }

            var normalizedSource = NormalizeSource(source);
            if (!string.IsNullOrWhiteSpace(source) && normalizedSource == null)
            {
                return BadRequest("Invalid source.");
            }

            var limit = take ?? 200;
            if (limit < 1)
            {
                limit = 1;
            }
            else if (limit > 1000)
            {
                limit = 1000;
            }

            var batchQuery = _context.InventoryAdjustmentBatches.AsNoTracking();

            if (parsedBatchId.HasValue)
            {
                batchQuery = batchQuery.Where(b => b.BatchId == parsedBatchId.Value);
            }

            if (!string.IsNullOrWhiteSpace(normalizedSource))
            {
                batchQuery = batchQuery.Where(b => b.Source == normalizedSource);
            }

            if (from.HasValue)
            {
                batchQuery = batchQuery.Where(b => b.BatchTimestamp >= from.Value);
            }

            if (to.HasValue)
            {
                batchQuery = batchQuery.Where(b => b.BatchTimestamp <= to.Value);
            }

            var data = await (
                from batch in batchQuery
                join log in _context.InventoryActivityLogs.AsNoTracking()
                    on batch.BatchId equals log.BatchId into logs
                orderby batch.BatchTimestamp descending
                select new InventoryHistoryBatchDto
                {
                    BatchId = batch.BatchId,
                    BatchTimestamp = batch.BatchTimestamp,
                    Source = batch.Source,
                    Notes = batch.Notes,
                    TotalLines = logs.Count(),
                    TotalDelta = logs.Sum(l => (int?)l.Delta) ?? 0
                })
                .Take(limit)
                .ToListAsync();

            return Ok(data);
        }

        [HttpGet("batches/{batchId}")]
        public async Task<ActionResult<InventoryHistoryBatchDetailsDto>> GetBatchDetails(string batchId)
        {
            if (!Guid.TryParse(batchId, out var parsedBatchId))
            {
                return BadRequest("Invalid batchId.");
            }

            var batch = await _context.InventoryAdjustmentBatches
                .AsNoTracking()
                .FirstOrDefaultAsync(b => b.BatchId == parsedBatchId);

            if (batch == null)
            {
                return NotFound();
            }

            var lines = await (
                from log in _context.InventoryActivityLogs.AsNoTracking()
                where log.BatchId == parsedBatchId
                join itemColor in _context.ItemColors.AsNoTracking()
                    on log.ItemColorId equals itemColor.ItemColorId
                join item in _context.Items.AsNoTracking()
                    on itemColor.ItemId equals item.ItemId
                join season in _context.Seasons.AsNoTracking()
                    on item.SeasonId equals season.SeasonId
                join color in _context.Colors.AsNoTracking()
                    on itemColor.ColorId equals color.ColorId
                join size in _context.Sizes.AsNoTracking()
                    on log.SizeId equals size.SizeId
                join sku in _context.Skus.AsNoTracking()
                    on new { log.ItemColorId, log.SizeId } equals new { sku.ItemColorId, sku.SizeId } into skuGroup
                from sku in skuGroup.DefaultIfEmpty()
                orderby item.ItemNumber, color.ColorName, size.SizeName
                select new InventoryHistoryLineDto
                {
                    Sku = sku != null ? sku.SkuValue : null,
                    ItemNumber = item.ItemNumber,
                    SeasonName = season.SeasonName,
                    ColorName = color.ColorName,
                    SizeName = size.SizeName,
                    OldQty = log.OldQty,
                    NewQty = log.NewQty,
                    Delta = log.Delta
                })
                .ToListAsync();

            var response = new InventoryHistoryBatchDetailsDto
            {
                BatchId = batch.BatchId,
                BatchTimestamp = batch.BatchTimestamp,
                Source = batch.Source,
                Notes = batch.Notes,
                TotalLines = lines.Count,
                TotalDelta = lines.Sum(line => line.Delta),
                Lines = lines
            };

            return Ok(response);
        }

        private static string? NormalizeSource(string? source)
        {
            if (string.IsNullOrWhiteSpace(source))
            {
                return null;
            }

            return AllowedSources.Contains(source) ? source.ToLowerInvariant() : null;
        }
    }
}
