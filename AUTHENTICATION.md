# UniBoard Authentication Implementation Guide

## Overview

This document outlines the complete authentication feature implementation for UniBoard, including login, signup, and session management.

## Features Implemented

### 1. **Frontend Authentication**

#### Components

- **AuthPage.tsx** - Unified authentication page for login and signup
  - Role-based authentication (Student/Owner)
  - Form validation with error messages
  - Password confirmation for signup
  - Loading states and success messages
  - Responsive design

#### Services

- **api.ts** - Enhanced API service with authentication helpers
  - `loginUser(email, password)` - Login endpoint
  - `signupUser()` - Signup endpoint
  - JWT token interceptors for automatic header injection
  - Automatic token refresh on 401 responses
  - Error handling

#### State Management

- **AuthContext.tsx** - Global authentication context
  - Centralized user state management
  - `useAuth()` hook for component access
  - Automatic user loading on app startup
  - Logout functionality

#### Route Protection

- **ProtectedRoute.tsx** - Route guard component
  - Prevents unauthenticated access to dashboard
  - Role-based route protection (if needed)
  - Loading state handling
  - Automatic redirect to login

### 2. **Backend Authentication**

#### Security Features

- **JWT (JSON Web Tokens)** - Secure token-based authentication
- **Password Hashing** - bcrypt password hashing via passlib
- **Role-Based Access Control** - Student/Owner/Admin roles
- **CORS Configuration** - Properly configured for frontend communication

#### Backend Files

**utils.py** - Utility functions

```python
- verify_password() - Verify plain password against hash
- get_password_hash() - Hash a password using bcrypt
- create_access_token() - Generate JWT tokens with expiration
```

**routers/auth.py** - Authentication endpoints

```python
POST /signup - Create new user account
  - Email validation
  - Duplicate email prevention
  - Profile creation based on role (Student/Owner)
  - Returns user object

POST /login - User login
  - Email/password verification
  - JWT token generation
  - Token includes user ID, email, and role
  - Returns access token
```

**dependencies.py** - Dependency injection

```python
- oauth2_scheme - OAuth2 password bearer
- get_current_user() - Extract and validate JWT token
- get_current_active_user() - Verify user is active
```

**routers/users.py** - User endpoints (protected)

```python
GET /users/me - Get current user profile
  - Requires valid JWT token
  - Returns authenticated user details
```

### 3. **Form Validation**

#### Frontend Validation

- Email format validation
- Password minimum length (6 characters)
- Password confirmation matching
- NIC number format (for owners)
- Phone number format (for owners)
- Full name minimum length

#### Backend Validation

- Email uniqueness
- Required fields validation
- User profile creation

### 4. **Error Handling**

#### Frontend

- Display user-friendly error messages
- Validation error tooltips
- Network error handling
- Token expiration handling with automatic redirect

#### Backend

- HTTP status codes (400, 401, 500)
- Detailed error messages
- Database constraint violations

## User Flow

### Signup Flow

1. User clicks "Get Started"
2. Select role (Student/Owner)
3. Redirected to signup form
4. Fill in required fields:
   - Full Name
   - Email
   - Password
   - Confirm Password
   - (Owner only) NIC Number & Contact Number
5. Form validation on blur
6. Submit to `/signup` endpoint
7. Backend creates user and role-specific profile
8. Success message and switch to login form

### Login Flow

1. User enters email and password
2. Submit to `/login` endpoint
3. Backend validates credentials
4. JWT token generated and returned
5. Token stored in localStorage
6. Redirect to `/dashboard`
7. DashboardLayout loads user profile via `/users/me`
8. Display role-specific dashboard

### Logout Flow

1. User clicks logout button
2. Token removed from localStorage
3. Redirect to home page
4. AuthContext clears user state

## Security Considerations

### Implemented

- ✅ Password hashing with bcrypt
- ✅ JWT token-based authentication
- ✅ CORS configuration
- ✅ Token stored securely in localStorage (can be improved with httpOnly cookies)
- ✅ Automatic token injection in request headers
- ✅ 401 error handling for expired tokens

### Recommendations for Production

- Use httpOnly cookies instead of localStorage for token storage
- Implement refresh tokens for extended sessions
- Add rate limiting on auth endpoints
- Implement email verification for signups
- Add 2FA for enhanced security
- Use environment variables for SECRET_KEY
- Implement session management
- Add audit logging for authentication events

## Database Schema

### Users Table

```
- id (Primary Key)
- email (Unique)
- hashed_password
- role (ENUM: student, owner, admin)
- is_active (Boolean, default: True)
- is_verified (Boolean, default: False)
```

### Students Table

```
- id (Primary Key)
- user_id (Foreign Key → Users)
- full_name
- university
```

### Owners Table

```
- id (Primary Key)
- user_id (Foreign Key → Users)
- full_name
- nic_number
- contact_number
```

## Testing the Authentication

### Test Account Creation

1. Navigate to `http://localhost:5173/get-started`
2. Select "University Student"
3. Fill in signup form and submit
4. System should show success message

### Test Login

1. Navigate to `http://localhost:5173/login`
2. Select "University Student"
3. Enter test credentials
4. Should redirect to dashboard

### Test Protected Routes

1. Try accessing `/dashboard` without token
2. Should redirect to login

## Dependencies

### Frontend

- react-hook-form - Form validation
- lucide-react - Icons
- axios - HTTP client

### Backend

- fastapi - Web framework
- sqlalchemy - ORM
- pydantic - Data validation
- python-jose - JWT handling
- passlib - Password hashing
- psycopg2 - PostgreSQL adapter

## Environment Configuration

### Backend (.env or utils.py)

```
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
DATABASE_URL=postgresql://user:password@localhost/database
```

### Frontend (src/services/api.ts)

```
API_URL=http://localhost:8000
```

## Future Enhancements

1. **Email Verification**
   - Send verification email on signup
   - Verify email before allowing login

2. **Password Reset**
   - Implement forgot password flow
   - Email-based password reset tokens

3. **OAuth Integration**
   - Google Sign-In
   - GitHub Sign-In

4. **Two-Factor Authentication**
   - SMS-based 2FA
   - Authenticator app support

5. **Session Management**
   - Remember me functionality
   - Session timeout handling

6. **User Profile Management**
   - Edit profile information
   - Profile picture upload
   - Contact information management

## Troubleshooting

### "Incorrect email or password"

- Verify email and password are correct
- Check if user account exists
- Ensure backend database is running

### "Email already registered"

- User with this email already exists
- Use a different email or login with existing account

### "Could not validate credentials"

- JWT token is invalid or expired
- Token was removed from localStorage
- Clear localStorage and login again

### CORS errors

- Check if backend CORS configuration includes frontend URL
- Verify frontend and backend are running on correct ports
- Check browser console for detailed error

## Support

For issues or questions, contact the development team or check the project documentation.
