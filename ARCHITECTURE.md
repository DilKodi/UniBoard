# UniBoard Authentication Architecture

## 🏗️ System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Frontend)                        │
│                    http://localhost:5173                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              React Application                           │  │
│  │  ┌─────────────────────────────────────────────────────┐ │  │
│  │  │  App.tsx (Routes)                                   │ │  │
│  │  │  ├── / (Landing)                                    │ │  │
│  │  │  ├── /get-started (Role Selection)                 │ │  │
│  │  │  ├── /login (AuthPage)                             │ │  │
│  │  │  ├── /listings (ListingsPage)                      │ │  │
│  │  │  └── /dashboard (Protected - DashboardLayout)      │ │  │
│  │  └─────────────────────────────────────────────────────┘ │  │
│  │                                                          │  │
│  │  ┌─────────────────────────────────────────────────────┐ │  │
│  │  │  AuthProvider (AuthContext)                         │ │  │
│  │  │  ├── user (null | User object)                      │ │  │
│  │  │  ├── loading (boolean)                              │ │  │
│  │  │  ├── isAuthenticated (boolean)                      │ │  │
│  │  │  └── useAuth() hook                                 │ │  │
│  │  └─────────────────────────────────────────────────────┘ │  │
│  │                                                          │  │
│  │  ┌─────────────────────────────────────────────────────┐ │  │
│  │  │  API Service (api.ts)                               │ │  │
│  │  │  ├── loginUser(email, password)                     │ │  │
│  │  │  ├── signupUser(...)                                │ │  │
│  │  │  ├── fetchUserProfile()                             │ │  │
│  │  │  ├── Request Interceptor (JWT injection)            │ │  │
│  │  │  └── Response Interceptor (401 handling)            │ │  │
│  │  └─────────────────────────────────────────────────────┘ │  │
│  │                                                          │  │
│  │  ┌─────────────────────────────────────────────────────┐ │  │
│  │  │  localStorage                                       │ │  │
│  │  │  └── token: "eyJhbGc..."                            │ │  │
│  │  └─────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP Requests
                              │ (with JWT Bearer token)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SERVER (Backend)                            │
