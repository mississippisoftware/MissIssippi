using Microsoft.AspNetCore.Mvc;
using MissIssippiAPI.Models;
using MissIssippiAPI.Services.AI;

namespace MissIssippiAPI.Controllers;

[Route("api/[controller]/[action]")]
[ApiController]
public class InventoryAiController : ControllerBase
{
    private readonly InventoryAiService _aiService;

    public InventoryAiController(InventoryAiService aiService)
    {
        _aiService = aiService;
    }

    [HttpPost]
    public async Task<IActionResult> Ask([FromBody] AiAskRequest request)
    {
        if (string.IsNullOrWhiteSpace(request?.Question))
            return BadRequest("Question is required.");

        var response = await _aiService.AskAsync(request);
        return Ok(response);
    }
}
