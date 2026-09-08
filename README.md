# InterviewApp - AI-Powered Interview Preparation Platform

A modern interview preparation platform built with **ONLY 3 languages**:
- **C# (.NET)** - Backend API
- **TypeScript/React** - Frontend
- **SQL** - Database

## 🏗️ Architecture

```
Frontend (TypeScript/React/Next.js)
    ↓ HTTP Requests
Backend (.NET Core API)
    ↓ SQL Queries
Database (SQL Server)
```

## 📋 Prerequisites

- **.NET 8.0 SDK** - For backend
- **Node.js 18+** - For frontend
- **SQL Server** - Database
- **npm** or **yarn** - Package manager

## 🚀 Quick Start

### 1. Backend Setup (.NET)

```bash
cd backend
dotnet restore
dotnet run
```

Backend will run on `http://localhost:5216`

### 2. Frontend Setup (React/Next.js)

```bash
npm install
npm run dev
```

Frontend will run on `http://localhost:3001`

### 3. Database Setup

See `SQL_SCHEMA.md` for database schema and setup instructions.

## 📁 Project Structure

```
sami.AI/
├── backend/              ← Backend (C# ONLY - ALL .NET FILES)
├── app/                  ← Frontend (TypeScript ONLY)
├── frontend/             ← Frontend (TypeScript ONLY)
├── shared/               ← Frontend (TypeScript ONLY)
└── api/integrations/     ← Frontend (TypeScript ONLY)
```

## 🔧 Tech Stack

### Backend
- ASP.NET Core 8.0
- Dapper (ORM)
- BCrypt.Net (Password hashing)
- SQL Server

### Frontend
- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Vapi AI SDK

## 📚 Documentation

- `LANGUAGES_USED.md` - Detailed language breakdown
- `SQL_SCHEMA.md` - Database schema
- `backend/README.md` - Backend API documentation
- `PROJECT_CHANGES.md` - Before/After comparison
- `VERIFICATION_GUIDE.md` - How to verify project is running correctly

## 🔐 API Endpoints

- `POST /auth/register` - Register new user
- `POST /auth/login` - Authenticate user
- `GET /auth/profile/{userId}` - Get user profile
- `PUT /auth/profile/{userId}` - Update user profile
- `POST /auth/reset-password` - Reset password

See `http://localhost:5216/swagger` for full API documentation.

## 📝 License

This project is for educational purposes.