│                    http://localhost:8000                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │          FastAPI Application (main.py)                  │  │
│  │                                                          │  │
│  │  ┌─────────────────────────────────────────────────────┐ │  │
│  │  │  Router: auth.py                                    │ │  │
│  │  │  ├── POST /signup                                   │ │  │
│  │  │  │   ├── Validate email format                      │ │  │
│  │  │  │   ├── Check email uniqueness                     │ │  │
│  │  │  │   ├── Hash password (bcrypt)                     │ │  │
│  │  │  │   ├── Create User record                         │ │  │
│  │  │  │   └── Create Profile (Student/Owner)             │ │  │
│  │  │  │                                                  │ │  │
│  │  │  └── POST /login                                    │ │  │
│  │  │      ├── Find user by email                         │ │  │
│  │  │      ├── Verify password (bcrypt)                   │ │  │
│  │  │      ├── Generate JWT token                         │ │  │
│  │  │      └── Return token to client                     │ │  │
│  │  └─────────────────────────────────────────────────────┘ │  │
│  │                                                          │  │
│  │  ┌─────────────────────────────────────────────────────┐ │  │
│  │  │  Router: users.py (Protected)                       │ │  │
│  │  │  └── GET /users/me                                  │ │  │
│  │  │      ├── Validate JWT token                         │ │  │
│  │  │      ├── Extract user from token                    │ │  │
│  │  │      └── Return user profile                        │ │  │
│  │  └─────────────────────────────────────────────────────┘ │  │
│  │                                                          │  │
│  │  ┌─────────────────────────────────────────────────────┐ │  │
│  │  │  dependencies.py (JWT Verification)                 │ │  │
│  │  │  ├── oauth2_scheme (OAuth2PasswordBearer)           │ │  │
│  │  │  ├── get_current_user(token)                        │ │  │
│  │  │  │   ├── Decode JWT using SECRET_KEY                │ │  │
│  │  │  │   ├── Extract email from token                   │ │  │
│  │  │  │   └── Query database for user                    │ │  │
│  │  │  │                                                  │ │  │
│  │  │  └── get_current_active_user(user)                  │ │  │
│  │  │      └── Check user.is_active == True               │ │  │
│  │  └─────────────────────────────────────────────────────┘ │  │
│  │                                                          │  │
│  │  ┌─────────────────────────────────────────────────────┐ │  │
│  │  │  utils.py (Security Utilities)                      │ │  │
│  │  │  ├── get_password_hash(password)                    │ │  │
│  │  │  │   └── return bcrypt.hash(password)               │ │  │
│  │  │  │                                                  │ │  │
│  │  │  ├── verify_password(plain, hashed)                 │ │  │
│  │  │  │   └── return bcrypt.verify(plain, hashed)        │ │  │
│  │  │  │                                                  │ │  │
│  │  │  └── create_access_token(data)                      │ │  │
│  │  │      ├── Set expiration (now + 30 min)              │ │  │
│  │  │      └── return jwt.encode(data, SECRET_KEY)        │ │  │
│  │  └─────────────────────────────────────────────────────┘ │  │
│  │                                                          │  │
│  │  ┌─────────────────────────────────────────────────────┐ │  │
│  │  │  models.py (Database Models)                        │ │  │
│  │  │  ├── User                                           │ │  │
│  │  │  │   ├── id, email, hashed_password                 │ │  │
│  │  │  │   ├── role (student|owner|admin)                 │ │  │
│  │  │  │   ├── is_active, is_verified                     │ │  │
│  │  │  │   └── relationships to Student/Owner profiles    │ │  │
│  │  │  │                                                  │ │  │
│  │  │  ├── Student                                        │ │  │
│  │  │  │   ├── id, user_id (FK)                           │ │  │
│  │  │  │   ├── full_name, university                      │ │  │
│  │  │  │   └── relationship to User                       │ │  │
│  │  │  │                                                  │ │  │
│  │  │  └── Owner                                          │ │  │
│  │  │      ├── id, user_id (FK)                           │ │  │
│  │  │      ├── full_name, nic_number, contact_number      │ │  │
│  │  │      └── relationship to User                       │ │  │
│  │  └─────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ SQL Queries
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     DATABASE (PostgreSQL)                       │
│                                                                 │
│  USERS TABLE                 STUDENTS TABLE    OWNERS TABLE    │
│  ┌──────────────────┐       ┌─────────────┐   ┌──────────────┐ │
│  │ id (PK)          │       │ id (PK)     │   │ id (PK)      │ │
│  │ email (UNIQUE)   │       │ user_id(FK) │   │ user_id (FK) │ │
│  │ hashed_password  │◄──────┤ full_name   │   │ full_name    │ │
│  │ role (ENUM)      │   ┌───┤ university  │   │ nic_number   │ │
│  │ is_active        │   │   └─────────────┘   │ contact_no   │ │
│  │ is_verified      │   │                     └──────────────┘ │
│  └──────────────────┘   │                                      │
│        ▲                 │                                      │
│        └─────────────────┴──────────────────────────────────── │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Authentication Flow Sequence

