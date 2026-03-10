using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using MissIssippiAPI.Data;
using MissIssippiAPI.Models;

namespace MissIssippiAPI.Services
{
    public class InventoryUploadService
    {
        private readonly MissIssippiContext _context;
        private readonly SkuService _skuService;
        private readonly InventoryHistoryLogger _historyLogger;

        private enum UploadMode
        {
            Replace,
            Add,
            Subtract
        }

        private enum MissingSizeBehavior
        {
            Zero,
            Ignore
        }

        private const string StatusApplied = "applied";
        private const string StatusFailed = "failed";
        private const string StatusDuplicateBlocked = "duplicate_blocked";
        private const string StatusUndone = "undone";
        private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
        private static readonly Dictionary<string, string> ColorTokenAliases = new(StringComparer.OrdinalIgnoreCase)
        {
            ["lt"] = "light",
            ["lgt"] = "light",
            ["dk"] = "dark",
            ["drk"] = "dark",
            ["md"] = "medium",
            ["med"] = "medium",
            ["blk"] = "black",
            ["wht"] = "white",
            ["blu"] = "blue",
            ["pnk"] = "pink",
            ["gry"] = "gray",
            ["grn"] = "green",
        };

        public InventoryUploadService(
            MissIssippiContext context,
            SkuService skuService,
            InventoryHistoryLogger historyLogger)
        {
            _context = context;
            _skuService = skuService;
            _historyLogger = historyLogger;
        }

        public async Task<InventoryUploadPreflightResult> PreflightAsync(InventoryUploadRequest? request)
        {
            var normalized = NormalizeRequest(request, null);
            var validation = await ValidateRowsAsync(normalized);
            var duplicate = await FindDuplicateAppliedBatchAsync(validation.DatasetHash, normalized.ModeText);
            return BuildPreflightResult(normalized, validation, duplicate);
        }

        public async Task<InventoryUploadResult> UploadAsync(InventoryUploadRequest? request, string? headerIdempotencyKey)
        {
            var normalized = NormalizeRequest(request, headerIdempotencyKey);

            if (!string.IsNullOrWhiteSpace(normalized.IdempotencyKey))
            {
                var replay = await GetIdempotentReplayAsync(normalized.IdempotencyKey!);
                if (replay != null)
                {
                    replay.Message = string.IsNullOrWhiteSpace(replay.Message)
                        ? "Idempotent replay: this upload was already processed."
                        : replay.Message;
                    return replay;
                }
            }

            var validation = await ValidateRowsAsync(normalized);
            var duplicate = await FindDuplicateAppliedBatchAsync(validation.DatasetHash, normalized.ModeText);
            var result = BuildUploadResultFromValidation(normalized, validation);

            if (duplicate != null)
            {
                result.DuplicateDatasetDetected = true;
                var duplicateMessage = $"A matching dataset was already applied in batch {duplicate.UploadBatchId}.";

                if (normalized.Mode != UploadMode.Replace && !normalized.AllowDuplicateDataset)
                {
                    result.Success = false;
                    result.Message = $"{duplicateMessage} Upload blocked to prevent duplicate adjustments.";
                    result.Errors.Add(new InventoryUploadError
                    {
                        RowNumber = 0,
                        Message = result.Message
                    });
                    result.UploadBatchId = (await RecordUploadBatchAsync(
                        normalized,
                        validation.DatasetHash,
                        result,
                        StatusDuplicateBlocked,
                        duplicate.UploadBatchId,
                        null))?.UploadBatchId;
                    return result;
                }

                result.Warnings.Add(new InventoryUploadWarning
                {
                    RowNumber = 0,
                    Message = $"{duplicateMessage} Proceeding because this mode allows it."
                });
            }

            if (result.Errors.Count > 0 && !normalized.AllowPartial)
            {
                result.Success = false;
                result.Message = "Upload blocked by validation errors. Run preflight and fix errors.";
                result.UploadBatchId = (await RecordUploadBatchAsync(
                    normalized,
                    validation.DatasetHash,
                    result,
                    StatusFailed,
                    duplicate?.UploadBatchId,
                    null))?.UploadBatchId;
                return result;
            }

            var rowsToApply = normalized.AllowPartial
                ? validation.ValidRows
                : (result.Errors.Count == 0 ? validation.ValidRows : new List<ValidatedUploadRow>());

            if (rowsToApply.Count == 0)
            {
                result.Success = false;
                result.Message = "No valid rows available to upload.";
                result.UploadBatchId = (await RecordUploadBatchAsync(
                    normalized,
                    validation.DatasetHash,
                    result,
                    StatusFailed,
                    duplicate?.UploadBatchId,
                    null))?.UploadBatchId;
                return result;
            }

            await using var transaction = await _context.Database.BeginTransactionAsync();
            var changes = new List<InventoryHistoryChange>();
            try
            {
                foreach (var row in rowsToApply)
                {
                    var itemColor = row.ItemColorId > 0
                        ? await _context.ItemColors.FirstOrDefaultAsync(sc => sc.ItemColorId == row.ItemColorId)
                        : null;

                    if (itemColor == null)
                    {
                        itemColor = await _context.ItemColors.FirstOrDefaultAsync(sc =>
                            sc.ItemId == row.ItemId &&
                            sc.ColorId == row.ColorId &&
                            (sc.CompositeSignature ?? string.Empty) == (row.CompositeSignature ?? string.Empty));
                    }

                    if (itemColor == null)
                    {
                        itemColor = new ItemColor
                        {
                            ItemId = row.ItemId,
                            ColorId = row.ColorId,
                            Active = true,
                            CompositeSignature = row.CompositeSignature ?? string.Empty
                        };
                        _context.ItemColors.Add(itemColor);
                        await _context.SaveChangesAsync();

                        if (row.SecondaryColorIds.Count > 0)
                        {
                            for (var i = 0; i < row.SecondaryColorIds.Count; i += 1)
                            {
                                _context.ItemColorSecondaryColors.Add(new ItemColorSecondaryColor
                                {
                                    ItemColorId = itemColor.ItemColorId,
                                    SecondaryColorId = row.SecondaryColorIds[i],
                                    SortOrder = i + 1
                                });
                            }

                            await _context.SaveChangesAsync();
                        }

                        result.CreatedItemColors += 1;
                    }
                    else if (!itemColor.Active)
                    {
                        itemColor.Active = true;
                    }

                    var normalizedRowSignature = row.CompositeSignature ?? string.Empty;
                    if ((itemColor.CompositeSignature ?? string.Empty) != normalizedRowSignature)
                    {
                        itemColor.CompositeSignature = normalizedRowSignature;
                    }

                    var item = await _context.Items
                        .AsNoTracking()
                        .FirstOrDefaultAsync(x => x.ItemId == row.ItemId);
                    if (item?.InProduction == true)
                    {
                        result.CreatedSkus += await _skuService.EnsureSkusForItemColorAsync(itemColor.ItemColorId);
                    }

                    foreach (var entry in row.SizeQuantities)
                    {
                        var sizeId = entry.Key;
                        var qty = entry.Value;

                        var inventory = await _context.Inventories
                            .FirstOrDefaultAsync(i => i.ItemColorId == itemColor.ItemColorId && i.SizeId == sizeId);

                        if (inventory == null)
                        {
                            var oldQty = 0;
                            var newQty = ApplyMode(qty, oldQty, normalized.Mode);
                            _context.Inventories.Add(new Inventory
                            {
                                ItemColorId = itemColor.ItemColorId,
                                SizeId = sizeId,
                                Qty = newQty
                            });
                            result.CreatedInventory += 1;

                            if (newQty != oldQty)
                            {
                                changes.Add(new InventoryHistoryChange
                                {
                                    ItemColorId = itemColor.ItemColorId,
                                    SizeId = sizeId,
                                    OldQty = oldQty,
                                    NewQty = newQty
                                });
                            }
                        }
                        else
                        {
                            var oldQty = inventory.Qty;
                            var newQty = ApplyMode(qty, inventory.Qty, normalized.Mode);
                            inventory.Qty = newQty;
                            result.UpdatedInventory += 1;
                            if (newQty != oldQty)
                            {
                                changes.Add(new InventoryHistoryChange
                                {
                                    ItemColorId = itemColor.ItemColorId,
                                    SizeId = sizeId,
                                    OldQty = oldQty,
                                    NewQty = newQty
                                });
                            }
                        }
                    }
                }

                await _context.SaveChangesAsync();
                Guid? historyBatchId = null;
                if (changes.Count > 0)
                {
                    historyBatchId = await _historyLogger.LogAdjustmentsAsync("upload", changes, normalized.UserNote);
                }

                await transaction.CommitAsync();

                result.ProcessedRows = rowsToApply.Count;
                result.PartialApplied = normalized.AllowPartial && result.Errors.Count > 0;
                result.Success = true;
                result.Message = result.PartialApplied
                    ? "Upload applied for valid rows only. Some rows were skipped."
                    : "Upload applied successfully.";
                result.InventoryHistoryBatchId = historyBatchId;

                result.UploadBatchId = (await RecordUploadBatchAsync(
                    normalized,
                    validation.DatasetHash,
                    result,
                    StatusApplied,
                    duplicate?.UploadBatchId,
                    historyBatchId))?.UploadBatchId;

                return result;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                result.Success = false;
                result.Message = $"Upload failed: {GetInnermostExceptionMessage(ex)}";
                result.Errors.Add(new InventoryUploadError
                {
                    RowNumber = 0,
                    Message = result.Message
                });
                result.UploadBatchId = (await RecordUploadBatchAsync(
                    normalized,
                    validation.DatasetHash,
                    result,
                    StatusFailed,
                    duplicate?.UploadBatchId,
                    null))?.UploadBatchId;
                return result;
            }
        }

