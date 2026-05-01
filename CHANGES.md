# THEATRO Project — Change Log & Documentation

> All changes made to the `THEATRO_proj` repository during the March 28, 2026 development session.

---

## Table of Contents

1. [Repository Cleanup (Git)](#1-repository-cleanup-git)
2. [Docker Configuration](#2-docker-configuration)
3. [Backend Fixes](#3-backend-fixes)
4. [User Authentication System](#4-user-authentication-system)
5. [Frontend Updates](#5-frontend-updates)
6. [File Structure](#6-file-structure)

---

## 1. Repository Cleanup (Git)

### Problem
- The repository had no `.gitignore`, causing massive `node_modules/` folders (30,000+ files) and Visual Studio cache (`.vs/`) to be accidentally committed and tracked by Git.
- The `frontend/` directory had its own hidden `.git` folder, making it appear as a broken Git submodule instead of normal source files.
- This made pushing to GitHub impossible.

### Fix

#### Created `.gitignore`
**File:** `.gitignore`
```
node_modules/
.vs/
.env
build/
dist/
*.sqlite
*.db
*.log
.wsuo
```

#### Actions Taken
- Ran `git reset HEAD~1` to undo the bad commit containing `.vs/` files.
- Deleted the hidden `frontend/.git` folder so the React source integrates cleanly with the main repository.
- Force-pushed the clean history to GitHub: `git push origin master --force`

---

## 2. Docker Configuration

### Problem
- The original `docker-compose.yml` had two separate services (`backend` and `frontend`) requiring two builds.
- The backend Docker build always **crashed** because `msnodesqlv8` (a Windows-only native SQL driver) was listed as a required dependency, causing `npm install` to fail on the Linux Alpine container.
- The `docker-compose.yml` hardcoded database credentials and pointed to a nonexistent `"database"` hostname instead of reading from environment variables.
- The frontend `Dockerfile` only copied a static `index.html` — it never built the React app.

### Fix

#### Created `.dockerignore`
**File:** `.dockerignore`
```
node_modules
frontend/node_modules
backend/node_modules
.git
.vs
frontend/build
*.log
.env
```
This prevents `node_modules` from being sent to Docker during build, reducing build context from ~200MB to ~2MB.

#### Created Unified Root `Dockerfile`
**File:** `Dockerfile`

Replaces the two separate Dockerfiles with one multi-stage build:

| Stage | Base Image | What it does |
|---|---|---|
| `frontend-build` | `node:18-alpine` | Runs `npm install` + `npm run build` on the React app |
| `production` | `node:18-alpine` | Runs the Express backend, copies React `/build` into `/public` |

The Express server then serves both the API (`/api/*`) and the React frontend (`*`) from a single container on **port 5000**.

#### Updated `docker-compose.yml`
**File:** `docker-compose.yml`

Reduced from 2 services to **1 service**:

```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: theatro_app
    ports:
      - "5000:5000"
    environment:
      - DOCKER_ENV=true
      - DB_HOST=host.docker.internal
      - DB_USER=sa
      - DB_PASSWORD=YourStrong!Passw0rd
      - DB_NAME=TheatroDB
    extra_hosts:
      - "host.docker.internal:host-gateway"
    restart: unless-stopped
```

---

## 3. Backend Fixes

### `backend/package.json`
- Moved `msnodesqlv8` from `"dependencies"` → `"optionalDependencies"`.
- This tells `npm` on Linux/Docker to skip it gracefully if it fails to compile (since it requires Windows native binaries).

### `backend/db.js`
**Two critical bugs fixed:**

1. **Broken Docker detection:**
   ```js
   // Before (broken — would never detect Docker correctly)
   const isDocker = process.env.DOCKER_ENV === 'true' || process.env.DB_HOST === 'database';

   // After (fixed)
   const isDocker = process.env.DOCKER_ENV === 'true';
   ```

2. **Hardcoded connection string:**
   ```js
   // Before (hardcoded, ignored environment variables)
   config = { user: 'sa', password: 'YourStrong!Passw0rd', server: 'database', ... }

   // After (reads from docker-compose environment variables)
   config = {
       user: process.env.DB_USER || 'sa',
       password: process.env.DB_PASSWORD || 'YourStrong!Passw0rd',
       server: process.env.DB_HOST || 'host.docker.internal',
       database: process.env.DB_NAME || 'TheatroDB',
   }
   ```

3. **Safe optional require:**
   ```js
   let sql;
   try {
       sql = isDocker ? require('mssql') : require('mssql/msnodesqlv8');
   } catch (err) {
       sql = require('mssql'); // fallback gracefully
   }
   ```

### `backend/index.js`
- Imported and mounted the auth routes: `app.use('/api/auth', authRoutes)`
- Added `express.static('public')` to serve the compiled React build.
- Added a SPA catch-all so React Router works correctly:
  ```js
  app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
  ```
- Server now calls `initDb()` on startup to auto-create missing tables.

---

## 4. User Authentication System

A complete login/register system implemented without JWT — simple `localStorage` persistence.

### `backend/initDb.js` *(new)*
Auto-creates the `Users` table in `TheatroDB` on server startup:
```sql
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
BEGIN
    CREATE TABLE Users (
        id            INT IDENTITY(1,1) PRIMARY KEY,
        name          NVARCHAR(100) NOT NULL,
        email         NVARCHAR(100) UNIQUE NOT NULL,
        password_hash NVARCHAR(255) NOT NULL,
        created_at    DATETIME DEFAULT GETDATE()
    )
END
```

### `backend/routes/auth.js` *(new)*

| Endpoint | Method | Description |
|---|---|---|
| `/api/auth/register` | POST | Hashes password with **bcrypt**, inserts user, returns `{ user }` |
| `/api/auth/login` | POST | Verifies bcrypt hash, returns `{ user }` on success |

- Passwords are **never stored in plain text** — always hashed with `bcryptjs` (salt rounds: 10).
- Returns clear, descriptive error messages (e.g. "Email already registered", "Invalid email or password").

---

## 5. Frontend Updates

### `frontend/src/App.js`
- Added `react-router-dom` routing with 3 routes:
  - `/` — Home dashboard (protected — redirects to `/login` if not logged in)
  - `/login` — Login page
  - `/register` — Registration page
- Login state is **persisted in `localStorage`** under the key `theatro_user`.
- Header redesigned with a **user pill** showing the user's name initial (avatar), full name, and a "Sign Out" button.
- **Logout** clears `localStorage` and redirects to `/login` instantly.
- All API calls changed from hardcoded `http://localhost:5000/api/...` → relative `/api/...` so the app works correctly when served from within Docker.

### `frontend/src/pages/Login.js` *(new)*
- Modern **glassmorphism** card UI with animated floating gradient orbs in the background.
- Form with email + password fields.
- Inline error display with a CSS shake animation.
- Loading spinner on the submit button while the request is in flight.
- Link to the Register page.

### `frontend/src/pages/Register.js` *(new)*
- Same premium UI as Login.
- Fields: Full Name, Email, Password, Confirm Password.
- Client-side validation: password length ≥ 6, passwords must match.

### `frontend/src/pages/Auth.css` *(new)*
Shared CSS for Login and Register pages:
- Dark background (`#0a0a0f`)
- Animated floating `radial-gradient` orbs (`purple`, `pink`, `sky blue`)
- Glassmorphism card: `backdrop-filter: blur(24px)`, semi-transparent border
- Gradient THEATRO logo text
- Smooth input focus glow
- Purple → pink gradient submit button with hover lift effect
- CSS shake animation on error
- Button loading spinner

### `frontend/src/App.css`
- Updated to match the new sticky header layout.
- Added styles for `.header-top`, `.brand`, `.user-pill`, `.user-avatar`, `.logout-btn`.
- Improved movie cards with stronger hover lift effect.
- Added animated loader spinner replacing the plain text "Loading...".
- Improved empty-state with an emoji icon.

### `frontend/Dockerfile`
Replaced the broken static-only Dockerfile with a **proper multi-stage build** (now consolidated into the root `Dockerfile`):
- Stage 1: `npm install` + `npm run build` using Node
- Stage 2: Serve via Express (not nginx) as part of the unified container

---

## 6. File Structure

```
THEATRO_proj/
│
├── .gitignore                  ← NEW: prevents node_modules/.vs from being tracked
├── .dockerignore               ← NEW: prevents huge build context sent to Docker
├── Dockerfile                  ← NEW: unified multi-stage build (frontend + backend)
├── docker-compose.yml          ← MODIFIED: single 'app' service on port 5000
│
├── backend/
│   ├── index.js                ← MODIFIED: added static serving, auth routes, initDb
│   ├── db.js                   ← MODIFIED: fixed Docker detection + env var config
│   ├── package.json            ← MODIFIED: msnodesqlv8 moved to optionalDependencies
│   ├── initDb.js               ← NEW: auto-creates Users table on startup
│   ├── routes/
│   │   └── auth.js             ← NEW: /register and /login endpoints with bcrypt
│   └── middleware/
│       └── auth.js             ← NEW: JWT middleware (unused, scaffolded for future)
│
└── frontend/
    ├── Dockerfile              ← MODIFIED (now superseded by root Dockerfile)
    ├── src/
    │   ├── App.js              ← MODIFIED: React Router, protected routes, logout
    │   ├── App.css             ← MODIFIED: sticky header, user pill, improved cards
    │   └── pages/
    │       ├── Login.js        ← NEW: glassmorphism login page
    │       ├── Register.js     ← NEW: registration page with validation
    │       └── Auth.css        ← NEW: shared auth page styles
    └── package.json            ← MODIFIED: react-router-dom added
```

---

## How to Run

### With Docker (Recommended)
```bash
docker-compose up --build
```
Visit: **http://localhost:5000**

### Locally (Development)
```bash
# Terminal 1 — Backend
cd backend
node index.js

# Terminal 2 — Frontend  
cd frontend
npm start
```
Visit: **http://localhost:3000** (frontend dev server proxies to backend on 5000)

---

*Generated: March 28, 2026*
