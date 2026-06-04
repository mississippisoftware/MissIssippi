using System.Text.Json;
using MissIssippiAPI.Models;

namespace MissIssippiAPI.Services.AI;

/// <summary>
/// Orchestrates the AI inventory search loop.
/// - Loads seasons and collections fresh on every request (Q2 decision).
/// - Dispatches tool calls to InventoryService.
/// - Enforces the 3-call cap (Q5 decision).
/// - Sanitizes results: hides costPrice (Q3) and batchNotes (Q4).
/// - Returns a structured AiAskResponse with answer, tool calls used, and records.
/// </summary>
public class InventoryAiService
{
    private const int MaxToolCalls = 3;

    private static readonly JsonSerializerOptions JsonOpts =
        new() { PropertyNameCaseInsensitive = true };

    private readonly IAiChatService _aiChat;
    private readonly InventoryService _inventory;

    public InventoryAiService(IAiChatService aiChat, InventoryService inventory)
    {
        _aiChat = aiChat;
        _inventory = inventory;
    }

    public async Task<AiAskResponse> AskAsync(AiAskRequest request)
    {
        // Q2: always refresh lookup data at session start
        var seasons = await _inventory.GetSeasonsAsync();
        var collections = await _inventory.GetCollectionsAsync();

        var conversation = new AiConversation
        {
            SystemPrompt = BuildSystemPrompt(seasons, collections),
            Tools = GetToolDefinitions(),
            Messages = [new AiMessage { Role = "user", TextContent = request.Question }]
        };

        var toolCallsUsed = new List<string>();
        object? lastRecords = null;
        var callCount = 0;

        while (callCount < MaxToolCalls)
        {
            var turn = await _aiChat.CompleteAsync(conversation);

            if (!turn.IsToolUse)
                return BuildFinalResponse(turn.Text ?? string.Empty, toolCallsUsed, lastRecords);

            // Execute each tool the AI requested
            var toolResults = new List<AiToolResult>();
            foreach (var toolCall in turn.ToolCalls)
            {
                if (callCount >= MaxToolCalls)
                    break;

                callCount++;
                toolCallsUsed.Add(toolCall.ToolName);

                var result = await ExecuteToolAsync(toolCall, seasons, collections);
                lastRecords = result;

                toolResults.Add(new AiToolResult
                {
                    ToolUseId = toolCall.Id,
                    Content = JsonSerializer.Serialize(result)
                });
            }

            // Append assistant turn and tool results to the conversation
            conversation.Messages.Add(new AiMessage { Role = "assistant", ToolUses = turn.ToolCalls });
            conversation.Messages.Add(new AiMessage { Role = "user", ToolResults = toolResults });
        }

        // Q5: hit the 3-call cap — ask the user to narrow
        return new AiAskResponse
        {
            Answer = "This question needs more detail to answer fully. Could you narrow it down? " +
                     "For example: which season, colour, or style number are you interested in?",
            ToolCallsUsed = toolCallsUsed,
            Records = lastRecords,
            ClarificationNeeded = true
        };
    }

    // ── Tool dispatch ────────────────────────────────────────────────────────

