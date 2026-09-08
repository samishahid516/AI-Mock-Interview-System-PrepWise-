using Dapper;
using Microsoft.Data.SqlClient;
using Microsoft.Data.Sqlite;
using System.Data;
using backend.Models;
using backend.Services;

// Register a Dapper handler so SQLite TEXT <-> Guid mapping works
// (without this, Dapper tries reader.GetGuid() which fails on SQLite TEXT columns)
SqlMapper.AddTypeHandler(new SqliteGuidHandler());

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
// Allowed frontend origins: local dev defaults + any extra origins from config/env
// (set ALLOWED_ORIGINS as a comma-separated list, e.g. your Vercel URL, in production)
var defaultOrigins = new[] { "http://localhost:3001", "http://localhost:3000" };
var configuredOrigins = builder.Configuration["AllowedOrigins"]
    ?.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
    ?? Array.Empty<string>();
var allowedOrigins = defaultOrigins.Concat(configuredOrigins).Distinct().ToArray();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Register database service based on configured provider ("SqlServer" or "Sqlite")
var databaseProvider = builder.Configuration["DatabaseProvider"] ?? "SqlServer";
var useSqlite = string.Equals(databaseProvider, "Sqlite", StringComparison.OrdinalIgnoreCase);

builder.Services.AddScoped<IDbConnection>(sp =>
{
    var connectionString = useSqlite
        ? builder.Configuration.GetConnectionString("SqliteConnection")
        : builder.Configuration.GetConnectionString("DefaultConnection");

    return useSqlite
        ? new SqliteConnection(connectionString)
        : new SqlConnection(connectionString);
});

builder.Services.AddScoped<IUserService>(sp =>
{
    var connection = sp.GetRequiredService<IDbConnection>();
    return new UserService(connection, useSqlite);
});

var app = builder.Build();

