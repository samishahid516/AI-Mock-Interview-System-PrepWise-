# 🔄 How Your Project Works - Complete Explanation

## 📋 Overview

Your project has **3 main components** working together:

1. **SQL Database** - Stores data
2. **.NET Backend** - Handles business logic and API
3. **React Frontend** - User interface

---

## 🏗️ Architecture Flow

```
┌─────────────────────────────────────┐
│   React Frontend (TypeScript)       │
│   - User sees the website           │
│   - User fills forms                │
│   - Makes HTTP requests             │
│   Port: 3001                        │
└──────────────┬──────────────────────┘
               │ HTTP Requests
               │ (POST, GET, PUT)
               ▼
┌─────────────────────────────────────┐
│   .NET Backend (C#)                 │
│   - Receives requests               │
│   - Validates data                  │
│   - Processes business logic        │
│   - Connects to database            │
│   Port: 5216                        │
└──────────────┬──────────────────────┘
               │ SQL Queries
               │ (SELECT, INSERT, UPDATE)
               ▼
┌─────────────────────────────────────┐
│   SQL Server Database               │
│   - Stores user data                │
│   - Users table                     │
│   - Returns data                    │
└─────────────────────────────────────┘
```

---

## 🔄 Complete Flow Example: User Registration

### Step 1: User Action (Frontend)
**Location:** `frontend/components/auth/AuthForm.tsx`

```typescript
// User fills form and clicks "Sign Up"
const handleSubmit = async (e: React.FormEvent) => {
  // Frontend sends HTTP request to backend
  const res = await fetch("http://localhost:5216/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: "SAMI",
      email: "msamishahid5@gmail.com",
      password: "sami123"
    }),
  });
};
```

**What happens:**
- User types in form fields
- Clicks "Create Account" button
- Frontend sends POST request to backend API

---

### Step 2: Backend Receives Request (C#)
**Location:** `backend/Program.cs`

```csharp
app.MapPost("/auth/register", async (RegisterDto dto, IUserService userService) =>
{
    // 1. Validate input
    if (string.IsNullOrWhiteSpace(dto.FullName) || 
        string.IsNullOrWhiteSpace(dto.Email) || 
        string.IsNullOrWhiteSpace(dto.Password))
    {
        return Results.BadRequest("FullName, Email, and Password are required.");
    }

    // 2. Check if email already exists (calls database)
    var existingUser = await userService.GetUserByEmailAsync(dto.Email);
    if (existingUser != null)
    {
        return Results.BadRequest("Email already exists.");
    }

    // 3. Create new user (calls database)
    var user = await userService.CreateUserAsync(dto.FullName, dto.Email, dto.Password);
    
    // 4. Return response to frontend
    return Results.Ok(new
    {
        Id = user.Id.ToString(),
        FullName = user.FullName,
        Email = user.Email,
        CreatedAt = user.CreatedAt
    });
});
```

**What happens:**
- Backend receives HTTP POST request
- Validates the data
- Calls UserService to interact with database
- Returns response to frontend

---

### Step 3: Database Operations (C# Service)
**Location:** `backend/Services/UserService.cs`

```csharp
public async Task<User?> CreateUserAsync(string fullName, string email, string password)
{
    // 1. Hash the password (security)
    var passwordHash = BCrypt.Net.BCrypt.HashPassword(password);

    // 2. SQL query to insert user
    const string sql = @"
        INSERT INTO Users (Id, FullName, Email, PasswordHash, CreatedAt, UpdatedAt)
        OUTPUT INSERTED.Id, INSERTED.FullName, INSERTED.Email, INSERTED.PasswordHash, INSERTED.CreatedAt, INSERTED.UpdatedAt
        VALUES (NEWID(), @FullName, @Email, @PasswordHash, GETDATE(), GETDATE())";

    // 3. Execute SQL query using Dapper
    var user = await _connection.QueryFirstOrDefaultAsync<User>(sql, new
    {
        FullName = fullName,
        Email = email,
        PasswordHash = passwordHash
    });

    return user;
}
```

**What happens:**
- Password is hashed (security)
- SQL INSERT query is prepared
- Query is executed against SQL Server database
- New user record is created
- User data is returned

---

### Step 4: SQL Database (SQL Server)
**Location:** SQL Server Database `InterviewAppDB`