    private async Task<object> ExecuteToolAsync(
        AiToolUse toolCall,
        List<SeasonLookupDto> seasons,
        List<CollectionLookupDto> collections)
    {
        var p = toolCall.Parameters;

        return toolCall.ToolName switch
        {
            // Lookups — already loaded, return from memory
            "get_seasons" => seasons,
            "get_collections" => collections,

            "search_inventory" => await _inventory.SearchInventoryAsync(new InventorySearchQuery
            {
                SeasonId = GetNullableInt(p, "seasonId"),
                ItemNumber = GetString(p, "itemNumber"),
                ColorName = GetString(p, "colorName"),
                SizeName = GetString(p, "sizeName"),
                CollectionId = GetNullableInt(p, "collectionId"),
                InStockOnly = GetBool(p, "inStockOnly"),
                InProductionOnly = GetBool(p, "inProductionOnly"),
                Page = GetInt(p, "page", 1),
                PageSize = Math.Clamp(GetInt(p, "pageSize", 25), 1, 100)
            }),

            "check_availability" => await _inventory.CheckAvailabilityAsync(
                GetStringList(p, "skuValues"),
                GetNullableInt(p, "itemColorId"),
                GetNullableInt(p, "sizeId")
            ),

            "get_product_details" => await ExecuteGetProductDetailsAsync(p),

            "search_by_color" => await _inventory.SearchByColorAsync(new SearchByColorQuery
            {
                ColorName = GetString(p, "colorName"),
                CollectionId = GetNullableInt(p, "collectionId"),
                SeasonId = GetNullableInt(p, "seasonId"),
                InStockOnly = GetBool(p, "inStockOnly"),
                IncludePrimary = GetBool(p, "includePrimary", true),
                IncludeSecondary = GetBool(p, "includeSecondary"),
                Page = GetInt(p, "page", 1),
                PageSize = Math.Clamp(GetInt(p, "pageSize", 25), 1, 100)
            }),

            "get_low_stock_items" => await _inventory.GetLowStockItemsAsync(new LowStockQuery
            {
                MaxQty = GetInt(p, "maxQty"),
                SeasonId = GetNullableInt(p, "seasonId"),
                InProductionOnly = GetBool(p, "inProductionOnly"),
                Page = GetInt(p, "page", 1),
                PageSize = Math.Clamp(GetInt(p, "pageSize", 50), 1, 200)
            }),

            "search_by_style_number" => await _inventory.SearchByStyleNumberAsync(new StyleNumberQuery
            {
                ItemNumber = GetString(p, "itemNumber") ?? string.Empty,
                SeasonId = GetNullableInt(p, "seasonId"),
                IncludeVariantSummary = GetBool(p, "includeVariantSummary")
            }),

            "search_by_season" => await _inventory.SearchBySeasonAsync(new SearchBySeasonQuery
            {
                SeasonId = GetInt(p, "seasonId"),
                InStockOnly = GetBool(p, "inStockOnly"),
                InProductionOnly = GetBool(p, "inProductionOnly"),
                Page = GetInt(p, "page", 1),
                PageSize = Math.Clamp(GetInt(p, "pageSize", 50), 1, 200)
            }),

            "get_inventory_activity" => await ExecuteGetInventoryActivityAsync(p),

            _ => (object)new { error = $"Unknown tool '{toolCall.ToolName}'. Only approved inventory tools are permitted." }
        };
    }

    private async Task<object> ExecuteGetProductDetailsAsync(Dictionary<string, object?> p)
    {
        var itemId = GetInt(p, "itemId");
        if (itemId <= 0)
            return new { error = "itemId is required for get_product_details." };

        var result = await _inventory.GetProductDetailsAsync(itemId);
        if (result == null)
            return new { error = $"No product found with ItemId {itemId}." };

        // Q3: hide cost price
        result.CostPrice = null;
        return result;
    }

    private async Task<object> ExecuteGetInventoryActivityAsync(Dictionary<string, object?> p)
    {
        var query = new InventoryActivityQuery
        {
            SkuValue = GetString(p, "skuValue"),
            ItemColorId = GetNullableInt(p, "itemColorId"),
            Page = GetInt(p, "page", 1),
            PageSize = Math.Clamp(GetInt(p, "pageSize", 50), 1, 200)
        };

        if (GetString(p, "fromDate") is string fromStr && DateTime.TryParse(fromStr, out var fromDate))
            query.FromDate = fromDate;
        if (GetString(p, "toDate") is string toStr && DateTime.TryParse(toStr, out var toDate))
            query.ToDate = toDate;

        var result = await _inventory.GetInventoryActivityForVariantAsync(query);
        if (result == null)
            return new { error = $"SKU '{query.SkuValue}' not found." };

        // Q4: hide batch notes
        foreach (var line in result.Lines)
            line.BatchNotes = null;

        return result;
    }