// Initialize SQLite database schema on startup (SQL Server schema is managed separately)
if (useSqlite)
{
    using var initConnection = new SqliteConnection(
        builder.Configuration.GetConnectionString("SqliteConnection"));
    initConnection.Open();
    initConnection.Execute(@"
        CREATE TABLE IF NOT EXISTS Users (
            Id TEXT PRIMARY KEY,
            FullName TEXT NOT NULL,
            Email TEXT NOT NULL,
            PasswordHash TEXT NOT NULL,
            CreatedAt TEXT NOT NULL,
            UpdatedAt TEXT NOT NULL
        );");
}

// Configure the HTTP request pipeline
// Swagger stays available in production too (demo project) so the deployed
// API can be exercised directly at /swagger.
app.UseSwagger();
app.UseSwaggerUI();

app.UseCors("AllowFrontend");
// app.UseHttpsRedirection(); // Commented out to avoid HTTPS redirect warning

// Auth Endpoints
app.MapPost("/auth/register", async (RegisterDto dto, IUserService userService) =>
{
    try
    {
        // Validate input
        if (string.IsNullOrWhiteSpace(dto.FullName) || 
            string.IsNullOrWhiteSpace(dto.Email) || 
            string.IsNullOrWhiteSpace(dto.Password))
        {
            return Results.BadRequest("FullName, Email, and Password are required.");
        }

        // Check if email already exists
        var existingUser = await userService.GetUserByEmailAsync(dto.Email);
        if (existingUser != null)
        {
            return Results.BadRequest("Email already exists.");
        }

        // Create new user
        var user = await userService.CreateUserAsync(dto.FullName, dto.Email, dto.Password);
        
        if (user == null)
        {
            return Results.StatusCode(500);
        }

        return Results.Ok(new
        {
            Id = user.Id.ToString(),
            FullName = user.FullName,
            Email = user.Email,
            CreatedAt = user.CreatedAt
        });
    }
    catch (Exception ex)
    {
        return Results.Problem($"An error occurred: {ex.Message}");
    }
})
.WithName("Register")
.WithTags("Auth");

app.MapPost("/auth/login", async (LoginDto dto, IUserService userService) =>
{
    try
    {
        if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
        {
            return Results.BadRequest("Email and Password are required.");
        }

        var user = await userService.AuthenticateUserAsync(dto.Email, dto.Password);
        
        if (user == null)
        {
            return Results.Unauthorized();
        }

        return Results.Ok(new
        {
            Id = user.Id.ToString(),
            FullName = user.FullName,
            Email = user.Email,
            CreatedAt = user.CreatedAt
        });
    }
    catch (Exception ex)
    {
        return Results.Problem($"An error occurred: {ex.Message}");
    }
})
.WithName("Login")
.WithTags("Auth");

app.MapGet("/auth/profile/{userId}", async (string userId, IUserService userService) =>
{
    try
    {
        if (!Guid.TryParse(userId, out var userGuid))
        {
            return Results.BadRequest("Invalid user ID format.");
        }

        var user = await userService.GetUserByIdAsync(userGuid);
        
        if (user == null)
        {
            return Results.NotFound("User not found.");
        }

        return Results.Ok(new
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
        return Results.Problem($"An error occurred: {ex.Message}");
    }
})
.WithName("GetProfile")
.WithTags("Auth");

app.MapPut("/auth/profile/{userId}", async (string userId, UpdateProfileDto dto, IUserService userService) =>
{
    try
    {
        if (!Guid.TryParse(userId, out var userGuid))
        {
            return Results.BadRequest("Invalid user ID format.");
        }

        if (string.IsNullOrWhiteSpace(dto.FullName) || string.IsNullOrWhiteSpace(dto.Email))
        {
            return Results.BadRequest("FullName and Email are required.");
        }

        // Check if email is already taken by another user
        var existingUser = await userService.GetUserByEmailAsync(dto.Email);
        if (existingUser != null && existingUser.Id != userGuid)
        {
            return Results.BadRequest("Email already exists.");
        }

        var user = await userService.UpdateUserProfileAsync(userGuid, dto.FullName, dto.Email);
        
        if (user == null)
        {
            return Results.NotFound("User not found.");
        }

        return Results.Ok(new
        {
            Id = user.Id.ToString(),
            FullName = user.FullName,
            Email = user.Email,
            UpdatedAt = user.UpdatedAt
        });
    }
    catch (Exception ex)
    {
        return Results.Problem($"An error occurred: {ex.Message}");
    }
})
.WithName("UpdateProfile")
.WithTags("Auth");

app.MapPost("/auth/reset-password", async (ResetPasswordDto dto, IUserService userService) =>
{
    try
    {
        if (!Guid.TryParse(dto.UserId, out var userGuid))
        {
            return Results.BadRequest("Invalid user ID format.");
        }

        if (string.IsNullOrWhiteSpace(dto.CurrentPassword) || 
            string.IsNullOrWhiteSpace(dto.NewPassword))
        {
            return Results.BadRequest("CurrentPassword and NewPassword are required.");
        }

        var success = await userService.ResetPasswordAsync(
            userGuid, 
            dto.CurrentPassword, 
            dto.NewPassword);

        if (!success)
        {
            return Results.BadRequest("Invalid current password or user not found.");
        }

        return Results.Ok(new { message = "Password updated successfully." });
    }
    catch (Exception ex)
    {
        return Results.Problem($"An error occurred: {ex.Message}");
    }
})
.WithName("ResetPassword")
.WithTags("Auth");

// Root endpoint
app.MapGet("/", () => Results.Redirect("/swagger"))
    .ExcludeFromDescription();

app.Run();

public sealed class SqliteGuidHandler : SqlMapper.TypeHandler<Guid>
{
    public override void SetValue(IDbDataParameter parameter, Guid value)
    {
        File.AppendAllText("guid-debug.log", $"SET: [{parameter.ParameterName}] = {value}\n");
        parameter.Value = value.ToString();
    }

    public override Guid Parse(object value)
    {
        File.AppendAllText("guid-debug.log", $"PARSE: {value} ({value.GetType().Name})\n");
        return Guid.Parse(Convert.ToString(value) ?? throw new InvalidCastException("Invalid Guid value"));
    }
}
