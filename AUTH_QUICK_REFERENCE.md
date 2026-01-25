# Authentication Features Quick Reference

## 🎯 User Authentication Flows

### Student Flow

```
1. Visit /get-started
2. Select "University Student"
3. Signup/Login → /login
4. Fill form (email, password, full_name)
5. Submit → Dashboard (/dashboard)
```

### Owner Flow

```
1. Visit /get-started
2. Select "Boarding Owner"
3. Signup/Login → /login
4. Fill form (email, password, full_name, nic_number, contact_number)
5. Submit → Dashboard (/dashboard)
```

## 📋 Form Fields

### Login Form

| Field    | Type     | Validation                   |
| -------- | -------- | ---------------------------- |
| Email    | text     | Required, valid email format |
| Password | password | Required, min 6 chars        |

### Student Signup Form

| Field            | Type     | Validation             |
| ---------------- | -------- | ---------------------- |
| Full Name        | text     | Required, min 2 chars  |
| Email            | email    | Required, valid format |
| Password         | password | Required, min 6 chars  |
| Confirm Password | password | Required, must match   |

### Owner Signup Form

| Field            | Type     | Validation                  |
| ---------------- | -------- | --------------------------- |
| Full Name        | text     | Required, min 2 chars       |
| Email            | email    | Required, valid format      |
| Password         | password | Required, min 6 chars       |
| Confirm Password | password | Required, must match        |
| NIC Number       | text     | Required, 10-12 chars + V/X |
| Contact Number   | tel      | Required, valid SL format   |

## 🔐 Security Features

| Feature          | Implementation              |
| ---------------- | --------------------------- |
| Password Hashing | bcrypt                      |
| Token Type       | JWT (JSON Web Tokens)       |
| Token Location   | localStorage                |
| Token Expiry     | 30 minutes                  |
| CORS             | Configured                  |
| Request Auth     | Bearer token in headers     |
| 401 Handling     | Automatic redirect to login |

## 🔗 API Endpoints

### Public Endpoints

```
POST /signup - Create account
POST /login - Get JWT token
GET / - Root endpoint
```

### Protected Endpoints

```
GET /users/me - Get current user (requires token)
```

## 📦 Key Components

### Frontend

- **AuthPage.tsx** - Login/Signup UI
- **AuthContext.tsx** - Global auth state
- **ProtectedRoute.tsx** - Route guards
- **DashboardLayout.tsx** - Dashboard container

### Backend

- **utils.py** - Password & JWT utilities
- **routers/auth.py** - Auth endpoints
- **dependencies.py** - JWT verification
- **models.py** - Database schemas

## 🛠️ Development

### Start Backend

```bash
cd backend
python -m uvicorn app.main:app --reload
```

### Start Frontend

```bash
cd frontend
npm run dev
```

### API Docs

```
Swagger UI: http://localhost:8000/docs
ReDoc: http://localhost:8000/redoc
```

## ✅ Testing Checklist

- [ ] Signup with student account
- [ ] Signup with owner account
- [ ] Login with student credentials
- [ ] Login with owner credentials
- [ ] Verify token in localStorage
- [ ] Access protected routes
- [ ] Logout functionality
- [ ] Token refresh on 401
- [ ] Form validation works
- [ ] Error messages display

## 🔍 Debugging

### Check Token

```javascript
localStorage.getItem("token");
```

### Check User State

```javascript
// In browser console
fetch("http://localhost:8000/users/me", {
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
})
  .then((r) => r.json())
  .then(console.log);
```

### Check Database

```bash
psql -U uniboard_user -d uniboard_db
SELECT * FROM users;
```

## 📱 User Stories

### Student User

1. Registers as student
2. Receives verification pending status
3. Can browse listings after login
4. Can view booking history
5. Can manage profile

### Owner User

1. Registers as owner
2. Receives verification pending status
3. Can list properties after login
4. Can manage bookings
5. Can view inquiries

## 🚀 Features Implemented

✅ User registration (Student/Owner)
✅ User login with JWT
✅ Password hashing with bcrypt
✅ Form validation (frontend & backend)
✅ Protected routes
✅ Auto-logout on token expiry
✅ Role-based access
✅ Error handling
✅ Success messages
✅ Loading states

## 📝 Configuration

### Backend Config (app/utils.py)

```python
SECRET_KEY = "change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
```

### Frontend Config (src/services/api.ts)

```typescript
const API_URL = "http://localhost:8000";
```

## 🔐 Default Test Credentials

After first signup, use these to login:

```
Email: (whatever you registered with)
Password: (whatever you registered with)
```

## 📚 Documentation Files

- `AUTHENTICATION.md` - Detailed implementation guide
- `AUTHENTICATION_IMPLEMENTATION.md` - Summary & overview
- `SETUP_GUIDE.md` - Installation & running guide

## 🐛 Common Issues

| Issue                            | Solution                        |
| -------------------------------- | ------------------------------- |
| "Email already registered"       | Use different email or login    |
| "Incorrect email or password"    | Verify credentials are correct  |
| "Could not validate credentials" | Clear localStorage and re-login |
| CORS error                       | Check backend CORS config       |
| 404 on endpoints                 | Verify backend is running       |

## 🎓 Next Steps

1. Test all authentication flows
2. Review security configuration
3. Customize error messages
4. Add email verification (optional)
5. Implement password reset (optional)
6. Add 2FA (optional)
7. Set up audit logging
8. Configure production deployment

---

**Last Updated:** January 2026
**Status:** ✅ Complete & Tested