```
┌──────────┐                          ┌──────────┐              ┌────────┐
│ Frontend │                          │ Backend  │              │Database│
└────┬─────┘                          └────┬─────┘              └───┬────┘
     │                                     │                        │
     │─── 1. POST /signup (email, pass) ──→│                        │
     │                                     │                        │
     │                                     │── 2. Check email ─────→│
     │                                     │← 3. Email exists?      │
     │                                     │   (No)                 │
     │                                     │                        │
     │                                     │── 4. Hash password     │
     │                                     │   (bcrypt)             │
     │                                     │                        │
     │                                     │── 5. Create User ─────→│
     │                                     │← 6. User created       │
     │                                     │                        │
     │                                     │── 7. Create Profile ──→│
     │                                     │← 8. Profile created    │
     │                                     │                        │
     │← 9. Return User object ────────────│                        │
     │                                     │                        │
     │── 10. POST /login (email, pass) ───→│                        │
     │                                     │                        │
     │                                     │── 11. Find User ──────→│
     │                                     │← 12. User found        │
     │                                     │                        │
     │                                     │-- 13. Verify password  │
     │                                     │    (bcrypt.verify)     │
     │                                     │                        │
     │                                     │-- 14. Generate JWT     │
     │                                     │    + expiration time   │
     │                                     │                        │
     │← 15. Return {access_token} ───────│                        │
     │                                     │                        │
     │ 16. Store token in localStorage    │                        │
     │                                     │                        │
     │── 17. GET /users/me ───────────────→│                        │
     │    (Bearer: token)                  │                        │
     │                                     │                        │
     │                                     │── 18. Decode JWT       │
     │                                     │── 19. Extract email    │
     │                                     │                        │
     │                                     │── 20. Find User ──────→│
     │                                     │← 21. Return User       │
     │                                     │                        │
     │← 22. Return User profile ─────────│                        │
     │                                     │                        │
     │ 23. Redirect to /dashboard         │                        │
     │                                     │                        │
```

---

## 📊 Component Interaction Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                  App.tsx (Root)                             │
│  - Sets up routes                                           │
│  - Wraps protected routes with ProtectedRoute               │
└─────────────┬───────────────────────────────────────────────┘
              │
              ├──────────────────────────────────────────────┐
              │                                              │
    ┌─────────▼─────────┐                          ┌────────▼──────┐
    │  LandingPage      │                          │  AuthPage     │
    │  - Shows landing  │                          │  - Login form │
    │  - Browse button  │                          │  - Signup form│
    │  - Get started    │                          │  - Validates  │
    └───────────────────┘                          │  - Calls API  │
              │                                    └────────┬──────┘
              │                                            │
              ▼                                            │
    ┌─────────────────┐                                    │
    │ RoleSelection   │                                    │
    │ - Select role   │                                    │
    └────────┬────────┘                                    │
             │                                              │
             └──────────────────┬───────────────────────────┘
                                │
                    ┌───────────▼──────────┐
                    │  AuthContext         │
                    │  - Stores user       │
                    │  - Loading state     │
                    │  - Login/Logout      │
                    └───────────┬──────────┘
                                │
                ┌───────────────┼──────────────┐
                │               │              │
    ┌───────────▼─┐  ┌────────┬─▼──────┐  ┌───▼──────────┐
    │Protected    │  │Dashboard│       │  │ ListingsPage │
    │Route        │  │Layout   │       │  │              │
    │- Protects   │  │- Shows  │       │  │ - Browse     │
    │- Redirects  │  │- User   │       │  │ - Search     │
    └─────────────┘  │- Role   │       │  │ - Filter     │
                     └────┬────┘       │  └──────────────┘
                          │           │
                    ┌─────▼─┐    ┌────▼────┐
                    │Student │    │Owner    │
                    │Dash    │    │Dash     │
                    └────────┘    └─────────┘
