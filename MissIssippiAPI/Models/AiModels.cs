namespace MissIssippiAPI.Models;

// ── Public API surface ────────────────────────────────────────────────────────

public class AiAskRequest
{
    public string Question { get; set; } = string.Empty;
}

public class AiAskResponse
{
    public string Answer { get; set; } = string.Empty;

    public List<string> ToolCallsUsed { get; set; } = new();

    public object? Records { get; set; }

    public bool ClarificationNeeded { get; set; }

    public bool Unsupported { get; set; }

    // ── Summary metadata ─────────────────────────────────────────────────────
    // Populated from the last tool result so callers don't need to parse Records.

    /// <summary>Number of items in this response (current page).</summary>
    public int? RecordCount { get; set; }

    /// <summary>Total matching records in the database across all pages.</summary>
    public int? TotalAvailable { get; set; }

    /// <summary>True when more pages are available beyond this response.</summary>
    public bool HasMore { get; set; }

    /// <summary>The backend tool that produced the Records in this response.</summary>
    public string? LastToolUsed { get; set; }
}

// ── Internal conversation types (shared between IAiChatService impls) ─────────

public class AiConversation
{
    public string SystemPrompt { get; set; } = string.Empty;

    public List<AiMessage> Messages { get; set; } = new();

    public List<AiToolDefinition> Tools { get; set; } = new();
}

public class AiMessage
{
    public string Role { get; set; } = null!;  // "user" | "assistant"

    public string? TextContent { get; set; }

    public List<AiToolUse>? ToolUses { get; set; }

    public List<AiToolResult>? ToolResults { get; set; }
}

public class AiTurnResponse
{
    public bool IsToolUse { get; set; }

    public string? Text { get; set; }

    public List<AiToolUse> ToolCalls { get; set; } = new();
}

public class AiToolUse
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N")[..8];

    public string ToolName { get; set; } = null!;

    public Dictionary<string, object?> Parameters { get; set; } = new();
}

public class AiToolResult
{
    public string ToolUseId { get; set; } = null!;

    public string Content { get; set; } = null!;
}

public class AiToolDefinition
{
    public string Name { get; set; } = null!;

    public string Description { get; set; } = null!;
}
