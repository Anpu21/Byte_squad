# 🐳 LedgerPro — Docker Guide

## Quick Start (Development)

```bash
# 1. Fill in your Supabase credentials
cp .env.development .env.development  # edit with real values

# 2. Start everything
docker compose up --build

# 3. Access
# Frontend: http://localhost:5173
# Backend:  http://localhost:3000
```

---

## Project Structure

```
Byte_squad/
├── frontend/
│   ├── Dockerfile          # Multi-stage (dev + prod)
│   ├── nginx.conf          # Production SPA server
│   ├── .dockerignore
│   └── src/
├── backend/
│   ├── Dockerfile          # Multi-stage (dev + prod)
│   ├── .dockerignore
│   └── src/
├── docker-compose.yml      # Development only
├── .env.development        # Dev environment vars
├── .env.production         # Prod template (never real secrets)
└── DOCKER.md               # This file
```

---

## Docker Commands

| Command | Purpose |
|---|---|
| `docker compose up --build` | Start dev (first time or after dependency changes) |
| `docker compose up` | Start dev (dependencies unchanged) |
| `docker compose down` | Stop all containers |
| `docker compose logs -f backend` | Tail backend logs |
| `docker compose exec backend sh` | Shell into backend container |

### Production Builds

```bash
# Build frontend production image
docker build -t ledgerpro-frontend \
  --target production \
  --build-arg VITE_API_URL=https://api.example.com/api/v1 \
  --build-arg VITE_SUPABASE_URL=https://xxx.supabase.co \
  --build-arg VITE_SUPABASE_ANON_KEY=eyJ... \
  frontend/

# Build backend production image
docker build -t ledgerpro-backend \
  --target production \
  backend/

# Run production backend
docker run -d -p 3000:3000 --env-file .env.production ledgerpro-backend
```

---

## Dockerfile Stages

### Frontend (`frontend/Dockerfile`)

| Stage | Target | Base | Purpose |
|---|---|---|---|
| 1 | `development` | node:22-alpine | Vite dev server with hot-reload |
| 2 | `build` | node:22-alpine | Compiles Vite app, accepts `VITE_*` build args |
| 3 | `production` | nginx:1.27-alpine | Serves static files via Nginx (~25MB image) |

### Backend (`backend/Dockerfile`)

| Stage | Target | Base | Purpose |
|---|---|---|---|
| 1 | `development` | node:22-alpine | NestJS watch mode with hot-reload |
| 2 | `build` | node:22-alpine | Compiles TypeScript, prunes devDependencies |
| 3 | `production` | node:22-alpine | Runs compiled JS as non-root user (~150MB image) |

---

## Deployment

### Frontend Deployment

**Option A: Vercel / Netlify (Recommended)**
1. Connect your Git repo
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Add environment variables in dashboard:
   - `VITE_API_URL` → your backend URL
   - `VITE_SUPABASE_URL` → your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` → your Supabase anon key

**Option B: VPS with Docker**
```bash
docker build -t ledgerpro-frontend --target production \
  --build-arg VITE_API_URL=https://api.example.com/api/v1 \
  --build-arg VITE_SUPABASE_URL=https://xxx.supabase.co \
  --build-arg VITE_SUPABASE_ANON_KEY=eyJ... \
  frontend/
docker run -d -p 80:80 ledgerpro-frontend
```

### Backend Deployment

**Option A: Railway / Render (Recommended)**
1. Connect your Git repo, set root directory to `backend/`
2. Set build command: `npm run build`
3. Set start command: `node -r ./tsconfig-paths-bootstrap.js dist/src/main.js`
4. Add all environment variables from `.env.production` in dashboard

**Option B: VPS with Docker**
```bash
docker build -t ledgerpro-backend --target production backend/
docker run -d -p 3000:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -e DB_HOST=xxx.supabase.co \
  -e DB_PASSWORD=your-db-password \
  -e JWT_SECRET=your-jwt-secret \
  # ... other env vars
  ledgerpro-backend
```

---

## Environment Variables

### How They Differ Between Dev & Prod

| Variable | Docker Dev | Cloud Prod |
|---|---|---|
| `NODE_ENV` | `development` | `production` |
| `CORS_ORIGIN` | `http://localhost:5173` | `https://your-domain.com` |
| `DB_SYNC` | `true` | `false` (⚠️ NEVER true in prod) |
| `DB_LOGGING` | `true` | `false` |
| `JWT_SECRET` | dev placeholder | strong random string |
| `VITE_API_URL` | `http://localhost:3000/api/v1` | `https://api.your-domain.com/api/v1` |

### Vite Variables (Special Handling)

Vite bakes `VITE_*` variables **at compile time**, not runtime. This means:
- In **development**: Vite reads them from the environment (via docker-compose `env_file`)
- In **production Docker**: Pass them as `--build-arg` during `docker build`
- In **Vercel/Netlify**: Set them in the platform dashboard

---

## Security

### ⚠️ Service Role Key Must NEVER Be on the Frontend

| Key | Where | Why |
|---|---|---|
| `SUPABASE_ANON_KEY` | Frontend (public) | Safe — respects RLS policies, limited access |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend only (secret) | **Bypasses ALL RLS** — full database admin access |

If the service role key is exposed to the frontend:
- Anyone can read/write/delete ALL data in your database
- They can bypass all row-level security policies
- Your entire database is compromised

### Secret Protection Checklist

- ✅ `.env*` files are in `.gitignore` — never committed
- ✅ `SUPABASE_SERVICE_ROLE_KEY` only in backend env, never prefixed with `VITE_`
- ✅ Docker env vars injected via `env_file` or `-e`, never in Dockerfiles
- ✅ Production backend runs as non-root user
- ✅ Nginx adds security headers (X-Frame-Options, X-Content-Type-Options)
- ✅ Production env template has empty secret values

---

## Best Practices Checklist

- [x] Multi-stage Docker builds for minimal image size
- [x] `.dockerignore` files to keep build context lean
- [x] Development hot-reload via volume mounts (source only, not node_modules)
- [x] Non-root user in production backend container
- [x] Environment variables via `env_file`, never hardcoded in Dockerfiles
- [x] `DB_SYNC=false` in production (prevents schema wipes)
- [x] Separate frontend and backend — independently deployable
- [x] Nginx with gzip, caching, SPA routing, and security headers
- [x] No database container (Supabase cloud = managed, backed up, scaled)
- [x] Docker Compose for development only (not production)
