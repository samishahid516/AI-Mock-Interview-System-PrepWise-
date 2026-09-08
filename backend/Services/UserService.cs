using Dapper;
using backend.Models;
using System.Data;
using BCrypt.Net;

namespace backend.Services;

public class UserService : IUserService
{
    private readonly IDbConnection _connection;
    private readonly bool _useSqlite;

    public UserService(IDbConnection connection, bool useSqlite = false)
    {
        _connection = connection;
        _useSqlite = useSqlite;
    }

    public async Task<User?> GetUserByEmailAsync(string email)
    {
        const string sql = @"
            SELECT Id, FullName, Email, PasswordHash, CreatedAt, UpdatedAt
            FROM Users
            WHERE Email = @Email";

        var user = await _connection.QueryFirstOrDefaultAsync<User>(sql, new { Email = email });
        return user;
    }

    public async Task<User?> GetUserByIdAsync(Guid userId)
    {
        const string sql = @"
            SELECT Id, FullName, Email, PasswordHash, CreatedAt, UpdatedAt
            FROM Users
            WHERE Id = @Id";

        var user = await _connection.QueryFirstOrDefaultAsync<User>(sql, new { Id = userId });
        return user;
    }

    public async Task<User?> CreateUserAsync(string fullName, string email, string password)
    {
        // Hash the password
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(password);

        if (_useSqlite)
        {
            const string sql = @"
                INSERT INTO Users (Id, FullName, Email, PasswordHash, CreatedAt, UpdatedAt)
                VALUES (@Id, @FullName, @Email, @PasswordHash, @CreatedAt, @UpdatedAt)
                RETURNING Id, FullName, Email, PasswordHash, CreatedAt, UpdatedAt";

            try
            {
                var user = await _connection.QueryFirstOrDefaultAsync<User>(sql, new
                {
                    Id = Guid.NewGuid().ToString(),
                    FullName = fullName,
                    Email = email,
                    PasswordHash = passwordHash,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });

                return user;
            }
            catch
            {
                return null;
            }
        }

        const string sqlServerSql = @"
            INSERT INTO Users (Id, FullName, Email, PasswordHash, CreatedAt, UpdatedAt)
            OUTPUT INSERTED.Id, INSERTED.FullName, INSERTED.Email, INSERTED.PasswordHash, INSERTED.CreatedAt, INSERTED.UpdatedAt
            VALUES (NEWID(), @FullName, @Email, @PasswordHash, GETDATE(), GETDATE())";

        try
        {
            var user = await _connection.QueryFirstOrDefaultAsync<User>(sqlServerSql, new
            {
                FullName = fullName,
                Email = email,
                PasswordHash = passwordHash
            });

            return user;
        }
        catch
        {
            return null;
        }
    }

    public async Task<User?> AuthenticateUserAsync(string email, string password)
    {
        var user = await GetUserByEmailAsync(email);
        
        if (user == null)
        {
            return null;
        }

        // Verify password
        var isPasswordValid = BCrypt.Net.BCrypt.Verify(password, user.PasswordHash);
        
        if (!isPasswordValid)
        {
            return null;
        }

        // Return user without password hash
        return user;
    }

    public async Task<User?> UpdateUserProfileAsync(Guid userId, string fullName, string email)
    {
        if (_useSqlite)
        {
            const string sql = @"
                UPDATE Users
                SET FullName = @FullName, Email = @Email, UpdatedAt = @UpdatedAt
                WHERE Id = @Id
                RETURNING Id, FullName, Email, PasswordHash, CreatedAt, UpdatedAt";

            try
            {
                var user = await _connection.QueryFirstOrDefaultAsync<User>(sql, new
                {
                    Id = userId.ToString(),
                    FullName = fullName,
                    Email = email,
                    UpdatedAt = DateTime.UtcNow
                });

                return user;
            }
            catch
            {
                return null;
            }
        }

        const string sqlServerSql = @"
            UPDATE Users
            SET FullName = @FullName, Email = @Email, UpdatedAt = GETDATE()
            OUTPUT INSERTED.Id, INSERTED.FullName, INSERTED.Email, INSERTED.PasswordHash, INSERTED.CreatedAt, INSERTED.UpdatedAt
            WHERE Id = @Id";

        try
        {
            var user = await _connection.QueryFirstOrDefaultAsync<User>(sqlServerSql, new
            {
                Id = userId,
                FullName = fullName,
                Email = email
            });

            return user;
        }
        catch
        {
            return null;
        }
    }

    public async Task<bool> ResetPasswordAsync(Guid userId, string currentPassword, string newPassword)
    {
        var user = await GetUserByIdAsync(userId);
        
        if (user == null)
        {
            return false;
        }

        // Verify current password
        var isCurrentPasswordValid = BCrypt.Net.BCrypt.Verify(currentPassword, user.PasswordHash);
        
        if (!isCurrentPasswordValid)
        {
            return false;
        }

        // Hash new password
        var newPasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);

        if (_useSqlite)
        {
            const string sql = @"
                UPDATE Users
                SET PasswordHash = @NewPasswordHash, UpdatedAt = @UpdatedAt
                WHERE Id = @Id";

            var rowsAffected = await _connection.ExecuteAsync(sql, new
            {
                Id = userId.ToString(),
                NewPasswordHash = newPasswordHash,
                UpdatedAt = DateTime.UtcNow
            });

            return rowsAffected > 0;
        }

        const string sqlServerSql = @"
            UPDATE Users
            SET PasswordHash = @NewPasswordHash, UpdatedAt = GETDATE()
            WHERE Id = @Id";

        var sqlServerRowsAffected = await _connection.ExecuteAsync(sqlServerSql, new
        {
            Id = userId,
            NewPasswordHash = newPasswordHash
        });

        return sqlServerRowsAffected > 0;
    }
}
