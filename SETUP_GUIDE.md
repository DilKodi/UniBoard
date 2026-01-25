# UniBoard Setup & Running Guide

## Prerequisites

- Python 3.8+
- Node.js 16+
- PostgreSQL 12+
- Git

## Backend Setup

### 1. Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Database Setup

Ensure PostgreSQL is running and create the database:

```bash
# Create database
createdb uniboard_db -U postgres

# Or use Docker Compose (includes PostgreSQL)
docker-compose up -d postgres
```

### 3. Create Database Tables

```bash
# Run migrations (if alembic is set up)
# Or manually execute models:
python -c "from app.database import Base, engine; Base.metadata.create_all(bind=engine)"
```

### 4. Update Configuration

Edit `app/utils.py` to update:

```python
SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
```

### 5. Run Backend Server

```bash
# Development mode with auto-reload
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Production mode
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Backend will be available at: `http://localhost:8000`
API documentation available at: `http://localhost:8000/docs`

## Frontend Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Update API URL (if needed)

Edit `src/services/api.ts`:

```typescript
const API_URL = "http://localhost:8000";
```

### 3. Run Development Server

```bash
npm run dev
```

Frontend will be available at: `http://localhost:5173`

## Docker Setup (Alternative)

### Start All Services

```bash
# From project root directory
docker-compose up -d
```

This will start:

- PostgreSQL database (port 5432)
- Backend API (port 8000)
- Frontend development server (port 5173)

### Stop Services

```bash
docker-compose down
```

## First Time Setup Checklist

- [ ] Python 3.8+ installed
- [ ] Node.js 16+ installed
- [ ] PostgreSQL running
- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] Database tables created
- [ ] Backend running on port 8000
- [ ] Frontend running on port 5173
- [ ] CORS configured correctly

## Testing Authentication

### 1. Create Student Account

```
URL: http://localhost:5173/get-started
1. Click "University Student"
2. Email: student@test.com
3. Password: password123
4. Confirm: password123
5. Full Name: Test Student
6. Click "Create Account"
```

### 2. Login

```
URL: http://localhost:5173/login
1. Select Student role
2. Email: student@test.com
3. Password: password123
4. Click "Sign In"
5. Should redirect to dashboard
```

### 3. Create Owner Account

```
URL: http://localhost:5173/get-started
1. Click "Boarding Owner"
2. Email: owner@test.com
3. Password: password123
4. Confirm: password123
5. Full Name: Test Owner
6. NIC: 1234567890V
7. Contact: 0771234567
8. Click "Create Account"
```

### 4. Test API Endpoints (using Postman or curl)

**Signup:**

```bash
curl -X POST http://localhost:8000/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "role": "student",
    "full_name": "Test User",
    "university": "University of Moratuwa"
  }'
```

**Login:**

```bash
curl -X POST http://localhost:8000/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=test@example.com&password=password123"
```

**Get Current User:**

```bash
curl -X GET http://localhost:8000/users/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Project Structure

```
UniBoard/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              (FastAPI app setup)
│   │   ├── database.py          (Database connection)
│   │   ├── models.py            (SQLAlchemy models)
│   │   ├── schemas.py           (Pydantic schemas)
│   │   ├── utils.py             (Security utilities)
│   │   ├── dependencies.py      (JWT verification)
│   │   └── routers/
│   │       ├── auth.py          (Auth endpoints)
│   │       └── users.py         (User endpoints)
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx
│   │   │   ├── AuthPage.tsx
│   │   │   ├── ListingsPage.tsx
│   │   │   ├── RoleSelection.tsx
│   │   │   ├── StudentDashboard.tsx
│   │   │   └── OwnerDashboard.tsx
│   │   ├── components/
│   │   │   ├── Footer.tsx
│   │   │   ├── DashboardLayout.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── docker-compose.yml
├── AUTHENTICATION.md
└── README.md
```

## Environment Variables

### Backend (.env or app/utils.py)

```
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
DATABASE_URL=postgresql://uniboard_user:uniboard_password@localhost/uniboard_db
```

### Frontend (.env or src/services/api.ts)

```
VITE_API_URL=http://localhost:8000
```

## Common Issues & Solutions

### Issue: Backend won't start

**Solution:**

1. Check if port 8000 is in use: `lsof -i :8000`
2. Check database connection: `psql -U uniboard_user -d uniboard_db`
3. Check dependencies: `pip list | grep fastapi`

### Issue: Frontend won't connect to backend

**Solution:**

1. Verify backend is running: Visit `http://localhost:8000/docs`
2. Check CORS configuration in `app/main.py`
3. Verify API URL in `src/services/api.ts`
4. Check browser console for error messages

### Issue: Database tables not created

**Solution:**

```bash
# Manually create tables
cd backend
python -c "from app.database import Base, engine; from app import models; Base.metadata.create_all(bind=engine)"
```

### Issue: Login returns 401 Unauthorized

**Solution:**

1. Verify email exists in database
2. Check password is correct
3. Ensure user is active in database
4. Check JWT secret key matches between sessions

### Issue: Token not persisting

**Solution:**

1. Clear browser localStorage: `localStorage.clear()`
2. Check if token is being saved: `localStorage.getItem('token')`
3. Verify browser allows localStorage
4. Check for mixed content warnings

## Development Tips

### Hot Reloading

- **Backend:** Automatically reloads when files change (with `--reload`)
- **Frontend:** Automatically reloads when files change (with `npm run dev`)

### API Documentation

- Access Swagger UI: `http://localhost:8000/docs`
- Access ReDoc: `http://localhost:8000/redoc`

### Database Inspection

```bash
# Connect to database
psql -U uniboard_user -d uniboard_db

# Common queries
\dt                          # List tables
SELECT * FROM users;        # View users
SELECT * FROM students;     # View student profiles
SELECT * FROM owners;       # View owner profiles
```

### Browser DevTools

- **Console:** Check for JavaScript errors
- **Network:** Inspect API requests and responses
- **Storage:** View localStorage and cookies
- **Application:** Debug React components

## Production Deployment

### Backend Deployment

1. Update `SECRET_KEY` with a secure random value
2. Use environment variables for configuration
3. Set `DEBUG=False`
4. Use Gunicorn or similar ASGI server
5. Configure proper database connection string
6. Set up SSL/HTTPS
7. Configure proper CORS origins

### Frontend Deployment

1. Build production bundle: `npm run build`
2. Deploy `dist/` folder to web server
3. Configure API URL for production
4. Set up proper error tracking
5. Configure analytics
6. Set up SSL/HTTPS

## Support & Documentation

- See `AUTHENTICATION.md` for authentication details
- See `AUTHENTICATION_IMPLEMENTATION.md` for implementation summary
- See `README.md` for project overview

## Quick Start Commands

```bash
# Backend
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload

# Frontend (in new terminal)
cd frontend
npm install
npm run dev

# With Docker
docker-compose up -d
```

Then visit: `http://localhost:5173`
