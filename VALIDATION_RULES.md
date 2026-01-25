# Authentication Validation Rules & Workflows

## 📋 Form Validation Rules

### Email Validation

```
Pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
- Must contain @ symbol
- Must have text before @
- Must have domain after @
- No spaces allowed
- Example: user@example.com ✅
- Example: user@example ❌
- Example: user.example.com ❌
```

### Password Validation

```
Signup:
- Minimum 6 characters
- Must be confirmed (match confirmPassword)
- Examples:
  - "123456" ✅
  - "password123" ✅
  - "pass" ❌ (too short)
  - "password1" vs "password2" ❌ (don't match)

Login:
- Just required, no minimum length
- Minimum 6 characters
```

### Full Name Validation

```
- Required field
- Minimum 2 characters
- Maximum 100 characters
- Examples:
  - "John Doe" ✅
  - "A" ❌ (too short)
  - "Jo" ✅
```

### NIC Number Validation (Owner Only)

```
Pattern: /^[0-9]{10,12}[vVxX]?$/
- 10-12 digits
- Optional suffix: v, V, x, or X
- Examples:
  - "1234567890V" ✅
  - "123456789012" ✅
  - "123456789012V" ✅
  - "12345X" ❌ (too short)
  - "1234567890" ✅ (no suffix)
```

### Phone Number Validation (Owner Only)

```
Pattern: /^(\+94|0)?[0-9]{9}$/
- Optional: +94 (country code)
- Optional: 0 (leading zero)
- Must have 9 digits total
- Examples:
  - "0771234567" ✅ (Sri Lankan format)
  - "+94771234567" ✅ (International)
  - "771234567" ✅ (without leading 0)
  - "0771234" ❌ (too short)
  - "07712345678" ❌ (too long)
```

## 🔄 User Registration Flow

### Step 1: Role Selection

```
GET /get-started
- Display student/owner option
- User selects role
- Navigate to /login with role state
```

### Step 2: Signup Form Display

```
Show fields based on role:

STUDENT:
├── Full Name (required, 2+ chars)
├── Email (required, valid format)
├── Password (required, 6+ chars)
└── Confirm Password (required, must match)

OWNER:
├── Full Name (required, 2+ chars)
├── Email (required, valid format)
├── Password (required, 6+ chars)
├── Confirm Password (required, must match)
├── NIC Number (required, format: 10-12 digits + optional v/x)
└── Contact Number (required, format: valid phone)
```

### Step 3: Form Submission

```
1. Validate all fields client-side
2. If validation fails:
   - Display error message per field
   - Highlight error field
   - Stop submission
3. If validation passes:
   - Show loading state
   - Send POST /signup
   - Request payload:
     {
       "email": "user@example.com",
       "password": "password123",
       "role": "student|owner",
       "full_name": "John Doe",
       "university": "University of Moratuwa" (student only),
       "nic_number": "1234567890V" (owner only),
       "contact_number": "0771234567" (owner only)
     }
```

### Step 4: Backend Processing

```
POST /signup validation:
1. Check email not already registered
2. Validate all required fields
3. Hash password with bcrypt
4. Create User record:
   - email
   - hashed_password
   - role
   - is_active: true
   - is_verified: false
5. Create role-specific profile:
   - STUDENT: Student record with full_name, university
   - OWNER: Owner record with full_name, nic_number, contact_number
6. Return user object
```

### Step 5: Success Handling

```
1. Show success message: "Account created successfully! Switching to login..."
2. Reset form
3. Wait 2 seconds
4. Switch to login mode
5. User can now login
```

## 🔑 User Login Flow

### Step 1: Login Form Display

```
Show fields based on role:
├── Email (required, valid format)
└── Password (required, 6+ chars)
```

### Step 2: Form Submission

```
1. Validate required fields
2. If validation fails:
   - Display error message
   - Stop submission
3. If validation passes:
   - Show loading state
   - Send POST /login
   - Request payload (FormData):
     {
       "username": "user@example.com",  (email)
       "password": "password123"
     }
```

### Step 3: Backend Authentication

```
POST /login processing:
1. Find user by email
2. Verify password with bcrypt.verify()
3. If credentials invalid:
   - Return 401 with "Incorrect email or password"
   - Stop
4. If credentials valid:
   - Create JWT token:
     {
       "sub": "user@example.com",
       "role": "student|owner",
       "id": 123,
       "exp": datetime + 30 minutes
     }
   - Return:
     {
       "access_token": "eyJhbGc...",
       "token_type": "bearer"
     }
```

### Step 4: Frontend Token Handling

```
1. Receive access_token from response
2. Store in localStorage:
   localStorage.setItem('token', response.access_token)
3. Show success message: "Login successful! Redirecting..."
4. Wait 1 second
5. Redirect to /dashboard
```

### Step 5: Dashboard Load