```sql
-- SQL query executed by C# Dapper
INSERT INTO Users (Id, FullName, Email, PasswordHash, CreatedAt, UpdatedAt)
VALUES (NEWID(), 'SAMI', 'msamishahid5@gmail.com', '$2a$11$...hashed...', GETDATE(), GETDATE());
```

**What happens:**
- SQL Server receives the INSERT query
- Creates new row in `Users` table
- Generates unique ID (GUID)
- Stores user data
- Returns the inserted data

**Database Table Structure:**
```sql
Users Table:
├── Id (UNIQUEIDENTIFIER) - Primary Key
├── FullName (NVARCHAR) - "SAMI"
├── Email (NVARCHAR) - "msamishahid5@gmail.com"
├── PasswordHash (NVARCHAR) - "$2a$11$...hashed password..."
├── CreatedAt (DATETIME2) - "2025-12-16 17:39:24"
└── UpdatedAt (DATETIME2) - "2025-12-16 17:39:24"
```

---

### Step 5: Response Back to Frontend
**Flow:** Database → Backend → Frontend

```csharp
// Backend returns response
return Results.Ok(new
{
    Id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    FullName = "SAMI",
    Email = "msamishahid5@gmail.com",
    CreatedAt = "2025-12-16T17:39:24"
});
```

**Frontend receives:**
```typescript
const user = await res.json();
// user = {
//   Id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
//   FullName: "SAMI",
//   Email: "msamishahid5@gmail.com",
//   CreatedAt: "2025-12-16T17:39:24"
// }

// Store in localStorage
localStorage.setItem("userId", user.Id);
localStorage.setItem("userName", user.FullName);
localStorage.setItem("isAuthenticated", "true");

// Redirect to dashboard
router.push("/dashboard");
```

---

## 📁 File Locations

### SQL Files
- **Schema Definition:** `SQL_SCHEMA.md` - Documents database structure
- **SQL Queries:** Embedded in C# code (`backend/Services/UserService.cs`)
- **Database:** SQL Server - `InterviewAppDB` database

### .NET Backend Files
- **Main API:** `backend/Program.cs` - All API endpoints
- **Business Logic:** `backend/Services/UserService.cs` - Database operations
- **Data Models:** `backend/Models/` - DTOs and domain models
- **Configuration:** `backend/appsettings.json` - Connection strings

### React Frontend Files
- **Auth Form:** `frontend/components/auth/AuthForm.tsx` - Sign up/Sign in
- **Pages:** `app/(root)/dashboard/page.tsx` - Dashboard
- **API Calls:** Frontend makes HTTP requests to backend

---

## 🔄 Complete Request-Response Cycle

### Example: User Login

```
1. USER ACTION (Frontend)
   └─> User enters email & password
   └─> Clicks "Sign In"
   └─> Frontend sends: POST http://localhost:5216/auth/login

2. BACKEND RECEIVES (C#)
   └─> Program.cs receives request
   └─> Validates email & password
   └─> Calls: userService.AuthenticateUserAsync()

3. DATABASE QUERY (C# → SQL)
   └─> UserService.cs executes SQL:
       SELECT * FROM Users WHERE Email = @Email
   └─> Dapper sends query to SQL Server

4. DATABASE RETURNS (SQL → C#)
   └─> SQL Server finds user
   └─> Returns user data (including PasswordHash)

5. PASSWORD VERIFICATION (C#)
   └─> Backend compares password with hash
   └─> BCrypt.Verify(password, hash)

6. RESPONSE (C# → Frontend)
   └─> If valid: Returns user data (200 OK)
   └─> If invalid: Returns Unauthorized (401)

7. FRONTEND HANDLES (React)
   └─> If success: Store user info, redirect to dashboard
   └─> If error: Show error message
```

---

## 🔐 Security Flow

### Password Hashing

```
1. User enters: "sami123" (plain text)

2. Frontend sends to backend (still plain text)

3. Backend hashes password:
   BCrypt.HashPassword("sami123")
   → "$2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"

4. Backend stores hash in database:
   PasswordHash = "$2a$11$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"

5. When user logs in:
   - User enters: "sami123"
   - Backend gets hash from database
   - BCrypt.Verify("sami123", hash) → true/false
```

**Why hash?** Even if database is hacked, passwords are encrypted and can't be read.

---

## 📊 Data Flow Diagram

