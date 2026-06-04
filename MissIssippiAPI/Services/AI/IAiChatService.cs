using MissIssippiAPI.Models;

namespace MissIssippiAPI.Services.AI;

/// <summary>
/// Provider-neutral contract for a single conversational AI turn.
/// Send the full conversation state; receive either a tool call request or a final text answer.
/// Implementations: MockAiChatService (no API key), AnthropicAiChatService (future).
/// </summary>
public interface IAiChatService
{
    Task<AiTurnResponse> CompleteAsync(AiConversation conversation);
}
