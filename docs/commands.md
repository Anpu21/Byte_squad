# Commands & dev workflow

> Loaded on demand from [`CLAUDE.md`](../CLAUDE.md).

## Per-package commands

Run from `frontend/` or `backend/` unless noted.

| Command | Purpose |
|---|---|
| `pnpm install --frozen-lockfile` | Install exactly what's in lockfile (CI behavior) |
| `pnpm run dev` (frontend) | Vite dev server on 5173 |
| `pnpm run start:dev` (backend) | NestJS in watch mode |
| `pnpm run build` | Production build (Vite / `nest build`) |
| `pnpm run lint` | ESLint with `--fix` |
| `pnpm run typecheck` (frontend) | `tsc --noEmit -p tsconfig.app.json` |
| `pnpm run test` (backend) | Jest (single pass) |
| `pnpm run test -- <pattern>` (backend) | Run a single test file/pattern |
| `pnpm run test` (frontend) | Vitest (single pass, jsdom + RTL) |
| `pnpm run test:watch` (frontend) | Vitest in watch mode |
| `pnpm run verify` | Full chain — typecheck (FE) · lint · test · build |
| `pnpm run seed:admin` (backend) | Manually run the admin seed |

## Whole stack via PM2

Config: `ecosystem.config.cjs`.

```bash
pm2 start ecosystem.config.cjs && pm2 save   # first time
pm2 start all / pm2 stop all / pm2 restart all
pm2 logs / pm2 status / pm2 monit
```

PM2 services: `byte_squad-frontend` (5173) and `byte_squad-backend` (3000). Postgres stays in Docker — `docker compose up postgres`. See `.claude/commands/pm2-*.md` for shorthand commands.

## Whole stack via Docker

Recommended for hand-off:

```bash
docker compose up -d --build       # first run
docker compose down -v             # reset Postgres volume + reseed on next up
docker compose logs -f backend
```

Frontend: http://localhost:5173 · Backend: http://localhost:3000 · Postgres: localhost:5432.

## CI

`.github/workflows/backend-ci.yml` (install · lint · test · build) and `frontend-ci.yml` (install · lint · typecheck · test · build). Both pin `pnpm@10.33.2` via `pnpm/action-setup@v4`.