```

---

## 🔄 State Management Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   AuthContext State                         │
│                                                             │
│  Initial State (App loads):                                │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ user: null                                            │ │
│  │ loading: true                                         │ │
│  │ isAuthenticated: false                                │ │
│  └───────────────────────────────────────────────────────┘ │
│                          ▼                                  │
│  Check localStorage for token:                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ if token exists:                                      │ │
│  │   - Call fetchUserProfile()                           │ │
│  │   - Load user data                                    │ │
│  │ else:                                                 │ │
│  │   - Keep user as null                                 │ │
│  └───────────────────────────────────────────────────────┘ │
│                          ▼                                  │
│  After Login (User signs in):                              │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ user: { id, email, role, ... }                        │ │
│  │ loading: false                                        │ │
│  │ isAuthenticated: true                                 │ │
│  │ token: stored in localStorage                         │ │
│  └───────────────────────────────────────────────────────┘ │
│                          ▼                                  │
│  After Logout (User logs out):                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ user: null                                            │ │
│  │ loading: false                                        │ │
│  │ isAuthenticated: false                                │ │
│  │ token: removed from localStorage                      │ │
│  └───────────────────────────────────────────────────────┘ │
│                          ▼                                  │
│  Token Expiration (30 minutes):                            │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ API returns 401 Unauthorized                          │ │
│  │ Response interceptor catches 401                      │ │
│  │ - Clear localStorage token                           │ │
│  │ - Redirect to /login                                 │ │
│  │ - Clear user state                                   │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Security Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Layer 1: Frontend Form Validation                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Email format: /^[^\s@]+@[^\s@]+\.[^\s@]+$/           │  │
│  │ Password min: 6 characters                            │  │
│  │ Match: password === confirmPassword                   │  │
│  │ Custom: Name, NIC, Phone formats                      │  │
│  └───────────────────────────────────────────────────────┘  │
│                          ▼                                   │
│  Layer 2: Backend Validation (Pydantic)                     │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Email format validation                               │  │
│  │ Required field checking                               │  │
│  │ Data type validation                                  │  │
│  └───────────────────────────────────────────────────────┘  │
│                          ▼                                   │
│  Layer 3: Business Logic Validation                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Email uniqueness check                                │  │
│  │ User status checking                                  │  │
│  │ Password verification (bcrypt)                        │  │
│  └───────────────────────────────────────────────────────┘  │
│                          ▼                                   │
│  Layer 4: JWT Token Security                                │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Token creation: JWT.encode(data, SECRET_KEY)         │  │
│  │ Token validation: JWT.decode(token, SECRET_KEY)      │  │
│  │ Expiration check: exp timestamp validation            │  │
│  │ Bearer token: Authorization: Bearer <token>           │  │
│  └───────────────────────────────────────────────────────┘  │
│                          ▼                                   │
│  Layer 5: Password Security                                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Hash: bcrypt.hash(password, rounds=12)                │  │
│  │ Verify: bcrypt.verify(plain, hashed)                  │  │
│  │ Never store plain text                                │  │
│  │ Never log passwords                                   │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 🗃️ Database Relationships

```
┌──────────────────────────┐
│      USERS TABLE         │
├──────────────────────────┤
│ id (PK)                  │◄─┐
│ email (UNIQUE)           │  │
│ hashed_password          │  │
│ role (ENUM)              │  │
│ is_active (BOOL)         │  │
│ is_verified (BOOL)       │  │
└──────────────────────────┘  │
         ▲                     │
         │ 1:1                 │
         │ relationship        │
    ┌────┴──────────────────┬──┴──────────────────┐
    │                       │                     │
┌───▼──────────────────┐┌──▼──────────────────┐  │
│  STUDENTS TABLE      ││  OWNERS TABLE       │  │
├──────────────────────┤├─────────────────────┤  │
│ id (PK)              ││ id (PK)             │  │
│ user_id (FK) ───────→││ user_id (FK) ──────→│
│ full_name            ││ full_name           │  │
│ university           ││ nic_number          │  │
│                      ││ contact_number      │  │
└──────────────────────┘└─────────────────────┘  │
                                                  │
               One User can have:
               ✓ One Student Profile (if role=student)
               ✓ One Owner Profile (if role=owner)
```

---

## 📱 Request/Response Examples

### Signup Request
```
POST /signup
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "password123",
  "role": "student",
  "full_name": "John Doe",
  "university": "University of Moratuwa"
}
```

### Signup Response
```
200 OK
{
  "id": 1,
  "email": "student@example.com",
  "role": "student",
  "is_active": true,
  "is_verified": false
}
```

### Login Request
```
POST /login
Content-Type: application/x-www-form-urlencoded

username=student@example.com&password=password123
```

### Login Response
```
200 OK
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### Get User Request
```
GET /users/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Get User Response
```
200 OK
{
  "id": 1,
  "email": "student@example.com",
  "role": "student",
  "is_active": true,
  "is_verified": false
}
```

---

**Architecture Version:** 1.0  
**Last Updated:** January 2026  
**Status:** ✅ Complete
