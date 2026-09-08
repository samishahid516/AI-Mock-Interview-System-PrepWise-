using backend.Models;

namespace backend.Services;

public interface IUserService
{
    Task<User?> GetUserByEmailAsync(string email);
    Task<User?> GetUserByIdAsync(Guid userId);
    Task<User?> CreateUserAsync(string fullName, string email, string password);
    Task<User?> AuthenticateUserAsync(string email, string password);
    Task<User?> UpdateUserProfileAsync(Guid userId, string fullName, string email);
    Task<bool> ResetPasswordAsync(Guid userId, string currentPassword, string newPassword);
}
