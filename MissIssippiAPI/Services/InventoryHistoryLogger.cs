using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using MissIssippiAPI.Data;
using MissIssippiAPI.Models;

namespace MissIssippiAPI.Services
{
    public class InventoryHistoryLogger
    {
        private readonly MissIssippiContext _context;

        private static readonly HashSet<string> AllowedSources = new(StringComparer.OrdinalIgnoreCase)
        {
            "scan",
            "edit",
            "upload"
        };

        public InventoryHistoryLogger(MissIssippiContext context)
        {
            _context = context;
        }

        public async Task<Guid?> LogAdjustmentsAsync(
            string source,
            IEnumerable<InventoryHistoryChange> changes,
            string? notes = null)
        {
            if (changes == null)
            {
                return null;
            }

            var normalizedSource = NormalizeSource(source);
            var changeList = changes
                .Where(c => c != null)
                .Select(c => new InventoryHistoryChange
                {
                    ItemColorId = c.ItemColorId,
                    SizeId = c.SizeId,
                    OldQty = c.OldQty,
                    NewQty = c.NewQty,
                    ActionType = string.IsNullOrWhiteSpace(c.ActionType) ? normalizedSource : c.ActionType
                })
                .Where(c => c.NewQty != c.OldQty)
                .ToList();

            if (changeList.Count == 0)
            {
                return null;
            }

            var hasTransaction = _context.Database.CurrentTransaction != null;
            await using var transaction = hasTransaction ? null : await _context.Database.BeginTransactionAsync();

            var batch = new InventoryAdjustmentBatch
            {
                BatchId = Guid.NewGuid(),
                Source = normalizedSource,
                Notes = notes
            };

            _context.InventoryAdjustmentBatches.Add(batch);

            foreach (var change in changeList)
            {
                var delta = change.NewQty - change.OldQty;
                if (delta == 0)
                {
                    continue;
                }

                _context.InventoryActivityLogs.Add(new InventoryActivityLog
                {
                    BatchId = batch.BatchId,
                    ItemColorId = change.ItemColorId,
                    SizeId = change.SizeId,
                    Qty = change.NewQty,
                    OldQty = change.OldQty,
                    NewQty = change.NewQty,
                    Delta = delta,
                    ActionType = change.ActionType ?? normalizedSource,
                    InventoryActivityDate = DateTime.UtcNow
                });
            }

            await _context.SaveChangesAsync();

            if (transaction != null)
            {
                await transaction.CommitAsync();
            }

            return batch.BatchId;
        }

        private static string NormalizeSource(string source)
        {
            if (string.IsNullOrWhiteSpace(source))
            {
                return "edit";
            }

            return AllowedSources.Contains(source) ? source.ToLowerInvariant() : "edit";
        }
    }

    public class InventoryHistoryChange
    {
        public int ItemColorId { get; set; }

        public int SizeId { get; set; }

        public int OldQty { get; set; }

        public int NewQty { get; set; }

        public string? ActionType { get; set; }
    }
}
