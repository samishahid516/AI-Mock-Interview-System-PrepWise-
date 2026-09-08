using Microsoft.AspNetCore.Mvc;
using backend.Models;
using backend.Services;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IUserService _userService;

    public AuthController(IUserService userService)
    {
        _userService = userService;
    }

    /// <summary>
    /// Register a new user
    /// </summary>
    /// <param name="dto">User registration data</param>
    /// <returns>Created user information</returns>
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        try
        {
            // Validate input
            if (string.IsNullOrWhiteSpace(dto.FullName) || 
                string.IsNullOrWhiteSpace(dto.Email) || 
                string.IsNullOrWhiteSpace(dto.Password))
            {
                return BadRequest("FullName, Email, and Password are required.");
            }

            // Check if email already exists
            var existingUser = await _userService.GetUserByEmailAsync(dto.Email);
            if (existingUser != null)
            {
                return BadRequest("Email already exists.");
            }

            // Create new user
            var user = await _userService.CreateUserAsync(dto.FullName, dto.Email, dto.Password);
            
            if (user == null)
            {
                return StatusCode(500, "Failed to create user.");
            }

            return Ok(new
            {
                Id = user.Id.ToString(),
                FullName = user.FullName,
                Email = user.Email,
                CreatedAt = user.CreatedAt
            });
        }
        catch (Exception ex)
        {
            return Problem($"An error occurred: {ex.Message}");
        }
    }

    /// <summary>
    /// Authenticate user and login
    /// </summary>
    /// <param name="dto">Login credentials</param>
    /// <returns>User information if authenticated</returns>
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
            {
                return BadRequest("Email and Password are required.");
            }

            var user = await _userService.AuthenticateUserAsync(dto.Email, dto.Password);
            
            if (user == null)
            {
                return Unauthorized("Invalid email or password.");
            }

            return Ok(new
            {
                Id = user.Id.ToString(),
                FullName = user.FullName,
                Email = user.Email,
                CreatedAt = user.CreatedAt
            });
        }
        catch (Exception ex)
        {
            return Problem($"An error occurred: {ex.Message}");
        }
    }

    /// <summary>
    /// Get user profile by ID
    /// </summary>
    /// <param name="userId">User ID (GUID)</param>
    /// <returns>User profile information</returns>
    [HttpGet("profile/{userId}")]
    public async Task<IActionResult> GetProfile(string userId)
    {
        try
        {
            if (!Guid.TryParse(userId, out var userGuid))
            {
                return BadRequest("Invalid user ID format.");
            }

            var user = await _userService.GetUserByIdAsync(userGuid);
            
            if (user == null)
            {
                return NotFound("User not found.");
            }

            return Ok(new
            {
                Id = user.Id.ToString(),
                FullName = user.FullName,
                Email = user.Email,
                CreatedAt = user.CreatedAt,
                UpdatedAt = user.UpdatedAt
            });
        }
        catch (Exception ex)
        {
            return Problem($"An error occurred: {ex.Message}");
        }
    }

    /// <summary>
    /// Update user profile
    /// </summary>
    /// <param name="userId">User ID (GUID)</param>
    /// <param name="dto">Updated profile data</param>
    /// <returns>Updated user information</returns>
    [HttpPut("profile/{userId}")]
    public async Task<IActionResult> UpdateProfile(string userId, [FromBody] UpdateProfileDto dto)
    {
        try
        {
            if (!Guid.TryParse(userId, out var userGuid))
            {
                return BadRequest("Invalid user ID format.");
            }

            if (string.IsNullOrWhiteSpace(dto.FullName) || string.IsNullOrWhiteSpace(dto.Email))
            {
                return BadRequest("FullName and Email are required.");
            }

            // Check if email is already taken by another user
            var existingUser = await _userService.GetUserByEmailAsync(dto.Email);
            if (existingUser != null && existingUser.Id != userGuid)
            {
                return BadRequest("Email already exists.");
            }

            var user = await _userService.UpdateUserProfileAsync(userGuid, dto.FullName, dto.Email);
            
            if (user == null)
            {
                return NotFound("User not found.");
            }

            return Ok(new
            {
                Id = user.Id.ToString(),
                FullName = user.FullName,
                Email = user.Email,
                UpdatedAt = user.UpdatedAt
            });
        }
        catch (Exception ex)
        {
            return Problem($"An error occurred: {ex.Message}");
        }
    }

    /// <summary>
    /// Reset user password
    /// </summary>
    /// <param name="dto">Password reset data</param>
    /// <returns>Success message</returns>
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
    {
        try
        {
            if (!Guid.TryParse(dto.UserId, out var userGuid))
            {
                return BadRequest("Invalid user ID format.");
            }

            if (string.IsNullOrWhiteSpace(dto.CurrentPassword) || 
                string.IsNullOrWhiteSpace(dto.NewPassword))
            {
                return BadRequest("CurrentPassword and NewPassword are required.");
            }

            var success = await _userService.ResetPasswordAsync(
                userGuid, 
                dto.CurrentPassword, 
                dto.NewPassword);

            if (!success)
            {
                return BadRequest("Invalid current password or user not found.");
            }

            return Ok(new { message = "Password updated successfully." });
        }
        catch (Exception ex)
        {
            return Problem($"An error occurred: {ex.Message}");
        }
    }
}