```
┌─────────────┐
│   Browser   │
│  (User UI)  │
└──────┬──────┘
       │
       │ 1. User fills form
       │ 2. Clicks button
       ▼
┌─────────────────────────┐
│   React Frontend        │
│   (TypeScript)          │
│   Port: 3001            │
│                         │
│   AuthForm.tsx          │
│   - Form validation     │
│   - HTTP request        │
└──────┬──────────────────┘
       │
       │ 3. HTTP POST
       │    http://localhost:5216/auth/register
       │    { fullName, email, password }
       ▼
┌─────────────────────────┐
│   .NET Backend          │
│   (C#)                  │
│   Port: 5216            │
│                         │
│   Program.cs            │
│   - Receives request    │
│   - Validates data      │
│   - Calls UserService   │
└──────┬──────────────────┘
       │
       │ 4. Method call
       │    userService.CreateUserAsync()
       ▼
┌─────────────────────────┐
│   UserService.cs        │
│   (C#)                  │
│                         │
│   - Hash password       │
│   - Prepare SQL query   │
│   - Execute via Dapper   │
└──────┬──────────────────┘
       │
       │ 5. SQL Query
       │    INSERT INTO Users...
       ▼
┌─────────────────────────┐
│   SQL Server            │
│   Database              │
│   InterviewAppDB        │
│                         │
│   Users Table           │
│   - Stores data         │
│   - Returns new user    │
└──────┬──────────────────┘
       │
       │ 6. User data returned
       │    { Id, FullName, Email, CreatedAt }
       │
       │ 7. Response flows back:
       │    SQL → UserService → Program.cs → Frontend
       │
       ▼
┌─────────────────────────┐
│   React Frontend        │
│                         │
│   - Receives response   │
│   - Stores in localStorage
│   - Redirects to dashboard
└─────────────────────────┘
```

---

## 🗂️ Where Each Language is Used

### SQL (Database Queries)
**Location:** Embedded in C# code
**File:** `backend/Services/UserService.cs`

```csharp
// SQL query inside C# code
const string sql = @"
    SELECT Id, FullName, Email, PasswordHash, CreatedAt, UpdatedAt
    FROM Users
    WHERE Email = @Email";
```

**Purpose:**
- Retrieve data from database
- Insert new records
- Update existing records
- Delete records

---

### C# (.NET Backend)
**Location:** `backend/` folder
**Files:**
- `Program.cs` - API endpoints
- `Services/UserService.cs` - Business logic
- `Models/` - Data structures

**Purpose:**
- Handle HTTP requests
- Validate data
- Process business logic
- Connect to database
- Return responses

---

### TypeScript/React (Frontend)
**Location:** `app/`, `frontend/`, `shared/` folders
**Files:**
- `frontend/components/auth/AuthForm.tsx` - Forms
- `app/(root)/dashboard/page.tsx` - Pages

**Purpose:**
- Display user interface
- Handle user input
- Send HTTP requests to backend
- Display responses
- Manage client-side state

---

## 🔗 How They Connect

### 1. Frontend → Backend
**Connection:** HTTP Requests
```typescript
// Frontend code
fetch("http://localhost:5216/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password })
});
```

### 2. Backend → Database
**Connection:** SQL Queries via Dapper
```csharp
// Backend code
var user = await _connection.QueryFirstOrDefaultAsync<User>(
    "SELECT * FROM Users WHERE Email = @Email",
    new { Email = email }
);
```

### 3. Database → Backend
**Connection:** SQL Results
```csharp
// Database returns data
// Backend receives User object with all fields
```

### 4. Backend → Frontend
**Connection:** HTTP Response
```csharp
// Backend code
return Results.Ok(new { Id, FullName, Email });
```

---

## 🎯 Key Technologies

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Database** | SQL Server | Store data permanently |
| **Backend** | ASP.NET Core (C#) | API server, business logic |
| **ORM** | Dapper | Execute SQL queries from C# |
| **Frontend** | React/Next.js (TypeScript) | User interface |
| **Security** | BCrypt | Hash passwords |
| **API Docs** | Swagger | Test endpoints |

---

## ✅ Summary

1. **SQL Database** - Stores all data (users, etc.)
2. **.NET Backend** - Processes requests, talks to database
3. **React Frontend** - User interface, sends requests

**Flow:**
```
User Action → Frontend → Backend → Database → Backend → Frontend → User Sees Result
```

**All 3 work together:**
- SQL stores data
- .NET processes logic
- React displays UI

---

**✅ This is how your entire system works!**