        public async Task<List<InventoryUploadBatchSummaryDto>> GetRecentUploadBatchesAsync(int take)
        {
            take = Math.Clamp(take, 1, 250);
            try
            {
                return await _context.InventoryUploadBatches
                    .AsNoTracking()
                    .OrderByDescending(x => x.CreatedAt)
                    .Take(take)
                    .Select(x => new InventoryUploadBatchSummaryDto
                    {
                        UploadBatchId = x.UploadBatchId,
                        CreatedAt = x.CreatedAt,
                        Status = x.Status,
                        Mode = x.Mode,
                        DatasetHash = x.DatasetHash,
                        RowCount = x.RowCount,
                        ProcessedRows = x.ProcessedRows,
                        ErrorCount = x.ErrorCount,
                        WarningCount = x.WarningCount,
                        IsUndone = x.IsUndone,
                        InventoryHistoryBatchId = x.InventoryHistoryBatchId,
                        UndoHistoryBatchId = x.UndoHistoryBatchId,
                        Message = x.Message
                    })
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Inventory upload batch history unavailable: {ex.Message}");
                return new List<InventoryUploadBatchSummaryDto>();
            }
        }

        public async Task<InventoryUploadResult> UndoUploadBatchAsync(Guid uploadBatchId)
        {
            var result = new InventoryUploadResult
            {
                UploadBatchId = uploadBatchId
            };

            InventoryUploadBatch? uploadBatch;
            try
            {
                uploadBatch = await _context.InventoryUploadBatches
                    .FirstOrDefaultAsync(x => x.UploadBatchId == uploadBatchId);
            }
            catch (Exception ex)
            {
                result.Success = false;
                result.Message = $"Undo is unavailable until DB migration is applied: {ex.Message}";
                result.Errors.Add(new InventoryUploadError
                {
                    RowNumber = 0,
                    Message = result.Message
                });
                return result;
            }

            if (uploadBatch == null)
            {
                result.Success = false;
                result.Message = "Upload batch not found.";
                result.Errors.Add(new InventoryUploadError
                {
                    RowNumber = 0,
                    Message = result.Message
                });
                return result;
            }

            if (uploadBatch.IsUndone)
            {
                result.Success = false;
                result.Message = "Upload batch is already undone.";
                result.Errors.Add(new InventoryUploadError
                {
                    RowNumber = 0,
                    Message = result.Message
                });
                return result;
            }

            if (!uploadBatch.InventoryHistoryBatchId.HasValue)
            {
                result.Success = false;
                result.Message = "Upload batch has no history batch to undo.";
                result.Errors.Add(new InventoryUploadError
                {
                    RowNumber = 0,
                    Message = result.Message
                });
                return result;
            }

            var logRows = await _context.InventoryActivityLogs
                .AsNoTracking()
                .Where(x => x.BatchId == uploadBatch.InventoryHistoryBatchId.Value)
                .ToListAsync();

            if (logRows.Count == 0)
            {
                result.Success = false;
                result.Message = "No inventory history lines were found for this upload batch.";
                result.Errors.Add(new InventoryUploadError
                {
                    RowNumber = 0,
                    Message = result.Message
                });
                return result;
            }

            await using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var changes = new List<InventoryHistoryChange>();

                foreach (var log in logRows)
                {
                    var inventory = await _context.Inventories
                        .FirstOrDefaultAsync(i => i.ItemColorId == log.ItemColorId && i.SizeId == log.SizeId);

                    if (inventory == null)
                    {
                        _context.Inventories.Add(new Inventory
                        {
                            ItemColorId = log.ItemColorId,
                            SizeId = log.SizeId,
                            Qty = log.OldQty
                        });

                        if (log.OldQty != 0)
                        {
                            changes.Add(new InventoryHistoryChange
                            {
                                ItemColorId = log.ItemColorId,
                                SizeId = log.SizeId,
                                OldQty = 0,
                                NewQty = log.OldQty,
                                ActionType = "upload-undo"
                            });
                        }

                        result.CreatedInventory += 1;
                    }
                    else
                    {
                        var priorQty = inventory.Qty;
                        inventory.Qty = log.OldQty;
                        if (priorQty != log.OldQty)
                        {
                            changes.Add(new InventoryHistoryChange
                            {
                                ItemColorId = log.ItemColorId,
                                SizeId = log.SizeId,
                                OldQty = priorQty,
                                NewQty = log.OldQty,
                                ActionType = "upload-undo"
                            });
                        }
                        result.UpdatedInventory += 1;
                    }
                }

                await _context.SaveChangesAsync();

                Guid? undoHistoryBatchId = null;
                if (changes.Count > 0)
                {
                    undoHistoryBatchId = await _historyLogger.LogAdjustmentsAsync(
                        "upload",
                        changes,
                        $"undo upload batch {uploadBatchId}");
                }

                uploadBatch.IsUndone = true;
                uploadBatch.UndoneAt = DateTime.UtcNow;
                uploadBatch.UndoHistoryBatchId = undoHistoryBatchId;
                uploadBatch.Status = StatusUndone;
                uploadBatch.Message = $"Undone at {uploadBatch.UndoneAt:O}";
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                result.Success = true;
                result.Undone = true;
                result.Message = "Upload batch has been undone.";
                result.InventoryHistoryBatchId = undoHistoryBatchId;
                result.ProcessedRows = logRows.Count;
                return result;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                result.Success = false;
                result.Message = $"Undo failed: {ex.Message}";
                result.Errors.Add(new InventoryUploadError
                {
                    RowNumber = 0,
                    Message = result.Message
                });
                return result;
            }
        }