    // ── Parameter extraction ─────────────────────────────────────────────────
    // Handles both mock (native C# values) and future real provider (JSON elements).

    private static int GetInt(Dictionary<string, object?> p, string key, int fallback = 0)
    {
        if (!p.TryGetValue(key, out var val) || val is null) return fallback;
        if (val is int i) return i;
        try { return JsonSerializer.Deserialize<int>(JsonSerializer.Serialize(val), JsonOpts); }
        catch { return fallback; }
    }

    private static int? GetNullableInt(Dictionary<string, object?> p, string key)
    {
        if (!p.TryGetValue(key, out var val) || val is null) return null;
        if (val is int i) return i;
        try { return JsonSerializer.Deserialize<int?>(JsonSerializer.Serialize(val), JsonOpts); }
        catch { return null; }
    }

    private static bool GetBool(Dictionary<string, object?> p, string key, bool fallback = false)
    {
        if (!p.TryGetValue(key, out var val) || val is null) return fallback;
        if (val is bool b) return b;
        try { return JsonSerializer.Deserialize<bool>(JsonSerializer.Serialize(val), JsonOpts); }
        catch { return fallback; }
    }

    private static string? GetString(Dictionary<string, object?> p, string key)
    {
        if (!p.TryGetValue(key, out var val) || val is null) return null;
        if (val is string s) return string.IsNullOrWhiteSpace(s) ? null : s;
        return val.ToString();
    }

    private static List<string>? GetStringList(Dictionary<string, object?> p, string key)
    {
        if (!p.TryGetValue(key, out var val) || val is null) return null;
        if (val is List<string> list) return list;
        try { return JsonSerializer.Deserialize<List<string>>(JsonSerializer.Serialize(val), JsonOpts); }
        catch { return null; }
    }

    // ── Response assembly ────────────────────────────────────────────────────

    private static AiAskResponse BuildFinalResponse(string text, List<string> toolCallsUsed, object? records)
    {
        bool unsupported = text.StartsWith("UNSUPPORTED:", StringComparison.OrdinalIgnoreCase);
        bool clarification = text.StartsWith("CLARIFICATION:", StringComparison.OrdinalIgnoreCase);

        var answer = (unsupported || clarification) && text.Contains(':')
            ? text[(text.IndexOf(':') + 1)..].Trim()
            : text;

        var (recordCount, totalAvailable, hasMore) = ExtractRecordMeta(records);

        return new AiAskResponse
        {
            Answer = answer,
            ToolCallsUsed = toolCallsUsed,
            Records = records,
            ClarificationNeeded = clarification,
            Unsupported = unsupported,
            RecordCount = recordCount,
            TotalAvailable = totalAvailable,
            HasMore = hasMore,
            LastToolUsed = toolCallsUsed.Count > 0 ? toolCallsUsed[^1] : null
        };
    }

    /// <summary>
    /// Extracts record count metadata from any tool result type, so callers
    /// do not need to know or parse the shape of the Records object.
    /// </summary>
    private static (int? recordCount, int? totalAvailable, bool hasMore) ExtractRecordMeta(object? records)
    {
        if (records is null) return (null, null, false);

        return records switch
        {
            InventorySearchResult r     => (r.Items.Count,   r.Total,          r.Total > r.Items.Count),
            LowStockResult r            => (r.Items.Count,   r.Total,          r.Total > r.Items.Count),
            SearchByColorResult r       => (r.Items.Count,   r.Total,          r.Total > r.Items.Count),
            StyleNumberResult r         => (r.Items.Count,   r.Total,          false),
            SearchBySeasonResult r      => (r.Items.Count,   r.Total,          r.Total > r.Items.Count),
            CheckAvailabilityResult r   => (r.Results.Count, r.Results.Count,  false),
            ProductDetailsResult r      => (r.Variants.Count, r.Variants.Count, false),
            InventoryActivityResult r   => (r.Lines.Count,   r.Total,          r.Total > r.Lines.Count),
            List<SeasonLookupDto> r     => (r.Count,         r.Count,          false),
            List<CollectionLookupDto> r => (r.Count,         r.Count,          false),
            _                           => (null,            null,             false)
        };
    }

