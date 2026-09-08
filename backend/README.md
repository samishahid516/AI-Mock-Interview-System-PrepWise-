# Backend API

.NET Core Web API backend for the InterviewApp project.

**All .NET files are in this `backend/` folder.**

## Prerequisites

- .NET 8.0 SDK
- SQL Server (Express or full version)
- Visual Studio 2022 or VS Code with C# extension

## Setup

1. **Restore dependencies:**
   ```bash
   dotnet restore
   ```

2. **Create the database:**
   - Open SQL Server Management Studio (SSMS) or use sqlcmd
   - Run the SQL script from `SQL_SCHEMA.md` in the root project to create the database and Users table

3. **Update connection string:**
   - Edit `appsettings.json` or `appsettings.Development.json`
   - Update the `ConnectionStrings:DefaultConnection` to match your SQL Server instance

4. **Run the API:**
   ```bash
   dotnet run
   ```

   The API will be available at:
   - HTTP: `http://localhost:5216`
   - HTTPS: `https://localhost:5217`
   - Swagger UI: `http://localhost:5216/swagger`

## API Endpoints

### Authentication

- `POST /auth/register` - Register a new user
- `POST /auth/login` - Authenticate user
- `GET /auth/profile/{userId}` - Get user profile
- `PUT /auth/profile/{userId}` - Update user profile
- `POST /auth/reset-password` - Reset user password

## Technologies

- ASP.NET Core 8.0
- Dapper (ORM)
- Microsoft.Data.SqlClient
- BCrypt.Net (Password hashing)
- Swagger/OpenAPI

## Project Structure

```
backend/
├── Models/          # DTOs and domain models
├── Services/        # Business logic and data access
├── Program.cs       # Application entry point
├── appsettings.json # Configuration
└── backend.csproj   # Project file
```