        private static NormalizedUploadRequest NormalizeRequest(InventoryUploadRequest? request, string? headerIdempotencyKey)
        {
            var mode = ResolveMode(request?.Mode);
            var modeText = ModeToText(mode);
            var missingBehavior = ResolveMissingSizeBehavior(request?.MissingSizeBehavior);
            var idempotencyKey = NormalizeIdempotencyKey(request?.IdempotencyKey) ?? NormalizeIdempotencyKey(headerIdempotencyKey);

            return new NormalizedUploadRequest
            {
                Rows = request?.Rows ?? new List<InventoryUploadRow>(),
                Mode = mode,
                ModeText = modeText,
                AllowPartial = request?.AllowPartial ?? false,
                AllowDuplicateDataset = request?.AllowDuplicateDataset ?? false,
                MissingSizeBehavior = missingBehavior,
                IdempotencyKey = idempotencyKey,
                UserNote = string.IsNullOrWhiteSpace(request?.UserNote) ? null : request!.UserNote!.Trim()
            };
        }

        private async Task<ValidationOutcome> ValidateRowsAsync(NormalizedUploadRequest request)
        {
            var outcome = new ValidationOutcome();

            if (request.Rows.Count == 0)
            {
                outcome.Issues.Add(new InventoryUploadIssue
                {
                    RowNumber = 0,
                    Severity = "error",
                    Code = "no_rows",
                    Field = "rows",
                    Message = "No rows provided."
                });
                return outcome;
            }

            var seasons = await _context.Seasons.AsNoTracking().ToListAsync();
            var items = await _context.Items.AsNoTracking().ToListAsync();
            var colors = await _context.Colors.AsNoTracking().ToListAsync();
            var sizes = await _context.Sizes.AsNoTracking().ToListAsync();
            var itemColorLinks = await _context.ItemColors
                .AsNoTracking()
                .Select(ic => new ItemColorLinkLookup
                {
                    ItemColorId = ic.ItemColorId,
                    ItemId = ic.ItemId,
                    ColorId = ic.ColorId,
                    CompositeSignature = ic.CompositeSignature ?? string.Empty
                })
                .ToListAsync();
            var itemColorSecondaryLinks = await _context.ItemColorSecondaryColors
                .AsNoTracking()
                .Select(isc => new { isc.ItemColorId, isc.SecondaryColorId })
                .ToListAsync();

            var seasonMap = seasons.ToDictionary(s => NormalizeKey(s.SeasonName), s => s, StringComparer.OrdinalIgnoreCase);
            var colorById = colors.ToDictionary(c => c.ColorId);
            var colorsByName = colors
                .GroupBy(c => NormalizeColorMatchKey(c.ColorName), StringComparer.OrdinalIgnoreCase)
                .ToDictionary(g => g.Key, g => g.ToList(), StringComparer.OrdinalIgnoreCase);
            var secondaryIdsByItemColorId = itemColorSecondaryLinks
                .GroupBy(x => x.ItemColorId)
                .ToDictionary(
                    g => g.Key,
                    g => g.Select(x => x.SecondaryColorId).Distinct().ToList());
            var itemColorByVariantKey = itemColorLinks
                .GroupBy(link =>
                    BuildItemColorVariantKey(
                        link.ItemId,
                        link.ColorId,
                        GetEffectiveCompositeSignature(
                            link.CompositeSignature,
                            secondaryIdsByItemColorId.TryGetValue(link.ItemColorId, out var secondaryIds)
                                ? secondaryIds
                                : Array.Empty<int>())),
                    StringComparer.OrdinalIgnoreCase)
                .ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);
            var linkedColorIdsByItem = new Dictionary<int, List<int>>();
            foreach (var itemGroup in itemColorLinks.GroupBy(x => x.ItemId))
            {
                var linkedColorIds = new HashSet<int>();
                foreach (var link in itemGroup)
                {
                    linkedColorIds.Add(link.ColorId);
                    if (secondaryIdsByItemColorId.TryGetValue(link.ItemColorId, out var secondaryIds))
                    {
                        foreach (var secondaryId in secondaryIds)
                        {
                            linkedColorIds.Add(secondaryId);
                        }
                    }
                }

                linkedColorIdsByItem[itemGroup.Key] = linkedColorIds.ToList();
            }
            var sizeMap = sizes.ToDictionary(s => NormalizeKey(s.SizeName), s => s, StringComparer.OrdinalIgnoreCase);
            var itemMap = items.ToDictionary(
                s => BuildItemKey(s.SeasonId, s.ItemNumber),
                s => s,
                StringComparer.OrdinalIgnoreCase);

