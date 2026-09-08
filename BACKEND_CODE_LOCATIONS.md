# 📍 .NET Backend Code Locations

## 🎯 Where to Find Controller Code

### ✅ Traditional Controller (Created for you)
**File:** `backend/Controllers/AuthController.cs`

**This is your controller code!** It contains:
- `Register()` - POST endpoint
- `Login()` - POST endpoint  
- `GetProfile()` - GET endpoint
- `UpdateProfile()` - PUT endpoint
- `ResetPassword()` - POST endpoint

---

## 📁 Complete Backend File Structure

```
backend/
├── Controllers/              ← CONTROLLER CODE HERE! 🎮
│   └── AuthController.cs    ← All API endpoints (traditional MVC)
│
├── Models/                   ← Data Models (DTOs)
│   ├── User.cs              ← Domain model
│   ├── RegisterDto.cs       ← Registration request
│   ├── LoginDto.cs          ← Login request
│   ├── UpdateProfileDto.cs  ← Profile update request
│   └── ResetPasswordDto.cs ← Password reset request
│
├── Services/                 ← Business Logic
│   ├── IUserService.cs      ← Interface
│   └── UserService.cs       ← Implementation (SQL queries here)
│
├── Program.cs                ← Application setup + Minimal API endpoints
├── backend.csproj           ← Project file
└── appsettings.json         ← Configuration
```

---

## 🎮 Controller Code Location

### AuthController.cs
**Path:** `backend/Controllers/AuthController.cs`

**Contains:**
```csharp
[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    // All 5 endpoints:
    // 1. Register
    // 2. Login
    // 3. GetProfile
    // 4. UpdateProfile
    // 5. ResetPassword
}
```

**Routes:**
- `POST /api/Auth/register`
- `POST /api/Auth/login`
- `GET /api/Auth/profile/{userId}`
- `PUT /api/Auth/profile/{userId}`
- `POST /api/Auth/reset-password`

---

## 📝 Current Setup (Minimal APIs)

**File:** `backend/Program.cs`

**Contains:** All endpoints defined using `app.MapPost()`, `app.MapGet()`, etc.

**Routes:**
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/profile/{userId}`
- `PUT /auth/profile/{userId}`
- `POST /auth/reset-password`

---

## 🔄 Two Ways to Organize Code

### Option 1: Minimal APIs (Currently Active)
- **File:** `Program.cs` (lines 44-230)
- **Routes:** `/auth/*`
- **Style:** All endpoints in one file

### Option 2: Controllers (Created, Not Active)
- **File:** `Controllers/AuthController.cs`
- **Routes:** `/api/Auth/*`
- **Style:** Traditional MVC, better organized

---

## 🎯 What Each File Does

| File | Purpose | Contains |
|------|---------|----------|
| **AuthController.cs** | API endpoints | HTTP methods, request handling |
| **UserService.cs** | Business logic | SQL queries, password hashing |
| **Models/** | Data structures | DTOs, domain models |
| **Program.cs** | App setup | Configuration, middleware, endpoints |

---

## ✅ Summary

**Controller Code:** `backend/Controllers/AuthController.cs` ✅

**Service Code:** `backend/Services/UserService.cs` ✅

**Models:** `backend/Models/` ✅

**All .NET code is in:** `backend/` folder ✅

---

**✅ Check `backend/Controllers/AuthController.cs` to see your controller code!**