```
1. ProtectedRoute checks authentication:
   - Read token from localStorage
   - If no token: redirect to /login
   - If token exists: continue
2. DashboardLayout loads:
   - Call GET /users/me
   - Include token: Authorization: Bearer <token>
   - Backend validates JWT
   - Return user profile
3. Display appropriate dashboard:
   - STUDENT: StudentDashboard
   - OWNER: OwnerDashboard
```

## 🚫 Error Handling

### Signup Errors

| Error                    | Cause                       | User Message                             |
| ------------------------ | --------------------------- | ---------------------------------------- |
| Email format invalid     | Email doesn't match pattern | "Invalid email address"                  |
| Email already registered | Email exists in database    | "Email already registered"               |
| Password too short       | Less than 6 characters      | "Password must be at least 6 characters" |
| Passwords don't match    | Password != confirmPassword | "Passwords do not match"                 |
| Full name too short      | Less than 2 characters      | "Name must be at least 2 characters"     |
| NIC format invalid       | Invalid format              | "Invalid NIC format"                     |
| Phone format invalid     | Invalid format              | "Invalid phone number format"            |
| Server error             | Backend error               | "Something went wrong"                   |

### Login Errors

| Error                | Cause                       | User Message                     |
| -------------------- | --------------------------- | -------------------------------- |
| Email format invalid | Email doesn't match pattern | "Invalid email address"          |
| Email not found      | User doesn't exist          | "Incorrect email or password"    |
| Password incorrect   | Password doesn't match      | "Incorrect email or password"    |
| User inactive        | User deactivated            | "User is inactive"               |
| Token expired        | JWT token expired           | Auto-redirect to /login          |
| Token invalid        | JWT malformed               | "Could not validate credentials" |
| Server error         | Backend error               | "Something went wrong"           |

## 🔐 Session Management

### Token Storage

```javascript
// Store token after login
localStorage.setItem("token", response.access_token);

// Retrieve token for API calls
const token = localStorage.getItem("token");

// Clear token on logout
localStorage.removeItem("token");
```

### Token Usage

```
All protected API requests include:
Authorization: Bearer <token>

Example request:
GET /users/me
Headers: {
  'Authorization': 'Bearer eyJhbGc...',
  'Content-Type': 'application/json'
}
```

### Token Expiration

```
Lifetime: 30 minutes
When expired:
1. Backend returns 401 Unauthorized
2. Response interceptor catches 401
3. Clear localStorage token
4. Redirect to /login
5. User needs to re-login
```

## 🔄 Validation Order

### Frontend Validation (Real-time)

```
On Blur:
1. Email field → Validate format
2. Password field → Validate length
3. Full Name → Validate length
4. NIC Number → Validate format
5. Contact → Validate format
6. Confirm Password → Check match

Result:
- If error: Show inline error message
- If valid: Clear error message
```

### Backend Validation

```
On Submit:
1. Parse request body
2. Validate email format (pydantic)
3. Check email uniqueness (database)
4. Validate password length
5. Validate required fields
6. Create records
7. Return result or error

Result:
- Success: Return user object with 200
- Error: Return error message with 400/409
```

## 📊 State Management Flow

### Before Login

```
AuthContext State:
{
  user: null,
  isAuthenticated: false,
  loading: false
}
```

### During Login

```
AuthContext State:
{
  user: null,
  isAuthenticated: false,
  loading: true  // Loading user
}
```

### After Login

```
AuthContext State:
{
  user: {
    id: 123,
    email: "user@example.com",
    role: "student",
    is_active: true,
    is_verified: false
  },
  isAuthenticated: true,
  loading: false
}
```

### After Logout

```
AuthContext State:
{
  user: null,
  isAuthenticated: false,
  loading: false
}
```

## 🧪 Test Scenarios

### Scenario 1: Valid Student Signup

```
Input:
- Full Name: John Student
- Email: john@example.com
- Password: password123
- Confirm: password123

Expected: ✅ Success → Switch to login
```

### Scenario 2: Email Already Registered

```
Input:
- Full Name: Another John
- Email: john@example.com (exists)
- Password: password123
- Confirm: password123

Expected: ❌ "Email already registered"
```

### Scenario 3: Password Mismatch

```
Input:
- Full Name: John Student
- Email: john2@example.com
- Password: password123
- Confirm: password456

Expected: ❌ "Passwords do not match"
```

### Scenario 4: Invalid Email Format

```
Input:
- Email: invalidemail

Expected: ❌ "Invalid email address"
```

### Scenario 5: Successful Login

```
Input:
- Email: john@example.com
- Password: password123

Expected: ✅ Redirect to /dashboard
```

### Scenario 6: Wrong Password

```
Input:
- Email: john@example.com
- Password: wrongpassword

Expected: ❌ "Incorrect email or password"
```

### Scenario 7: Access Protected Route Without Token

```
Action: Direct visit /dashboard without login

Expected: ❌ Redirect to /login
```

### Scenario 8: Token Expiration

```
Action: Wait 30+ minutes, then make API call

Expected: ❌ 401 error → Redirect to /login
```

---

**Last Updated:** January 2026
**Version:** 1.0
**Status:** Complete & Documented