            var mergedRows = new Dictionary<string, ValidatedUploadRow>(StringComparer.OrdinalIgnoreCase);
            var invalidRowNumbers = new HashSet<int>();

            bool TryResolveColorComponent(string componentName, Item item, Season season, int rowNumber, out Color? resolvedColor)
            {
                resolvedColor = null;
                var lookupKey = NormalizeColorMatchKey(componentName);
                if (string.IsNullOrWhiteSpace(lookupKey))
                {
                    AddIssue(outcome.Issues, invalidRowNumbers, rowNumber, "error", "color_required", "colorName", "Color is required.");
                    return false;
                }

                if (!colorsByName.TryGetValue(lookupKey, out var colorCandidates) || colorCandidates.Count == 0)
                {
                    AddIssue(
                        outcome.Issues,
                        invalidRowNumbers,
                        rowNumber,
                        "error",
                        "color_not_found",
                        "colorName",
                        $"Color '{componentName}' not found.",
                        GetSuggestions(componentName, colors.Select(x => x.ColorName)));
                    return false;
                }

                var itemScopedColorCandidates = linkedColorIdsByItem.TryGetValue(item.ItemId, out var linkedColorIds)
                    ? linkedColorIds
                        .Select(colorId => colorById.TryGetValue(colorId, out var linkedColor) ? linkedColor : null)
                        .Where(c => c != null && NormalizeColorMatchKey(c.ColorName) == lookupKey)
                        .Cast<Color>()
                        .ToList()
                    : new List<Color>();

                var matchingSeasonColors = colorCandidates
                    .Where(c => c.SeasonId == season.SeasonId)
                    .ToList();

                var noSeasonColors = colorCandidates
                    .Where(c => c.SeasonId == null)
                    .ToList();

                if (itemScopedColorCandidates.Count == 1)
                {
                    resolvedColor = itemScopedColorCandidates[0];
                    return true;
                }

                if (itemScopedColorCandidates.Count > 1)
                {
                    AddIssue(
                        outcome.Issues,
                        invalidRowNumbers,
                        rowNumber,
                        "error",
                        "color_ambiguous_for_item",
                        "colorName",
                        $"Color '{componentName}' is ambiguous for style '{item.ItemNumber}' (multiple matching colors are linked to that item).");
                    return false;
                }

                if (matchingSeasonColors.Count == 1)
                {
                    resolvedColor = matchingSeasonColors[0];
                    return true;
                }

                if (matchingSeasonColors.Count > 1)
                {
                    var collectionLabels = matchingSeasonColors
                        .Select(c => string.IsNullOrWhiteSpace(c.CollectionId?.ToString()) ? null : c.CollectionId!.Value.ToString())
                        .Where(x => !string.IsNullOrWhiteSpace(x))
                        .Distinct(StringComparer.OrdinalIgnoreCase)
                        .ToList();

                    var detail = collectionLabels.Count > 0
                        ? $" Multiple matches exist for season '{season.SeasonName}' (collection ids: {string.Join(", ", collectionLabels)})."
                        : $" Multiple matches exist for season '{season.SeasonName}'.";

                    AddIssue(
                        outcome.Issues,
                        invalidRowNumbers,
                        rowNumber,
                        "error",
                        "color_ambiguous",
                        "colorName",
                        $"Color '{componentName}' is ambiguous for style '{item.ItemNumber}'.{detail} The style does not have a unique matching color link.");
                    return false;
                }

                if (noSeasonColors.Count == 1)
                {
                    resolvedColor = noSeasonColors[0];
                    return true;
                }

                if (noSeasonColors.Count > 1)
                {
                    AddIssue(
                        outcome.Issues,
                        invalidRowNumbers,
                        rowNumber,
                        "error",
                        "color_ambiguous",
                        "colorName",
                        $"Color '{componentName}' is ambiguous (multiple no-season color records exist).");
                    return false;
                }

                var seasonSpecificSuggestions = colorCandidates
                    .Select(c => c.SeasonId.HasValue
                        ? $"{c.ColorName} (SeasonId {c.SeasonId.Value})"
                        : $"{c.ColorName} (No season)")
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .Take(5)
                    .ToList();

                AddIssue(
                    outcome.Issues,
                    invalidRowNumbers,
                    rowNumber,
                    "error",
                    "color_not_found_for_season",
                    "colorName",
                    $"Color '{componentName}' exists, but not for season '{season.SeasonName}'.",
                    seasonSpecificSuggestions);
                return false;
            }

