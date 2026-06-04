using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using MissIssippiAPI.Models;
using MissIssippiAPI.Services;

namespace MissIssippiAPI.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly UserManager<User> _userManager;
    private readonly JwtService _jwtService;

    public AuthController(UserManager<User> userManager, JwtService jwtService)
    {
        _userManager = userManager;
        _jwtService = jwtService;
    }

    public record LoginRequest(string Email, string Password);
    public record RegisterRequest(string Email, string Password, string DisplayName, string Role);

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null || !await _userManager.CheckPasswordAsync(user, request.Password))
        {
            return Unauthorized(new
            {
                success = false,
                data = (object?)null,
                error = new { code = "INVALID_CREDENTIALS", message = "Invalid email or password." }
            });
        }

        var token = _jwtService.GenerateToken(user);
        return Ok(new
        {
            success = true,
            data = new { token, email = user.Email, displayName = user.DisplayName, role = user.Role },
            error = (object?)null
        });
    }

    [HttpPost("register")]
    [Authorize(Roles = "owner")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var user = new User
        {
            UserName = request.Email,
            Email = request.Email,
            DisplayName = request.DisplayName,
            Role = request.Role,
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            return BadRequest(new
            {
                success = false,
                data = (object?)null,
                error = new
                {
                    code = "REGISTRATION_FAILED",
                    message = string.Join("; ", result.Errors.Select(e => e.Description))
                }
            });
        }

        return StatusCode(201, new
        {
            success = true,
            data = new { id = user.Id, email = user.Email },
            error = (object?)null
        });
    }
}
