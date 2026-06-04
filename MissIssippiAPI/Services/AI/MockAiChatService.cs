using System.Text.RegularExpressions;
using MissIssippiAPI.Models;

namespace MissIssippiAPI.Services.AI;

/// <summary>
/// Keyword-based mock AI provider. No external API calls. No API key required.
/// Routes questions to inventory tools using simple pattern matching.
/// After tool results are returned, produces a template summary response.
/// Use for local development and testing until a real provider is configured.
/// </summary>
public class MockAiChatService : IAiChatService
{
    private static readonly string[] UnsupportedKeywords =
    [
        "who bought", "customer", "revenue", "invoice", "total sales",
        "best seller", "profit", "create order", "place order", "retail price",
        "reorder predict", "open order"
    ];

    private static readonly string[] KnownColors =
    [
        "red", "blue", "green", "coral", "navy", "black", "white", "pink",
        "yellow", "purple", "orange", "teal", "grey", "gray", "beige",
        "cream", "brown", "gold", "silver", "ivory"
    ];

    public Task<AiTurnResponse> CompleteAsync(AiConversation conversation)
    {
        // The original user question is always the first user message with TextContent
        var originalQuestion = conversation.Messages
            .Where(m => m.Role == "user" && m.TextContent != null)
            .Select(m => m.TextContent!)
            .FirstOrDefault() ?? string.Empty;

        // If tool results are present in the conversation, we're in the summarize phase
        var hasToolResults = conversation.Messages
            .Any(m => m.Role == "user" && m.ToolResults?.Count > 0);

        if (hasToolResults)
        {
            var toolNames = conversation.Messages
                .Where(m => m.ToolUses?.Count > 0)
                .SelectMany(m => m.ToolUses!)
                .Select(t => t.ToolName)
                .ToList();

            var toolList = toolNames.Count > 0 ? string.Join(", ", toolNames) : "none";

            return Task.FromResult(new AiTurnResponse
            {
                IsToolUse = false,
                Text = $"[Mock AI] Completed {toolNames.Count} tool call(s): {toolList}. " +
                       "Results are in the 'records' field. " +
                       "Connect a real AI provider (see Ai:Provider in appsettings) to get natural language summaries."
            });
        }

        // Check for unsupported question
        if (UnsupportedKeywords.Any(k => originalQuestion.Contains(k, StringComparison.OrdinalIgnoreCase)))
        {
            return Task.FromResult(new AiTurnResponse
            {
                IsToolUse = false,
                Text = "UNSUPPORTED: I can only answer questions about current inventory quantities, product details, " +
                       "colour availability, and inventory change history. Customer, sales, order, and revenue information " +
                       "isn't available in this system."
            });
        }

        // Route to a tool based on keywords
        var toolCall = RouteToTool(originalQuestion, conversation.Tools);
        if (toolCall != null)
        {
            return Task.FromResult(new AiTurnResponse
            {
                IsToolUse = true,
                ToolCalls = [toolCall]
            });
        }

        return Task.FromResult(new AiTurnResponse
        {
            IsToolUse = false,
            Text = "[Mock AI] Could not determine which inventory search to run. Please be more specific — " +
                   "try including a season name, style number, colour, or stock status."
        });
    }

    private static AiToolUse? RouteToTool(string question, List<AiToolDefinition> tools)
    {
        var q = question.ToLowerInvariant();

        // Out-of-stock / zero stock
        if (Has(q, "out of stock", "zero stock", "no stock", "none left", "completely out"))
            return Tool("get_low_stock_items", new() { ["maxQty"] = 0, ["pageSize"] = 25 });

        // Low stock
        if (Has(q, "low stock", "running low", "restock", "running out", "almost gone", "need restocking", "few left"))
            return Tool("get_low_stock_items", new() { ["maxQty"] = 5, ["pageSize"] = 25 });

        // Inventory change history
        if (Has(q, "history", "what happened", "changed", "last restocked", "adjusted", "when did", "why did", "went down", "went up"))
            return Tool("get_inventory_activity", new());

        // Explicit style number (e.g. "style 1042" or "item 204")
        var styleMatch = Regex.Match(q, @"\bstyle\s+(\d{2,6})\b|\bitem\s+(\d{2,6})\b");
        if (styleMatch.Success)
        {
            var num = styleMatch.Groups[1].Success ? styleMatch.Groups[1].Value : styleMatch.Groups[2].Value;
            return Tool("search_by_style_number", new()
            {
                ["itemNumber"] = num,
                ["includeVariantSummary"] = true
            });
        }

        // Color or collection-focused question
        if (Has(q, "color", "colour", "collection") || HasAnyKnownColor(q))
            return Tool("search_by_color", ExtractColorParams(q));

        // Season overview / catalog
        if (Has(q, "season", "catalog", "all styles", "what styles", "what do we have for", "show me everything for"))
            return Tool("get_seasons", new());

        // SKU check
        var skuMatch = Regex.Match(question, @"\*[A-Z0-9]{4,}\*");
        if (skuMatch.Success)
            return Tool("check_availability", new() { ["skuValues"] = new List<string> { skuMatch.Value } });

        // Default: general inventory search
        bool inStockOnly = Has(q, "available", "in stock", "have in stock", "still have");
        return Tool("search_inventory", new() { ["inStockOnly"] = inStockOnly, ["pageSize"] = 25 });
    }

    private static bool Has(string text, params string[] terms)
        => terms.Any(t => text.Contains(t, StringComparison.Ordinal));

    private static bool HasAnyKnownColor(string q)
        => KnownColors.Any(c => q.Contains(c, StringComparison.Ordinal));

    private static AiToolUse Tool(string name, Dictionary<string, object?> parameters)
        => new() { ToolName = name, Parameters = parameters };

    private static Dictionary<string, object?> ExtractColorParams(string q)
    {
        bool inStockOnly = q.Contains("available", StringComparison.Ordinal)
                        || q.Contains("in stock", StringComparison.Ordinal);

        foreach (var c in KnownColors)
            if (q.Contains(c, StringComparison.Ordinal))
                return new() { ["colorName"] = c, ["inStockOnly"] = inStockOnly };

        return new() { ["inStockOnly"] = inStockOnly };
    }
}