            for (var index = 0; index < request.Rows.Count; index++)
            {
                var row = request.Rows[index];
                if (row == null)
                {
                    continue;
                }

                var rowNumber = row.RowNumber > 0 ? row.RowNumber : index + 2;
                var seasonName = NormalizeKey(row.SeasonName);
                var itemNumber = NormalizeKey(row.ItemNumber);
                var colorName = NormalizeKey(row.ColorName);

                if (string.IsNullOrWhiteSpace(seasonName))
                {
                    AddIssue(outcome.Issues, invalidRowNumbers, rowNumber, "error", "season_required", "seasonName", "Season is required.");
                }

                if (string.IsNullOrWhiteSpace(itemNumber))
                {
                    AddIssue(outcome.Issues, invalidRowNumbers, rowNumber, "error", "item_required", "itemNumber", "Item is required.");
                }

                if (string.IsNullOrWhiteSpace(colorName))
                {
                    AddIssue(outcome.Issues, invalidRowNumbers, rowNumber, "error", "color_required", "colorName", "Color is required.");
                }

                if (row.Sizes == null || row.Sizes.Count == 0)
                {
                    AddIssue(outcome.Issues, invalidRowNumbers, rowNumber, "error", "sizes_required", "sizes", "No size columns provided.");
                }

                if (invalidRowNumbers.Contains(rowNumber))
                {
                    continue;
                }

                if (!seasonMap.TryGetValue(seasonName, out var season))
                {
                    var seasonSuggestions = GetSuggestions(row.SeasonName, seasons.Select(x => x.SeasonName));
                    AddIssue(
                        outcome.Issues,
                        invalidRowNumbers,
                        rowNumber,
                        "error",
                        "season_not_found",
                        "seasonName",
                        $"Season '{row.SeasonName}' not found.",
                        seasonSuggestions);
                    continue;
                }

                var itemKey = BuildItemKey(season.SeasonId, itemNumber);
                if (!itemMap.TryGetValue(itemKey, out var item))
                {
                    var candidateItems = items
                        .Where(x => x.SeasonId == season.SeasonId)
                        .Select(x => x.ItemNumber);
                    var itemSuggestions = GetSuggestions(row.ItemNumber, candidateItems);
                    AddIssue(
                        outcome.Issues,
                        invalidRowNumbers,
                        rowNumber,
                        "error",
                        "item_not_found",
                        "itemNumber",
                        $"Item '{row.ItemNumber}' not found for season '{season.SeasonName}'.",
                        itemSuggestions);
                    continue;
                }

                var colorParts = SplitCompositeColorName(row.ColorName);
                if (colorParts.Count == 0)
                {
                    AddIssue(outcome.Issues, invalidRowNumbers, rowNumber, "error", "color_required", "colorName", "Color is required.");
                    continue;
                }

                if (!TryResolveColorComponent(colorParts[0], item, season, rowNumber, out var primaryColor) || primaryColor == null)
                {
                    continue;
                }

                var resolvedSecondaryIds = new List<int>();
                var secondarySeen = new HashSet<int>();
                var failedSecondary = false;
                foreach (var secondaryPart in colorParts.Skip(1))
                {
                    if (!TryResolveColorComponent(secondaryPart, item, season, rowNumber, out var secondaryColor) || secondaryColor == null)
                    {
                        failedSecondary = true;
                        continue;
                    }

                    if (secondaryColor.ColorId == primaryColor.ColorId || !secondarySeen.Add(secondaryColor.ColorId))
                    {
                        continue;
                    }

                    resolvedSecondaryIds.Add(secondaryColor.ColorId);
                }

                if (failedSecondary || invalidRowNumbers.Contains(rowNumber))
                {
                    continue;
                }

                var normalizedSecondaryIds = NormalizeSecondaryIds(resolvedSecondaryIds, primaryColor.ColorId);
                var compositeSignature = BuildCompositeSignature(normalizedSecondaryIds);
                var variantKey = BuildItemColorVariantKey(item.ItemId, primaryColor.ColorId, compositeSignature);
                itemColorByVariantKey.TryGetValue(variantKey, out var existingItemColorVariant);

                var sizeQuantities = new Dictionary<int, int>();
                foreach (var entry in row.Sizes)
                {
                    var sizeKey = NormalizeKey(entry.Key);
                    if (!sizeMap.TryGetValue(sizeKey, out var size))
                    {
                        AddIssue(
                            outcome.Issues,
                            invalidRowNumbers,
                            rowNumber,
                            "error",
                            "size_not_found",
                            "sizes",
                            $"Size '{entry.Key}' is not recognized.",
                            GetSuggestions(entry.Key, sizes.Select(x => x.SizeName)));
                        continue;
                    }

                    if (!entry.Value.HasValue)
                    {
                        if (request.MissingSizeBehavior == MissingSizeBehavior.Ignore)
                        {
                            continue;
                        }
                        sizeQuantities[size.SizeId] = 0;
                        continue;
                    }

                    var qty = entry.Value.Value;
                    if (qty < 0)
                    {
                        AddIssue(
                            outcome.Issues,
                            invalidRowNumbers,
                            rowNumber,
                            "error",
                            "negative_qty",
                            "sizes",
                            $"Quantity for size '{size.SizeName}' cannot be negative.");
                        continue;
                    }

                    sizeQuantities[size.SizeId] = qty;
                }

                if (invalidRowNumbers.Contains(rowNumber))
                {
                    continue;
                }

                if (sizeQuantities.Count == 0)
                {
                    AddIssue(
                        outcome.Issues,
                        invalidRowNumbers,
                        rowNumber,
                        "error",
                        "no_size_values",
                        "sizes",
                        "No size values will be applied after missing-size behavior is considered.");
                    continue;
                }

                var mergeKey = $"{season.SeasonId}|{item.ItemId}|{primaryColor.ColorId}|{compositeSignature}";
                if (mergedRows.TryGetValue(mergeKey, out var existing))
                {
                    foreach (var entry in sizeQuantities)
                    {
                        var prior = existing.SizeQuantities.TryGetValue(entry.Key, out var current)
                            ? current
                            : 0;
                        existing.SizeQuantities[entry.Key] = prior + entry.Value;
                    }

                    outcome.Issues.Add(new InventoryUploadIssue
                    {
                        RowNumber = rowNumber,
                        Severity = "warning",
                        Code = "duplicate_merged",
                        Field = "row",
                        Message = $"Duplicate season/item/color row merged with row {existing.RowNumber}."
                    });
                }
                else
                {
                    mergedRows[mergeKey] = new ValidatedUploadRow
                    {
                        RowNumber = rowNumber,
                        SeasonId = season.SeasonId,
                        ItemId = item.ItemId,
                        ItemColorId = existingItemColorVariant?.ItemColorId ?? 0,
                        ColorId = primaryColor.ColorId,
                        CompositeSignature = compositeSignature,
                        SecondaryColorIds = normalizedSecondaryIds,
                        SizeQuantities = sizeQuantities
                    };
                }
            }