    // ── System prompt ────────────────────────────────────────────────────────

    private static string BuildSystemPrompt(List<SeasonLookupDto> seasons, List<CollectionLookupDto> collections)
    {
        var seasonList = seasons.Count > 0
            ? string.Join(", ", seasons.Select(s => s.SeasonName + (s.Active ? " (active)" : "")))
            : "none";

        var collectionList = collections.Count > 0
            ? string.Join(", ", collections.Select(c => c.CollectionName))
            : "none";

        return "You are an inventory assistant for a wholesale apparel company. " +
               "Answer only questions about current inventory.\n\n" +

               "HARD LIMITS: Do not answer questions about customers, orders, invoices, sales, " +
               "revenue, retail pricing, reorder predictions, or data modifications. " +
               "If asked, respond: \"I can only answer questions about current inventory quantities, " +
               "product details, colour availability, and inventory change history.\"\n\n" +

               "DATA RULES:\n" +
               "- Show wholesale price only. Never show cost price.\n" +
               "- Never show batch notes. Show batch source only.\n" +
               "- When stock is zero say 'no units on hand' — never 'sold out'.\n" +
               "- Do not expose internal IDs unless needed for a follow-up call.\n" +
               "- Never invent data — only show values from tool responses.\n\n" +

               "RESULTS: State how many results were returned and total available. " +
               "State which filters were applied. Return first page only — never auto-fetch page 2.\n\n" +

               "TOOL CHAINING: Maximum 3 tool calls per question. " +
               "If more are needed, ask the user to narrow the request.\n\n" +

               "COLOR ROUTING: Use search_inventory when colour is one filter among season/size/style. " +
               "Use search_by_color when colour or collection is the primary subject, " +
               "or when secondary-colour matching is needed.\n\n" +

               $"Seasons available: {seasonList}\n" +
               $"Collections available: {collectionList}\n" +
               "Use these to resolve names to IDs without re-calling the lookup tools.";
    }

    // ── Tool definitions sent to the AI provider ─────────────────────────────

    private static List<AiToolDefinition> GetToolDefinitions() =>
    [
        new() { Name = "get_seasons",           Description = "Returns all seasons with IDs, names, and active status." },
        new() { Name = "get_collections",        Description = "Returns all colour collections with IDs and names." },
        new() { Name = "search_inventory",       Description = "SKU-level inventory search by season, style, colour, size, or stock status. Colour matches primary only." },
        new() { Name = "check_availability",     Description = "Targeted availability check for specific SKUs (skuValues) or a colour variant (itemColorId + optional sizeId)." },
        new() { Name = "get_product_details",    Description = "Full detail for one style: variants, sizes, quantities, images, wholesale price. Requires itemId." },
        new() { Name = "search_by_color",        Description = "Find variants by colour or collection. Supports secondary-colour matching via includeSecondary." },
        new() { Name = "get_low_stock_items",    Description = "Returns SKUs at or below maxQty. Ordered lowest first. Use 0 for out-of-stock, 5 for low stock." },
        new() { Name = "search_by_style_number", Description = "Look up styles by partial or exact style number. Returns up to 200." },
        new() { Name = "search_by_season",       Description = "All styles for a season with per-style stock aggregates. Requires seasonId." },
        new() { Name = "get_inventory_activity", Description = "Inventory change history for a variant (itemColorId) or SKU (skuValue). Most recent first." }
    ];
}