            outcome.ValidRows = mergedRows.Values.OrderBy(x => x.RowNumber).ToList();
            outcome.InvalidRows = invalidRowNumbers.Count;
            outcome.DatasetHash = BuildDatasetHash(request.ModeText, outcome.ValidRows);
            return outcome;
        }

        private InventoryUploadPreflightResult BuildPreflightResult(
            NormalizedUploadRequest request,
            ValidationOutcome validation,
            InventoryUploadBatch? duplicateBatch)
        {
            var result = new InventoryUploadPreflightResult
            {
                DatasetHash = validation.DatasetHash,
                TotalRows = request.Rows.Count,
                ValidRows = validation.ValidRows.Count,
                InvalidRows = validation.InvalidRows,
                Issues = validation.Issues,
                WarningCount = validation.Issues.Count(x => IsWarning(x)),
                ErrorCount = validation.Issues.Count(x => IsError(x)),
                DuplicateDatasetDetected = duplicateBatch != null,
                DuplicateUploadBatchId = duplicateBatch?.UploadBatchId
            };

            if (duplicateBatch != null)
            {
                if (request.Mode == UploadMode.Replace || request.AllowDuplicateDataset)
                {
                    result.Issues.Add(new InventoryUploadIssue
                    {
                        RowNumber = 0,
                        Severity = "warning",
                        Code = "duplicate_dataset",
                        Field = "dataset",
                        Message = $"Matching dataset hash already applied in batch {duplicateBatch.UploadBatchId}."
                    });
                }
                else
                {
                    result.Issues.Add(new InventoryUploadIssue
                    {
                        RowNumber = 0,
                        Severity = "error",
                        Code = "duplicate_dataset_blocked",
                        Field = "dataset",
                        Message = $"Matching dataset hash already applied in batch {duplicateBatch.UploadBatchId}. Upload will be blocked unless override is enabled."
                    });
                }
            }

            result.WarningCount = result.Issues.Count(x => IsWarning(x));
            result.ErrorCount = result.Issues.Count(x => IsError(x));
            result.CanUpload = result.ErrorCount == 0 || (request.AllowPartial && result.ValidRows > 0);
            return result;
        }

        private InventoryUploadResult BuildUploadResultFromValidation(
            NormalizedUploadRequest request,
            ValidationOutcome validation)
        {
            var result = new InventoryUploadResult
            {
                Success = false,
                DatasetHash = validation.DatasetHash
            };

            foreach (var issue in validation.Issues)
            {
                if (IsError(issue))
                {
                    result.Errors.Add(new InventoryUploadError
                    {
                        RowNumber = issue.RowNumber,
                        Message = issue.Message
                    });
                }
                else if (IsWarning(issue))
                {
                    result.Warnings.Add(new InventoryUploadWarning
                    {
                        RowNumber = issue.RowNumber,
                        Message = issue.Message
                    });
                }
            }

            if (request.AllowPartial && result.Errors.Count > 0)
            {
                result.Warnings.Add(new InventoryUploadWarning
                {
                    RowNumber = 0,
                    Message = "Partial mode is enabled. Valid rows can still be applied."
                });
            }

            return result;
        }

        private async Task<InventoryUploadBatch?> FindDuplicateAppliedBatchAsync(string? datasetHash, string modeText)
        {
            if (string.IsNullOrWhiteSpace(datasetHash))
            {
                return null;
            }

            try
            {
                return await _context.InventoryUploadBatches
                    .AsNoTracking()
                    .Where(x =>
                        x.DatasetHash == datasetHash &&
                        x.Mode == modeText &&
                        x.Status == StatusApplied &&
                        !x.IsUndone)
                    .OrderByDescending(x => x.CreatedAt)
                    .FirstOrDefaultAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Duplicate upload detection unavailable: {ex.Message}");
                return null;
            }
        }

        private async Task<InventoryUploadResult?> GetIdempotentReplayAsync(string idempotencyKey)
        {
            try
            {
                var existing = await _context.InventoryUploadBatches
                    .AsNoTracking()
                    .FirstOrDefaultAsync(x => x.IdempotencyKey == idempotencyKey);

                if (existing == null)
                {
                    return null;
                }

                if (!string.IsNullOrWhiteSpace(existing.ResultJson))
                {
                    var deserialized = JsonSerializer.Deserialize<InventoryUploadResult>(existing.ResultJson, JsonOptions);
                    if (deserialized != null)
                    {
                        if (!deserialized.UploadBatchId.HasValue)
                        {
                            deserialized.UploadBatchId = existing.UploadBatchId;
                        }
                        return deserialized;
                    }
                }

                return new InventoryUploadResult
                {
                    UploadBatchId = existing.UploadBatchId,
                    Success = existing.Status == StatusApplied || existing.Status == StatusUndone,
                    ProcessedRows = existing.ProcessedRows,
                    CreatedSkus = existing.CreatedSkus,
                    CreatedItemColors = existing.CreatedItemColors,
                    CreatedInventory = existing.CreatedInventory,
                    UpdatedInventory = existing.UpdatedInventory,
                    Message = existing.Message,
                    DuplicateDatasetDetected = existing.Status == StatusDuplicateBlocked,
                    InventoryHistoryBatchId = existing.InventoryHistoryBatchId
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Idempotency replay unavailable: {ex.Message}");
                return null;
            }
        }

        private async Task<InventoryUploadBatch?> RecordUploadBatchAsync(
            NormalizedUploadRequest request,
            string? datasetHash,
            InventoryUploadResult result,
            string status,
            Guid? duplicateOfUploadBatchId,
            Guid? inventoryHistoryBatchId)
        {
            try
            {
                var batch = new InventoryUploadBatch
                {
                    UploadBatchId = Guid.NewGuid(),
                    CreatedAt = DateTime.UtcNow,
                    Status = status,
                    Mode = request.ModeText,
                    DatasetHash = datasetHash ?? string.Empty,
                    IdempotencyKey = request.IdempotencyKey,
                    RowCount = request.Rows.Count,
                    ProcessedRows = result.ProcessedRows,
                    ErrorCount = result.Errors.Count,
                    WarningCount = result.Warnings.Count,
                    CreatedSkus = result.CreatedSkus,
                    CreatedItemColors = result.CreatedItemColors,
                    CreatedInventory = result.CreatedInventory,
                    UpdatedInventory = result.UpdatedInventory,
                    DuplicateOfUploadBatchId = duplicateOfUploadBatchId,
                    InventoryHistoryBatchId = inventoryHistoryBatchId,
                    Message = Truncate(result.Message, 500),
                    ResultJson = JsonSerializer.Serialize(result, JsonOptions)
                };

                _context.InventoryUploadBatches.Add(batch);
                await _context.SaveChangesAsync();
                return batch;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Unable to record upload batch: {ex.Message}");
                return null;
            }
        }

        private static string BuildDatasetHash(string modeText, List<ValidatedUploadRow> rows)
        {
            if (rows.Count == 0)
            {
                return string.Empty;
            }

            var lines = rows
                .OrderBy(x => x.SeasonId)
                .ThenBy(x => x.ItemId)
                .ThenBy(x => x.ColorId)
                .ThenBy(x => x.CompositeSignature)
                .SelectMany(row =>
                    row.SizeQuantities
                        .OrderBy(x => x.Key)
                        .Select(sizeEntry =>
                            $"{row.SeasonId}|{row.ItemId}|{row.ColorId}|{row.CompositeSignature}|{sizeEntry.Key}|{sizeEntry.Value}"))
                .ToList();

            var payload = $"{modeText}\n{string.Join('\n', lines)}";
            var hash = SHA256.HashData(Encoding.UTF8.GetBytes(payload));
            return Convert.ToHexString(hash).ToLowerInvariant();
        }

        private static bool IsError(InventoryUploadIssue issue) =>
            string.Equals(issue.Severity, "error", StringComparison.OrdinalIgnoreCase);

        private static bool IsWarning(InventoryUploadIssue issue) =>
            string.Equals(issue.Severity, "warning", StringComparison.OrdinalIgnoreCase);

        private static void AddIssue(
            List<InventoryUploadIssue> issues,
            HashSet<int> invalidRowNumbers,
            int rowNumber,
            string severity,
            string code,
            string field,
            string message,
            List<string>? suggestions = null)
        {
            issues.Add(new InventoryUploadIssue
            {
                RowNumber = rowNumber,
                Severity = severity,
                Code = code,
                Field = field,
                Message = message,
                Suggestions = suggestions ?? new List<string>()
            });

            if (string.Equals(severity, "error", StringComparison.OrdinalIgnoreCase))
            {
                invalidRowNumbers.Add(rowNumber);
            }
        }

        private static List<string> GetSuggestions(string? input, IEnumerable<string?> candidates, int maxSuggestions = 3)
        {
            var normalizedInput = NormalizeSearchToken(input);
            if (string.IsNullOrWhiteSpace(normalizedInput))
            {
                return new List<string>();
            }

            return candidates
                .Where(candidate => !string.IsNullOrWhiteSpace(candidate))
                .Select(candidate => new
                {
                    Original = candidate!.Trim(),
                    Score = SimilarityScore(normalizedInput, NormalizeSearchToken(candidate))
                })
                .Where(x => x.Score <= 3 || x.Original.Contains(input ?? string.Empty, StringComparison.OrdinalIgnoreCase))
                .OrderBy(x => x.Score)
                .ThenBy(x => x.Original)
                .Select(x => x.Original)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .Take(maxSuggestions)
                .ToList();
        }

        private static int SimilarityScore(string left, string right)
        {
            if (left == right)
            {
                return 0;
            }

            if (left.Contains(right, StringComparison.Ordinal) || right.Contains(left, StringComparison.Ordinal))
            {
                return 1;
            }

            return Levenshtein(left, right);
        }

        private static int Levenshtein(string left, string right)
        {
            if (left.Length == 0) return right.Length;
            if (right.Length == 0) return left.Length;

            var matrix = new int[left.Length + 1, right.Length + 1];
            for (var i = 0; i <= left.Length; i++)
            {
                matrix[i, 0] = i;
            }

            for (var j = 0; j <= right.Length; j++)
            {
                matrix[0, j] = j;
            }

            for (var i = 1; i <= left.Length; i++)
            {
                for (var j = 1; j <= right.Length; j++)
                {
                    var cost = left[i - 1] == right[j - 1] ? 0 : 1;
                    matrix[i, j] = Math.Min(
                        Math.Min(matrix[i - 1, j] + 1, matrix[i, j - 1] + 1),
                        matrix[i - 1, j - 1] + cost);
                }
            }

            return matrix[left.Length, right.Length];
        }

        private static string NormalizeSearchToken(string? value)
        {
            var raw = NormalizeKey(value);
            var chars = raw.Where(char.IsLetterOrDigit).ToArray();
            return new string(chars);
        }

        private static string NormalizeColorMatchKey(string? value)
        {
            var raw = NormalizeKey(value);
            if (string.IsNullOrWhiteSpace(raw))
            {
                return string.Empty;
            }

            var tokenBuilder = new StringBuilder(raw.Length);
            var normalized = new StringBuilder(raw.Length * 2);

            void FlushToken()
            {
                if (tokenBuilder.Length == 0)
                {
                    return;
                }

                var token = tokenBuilder.ToString();
                if (ColorTokenAliases.TryGetValue(token, out var alias))
                {
                    normalized.Append(alias);
                }
                else
                {
                    normalized.Append(token);
                }

                tokenBuilder.Clear();
            }

            foreach (var ch in raw)
            {
                if (char.IsLetterOrDigit(ch))
                {
                    tokenBuilder.Append(char.ToLowerInvariant(ch));
                    continue;
                }

                FlushToken();
            }

            FlushToken();
            return normalized.ToString();
        }

        private static string? NormalizeIdempotencyKey(string? key)
        {
            if (string.IsNullOrWhiteSpace(key))
            {
                return null;
            }

            var trimmed = key.Trim();
            return trimmed.Length <= 120 ? trimmed : trimmed[..120];
        }

        private static UploadMode ResolveMode(string? mode)
        {
            if (string.IsNullOrWhiteSpace(mode))
            {
                return UploadMode.Replace;
            }

            if (mode.Equals("add", StringComparison.OrdinalIgnoreCase))
            {
                return UploadMode.Add;
            }

            if (mode.Equals("subtract", StringComparison.OrdinalIgnoreCase) || mode.Equals("remove", StringComparison.OrdinalIgnoreCase))
            {
                return UploadMode.Subtract;
            }

            if (mode.Equals("change", StringComparison.OrdinalIgnoreCase) || mode.Equals("replace", StringComparison.OrdinalIgnoreCase))
            {
                return UploadMode.Replace;
            }

            return UploadMode.Replace;
        }

        private static string ModeToText(UploadMode mode) => mode switch
        {
            UploadMode.Add => "add",
            UploadMode.Subtract => "subtract",
            _ => "replace"
        };

        private static MissingSizeBehavior ResolveMissingSizeBehavior(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return MissingSizeBehavior.Zero;
            }

            if (value.Equals("ignore", StringComparison.OrdinalIgnoreCase) ||
                value.Equals("leave-unchanged", StringComparison.OrdinalIgnoreCase))
            {
                return MissingSizeBehavior.Ignore;
            }

            return MissingSizeBehavior.Zero;
        }

        private static int ApplyMode(int qty, int existingQty, UploadMode mode)
        {
            var nextQty = mode switch
            {
                UploadMode.Add => existingQty + qty,
                UploadMode.Subtract => existingQty - qty,
                _ => qty
            };

            return Math.Max(0, nextQty);
        }

        private static string NormalizeKey(string? value)
        {
            return (value ?? string.Empty).Trim();
        }

        private static string BuildItemKey(int seasonId, string? itemNumber)
        {
            return $"{seasonId}|{NormalizeKey(itemNumber)}";
        }

        private static string BuildItemColorVariantKey(int itemId, int colorId, string? compositeSignature)
        {
            return $"{itemId}|{colorId}|{compositeSignature ?? string.Empty}";
        }

        private static List<string> SplitCompositeColorName(string? value)
        {
            return (value ?? string.Empty)
                .Split(new[] { '+', '/' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(part => part.Trim())
                .Where(part => !string.IsNullOrWhiteSpace(part))
                .ToList();
        }

        private static List<int> NormalizeSecondaryIds(IEnumerable<int> secondaryColorIds, int primaryColorId)
        {
            return secondaryColorIds
                .Where(id => id > 0 && id != primaryColorId)
                .Distinct()
                .ToList();
        }

        private static string BuildCompositeSignature(IEnumerable<int> secondaryColorIds)
        {
            var sortedIds = secondaryColorIds
                .Where(id => id > 0)
                .Distinct()
                .OrderBy(id => id)
                .ToList();

            return sortedIds.Count == 0
                ? string.Empty
                : string.Join("|", sortedIds);
        }

        private static string GetEffectiveCompositeSignature(string? storedSignature, IEnumerable<int> secondaryColorIds)
        {
            if (!string.IsNullOrWhiteSpace(storedSignature))
            {
                return storedSignature.Trim();
            }

            return BuildCompositeSignature(secondaryColorIds);
        }

        private static string? Truncate(string? value, int maxLength)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return value;
            }

            return value!.Length <= maxLength ? value : value[..maxLength];
        }

        private static string GetInnermostExceptionMessage(Exception ex)
        {
            var current = ex;
            while (current.InnerException != null)
            {
                current = current.InnerException;
            }

            return string.IsNullOrWhiteSpace(current.Message)
                ? ex.Message
                : current.Message;
        }

        private sealed class NormalizedUploadRequest
        {
            public List<InventoryUploadRow> Rows { get; init; } = new();

            public UploadMode Mode { get; init; }

            public string ModeText { get; init; } = "replace";

            public bool AllowPartial { get; init; }

            public bool AllowDuplicateDataset { get; init; }

            public MissingSizeBehavior MissingSizeBehavior { get; init; }

            public string? IdempotencyKey { get; init; }

            public string? UserNote { get; init; }
        }

        private sealed class ValidatedUploadRow
        {
            public int RowNumber { get; init; }

            public int SeasonId { get; init; }

            public int ItemId { get; init; }

            public int ItemColorId { get; init; }

            public int ColorId { get; init; }

            public string CompositeSignature { get; init; } = string.Empty;

            public List<int> SecondaryColorIds { get; init; } = new();

            public Dictionary<int, int> SizeQuantities { get; init; } = new();
        }

        private sealed class ItemColorLinkLookup
        {
            public int ItemColorId { get; init; }

            public int ItemId { get; init; }

            public int ColorId { get; init; }

            public string CompositeSignature { get; init; } = string.Empty;
        }

        private sealed class ValidationOutcome
        {
            public List<ValidatedUploadRow> ValidRows { get; set; } = new();

            public List<InventoryUploadIssue> Issues { get; set; } = new();

            public int InvalidRows { get; set; }

            public string DatasetHash { get; set; } = string.Empty;
        }
    }
}
