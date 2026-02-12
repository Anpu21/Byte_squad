# LedgerPro

> Desktop accounting & business management application built with **React + Electron** (frontend) and **NestJS** (backend).

---

## 📁 Project Structure

```
Byte_squad/
├── .github/
│   └── workflows/
│       └── ci.yml                  # GitHub Actions CI/CD pipeline
├── backend/                        # NestJS API server
│   ├── src/
│   │   ├── database/               # TypeORM config, seeds
│   │   ├── features/
│   │   │   └── auth/               # Auth module (controller, service, DTOs, guards)
│   │   │       ├── decorators/     # Custom decorators (Roles)
│   │   │       ├── dto/            # LoginDto, RegisterDto
│   │   │       ├── entities/       # User entity
│   │   │       ├── guards/         # JWT & Roles guards
│   │   │       ├── strategies/     # Passport JWT strategy
│   │   │       ├── auth.controller.spec.ts  # Unit tests
│   │   │       └── auth.service.spec.ts     # Unit tests
│   │   ├── shared/                 # Shared enums, routes, utilities
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── test/
│   │   ├── app.e2e-spec.ts         # E2E tests
│   │   └── jest-e2e.json
│   ├── Dockerfile                  # Multi-stage production build
│   ├── .dockerignore
│   ├── .env.example
│   ├── nest-cli.json
│   ├── package.json
│   └── tsconfig.json
├── frontend/                       # React + Electron desktop app
│   ├── electron/
│   │   ├── main.ts                 # Electron main process
│   │   └── preload.ts              # Preload script
│   ├── src/
│   │   ├── __mocks__/              # Jest mocks (file stubs)
│   │   ├── __tests__/              # App-level tests
│   │   ├── components/
│   │   │   ├── __tests__/          # Component tests
│   │   │   └── ProtectedRoute.tsx
│   │   ├── features/
│   │   │   ├── auth/               # Auth slice, API, pages
│   │   │   └── dashboard/          # Dashboard pages
│   │   ├── shared/                 # Shared utilities
│   │   ├── store/                  # Redux store
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── setupTests.ts          # Jest setup (jest-dom)
│   ├── electron-builder.json5      # Electron Builder config
│   ├── jest.config.ts              # Jest config (React)
│   ├── vite.config.ts              # Vite config (Electron)
│   ├── vite.web.config.ts          # Vite config (Web-only)
│   ├── package.json
│   └── tsconfig.json
├── docker-compose.yml              # Local development compose
├── package.json                    # Root convenience scripts
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20+ and **npm**
- **Docker** (optional, for containerized backend)
- **Git**

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd Byte_squad

# Install all dependencies (backend + frontend)
npm run install:all

# Or install individually:
cd backend && npm install
cd ../frontend && npm install
```

### Environment Setup

```bash
# Backend — copy and edit environment variables
cp backend/.env.example backend/.env
```

### Running in Development

```bash
# Start backend (watch mode)
npm run dev:backend

# Start frontend (Electron dev mode) — in another terminal
npm run dev:frontend
```

---

## 🧪 Testing

### Backend Tests

```bash
# Run unit tests
cd backend && npm test

# Run with coverage
npm run test:cov

# Run e2e tests
npm run test:e2e

# Watch mode
npm run test:watch
```

### Frontend Tests

```bash
# Run unit tests
cd frontend && npm test

# Run with coverage
npm run test:cov

# Watch mode
npm run test:watch
```

### Run All Tests (from root)

```bash
npm test
```

---

## 🔨 Building

### Build Backend

```bash
cd backend && npm run build
# Outputs to backend/dist/
```

### Build Frontend (Renderer only)

```bash
cd frontend && npm run build:renderer
# Outputs to frontend/dist/
```

### Build Desktop .exe Installer

```bash
cd frontend && npm run build:electron
# Or from root:
npm run build:exe
# Outputs to frontend/release/{version}/LedgerPro-Windows-{version}-Setup.exe
```

### Build Web Version

```bash
cd frontend && npm run build:web
```

---

## 🐳 Docker

### Build & Run with Docker Compose

```bash
# Build and start
docker-compose up --build

# Run in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Build Docker Image Manually

```bash
cd backend
docker build -t ledgerpro-backend .
docker run -p 4000:4000 -e JWT_SECRET=your_secret ledgerpro-backend
```

---

## 🔄 CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs automatically on:
- **Push** to `main`
- **Pull requests** to `main`

### Pipeline Jobs

| Job | Runner | What it does |
|-----|--------|-------------|
| `test-backend` | ubuntu-latest | Install → Lint → Unit tests → E2E tests |
| `test-frontend` | ubuntu-latest | Install → Lint → Unit tests |
| `build-and-package` | windows-latest | Build backend + frontend → Package .exe → Upload artifact |
| `docker` | ubuntu-latest | Build Docker image → Push to Docker Hub (main only) |

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `DOCKERHUB_USERNAME` | Your Docker Hub username |
| `DOCKERHUB_TOKEN` | Docker Hub access token |

---

## 📜 All Available Scripts

### Root (`package.json`)

| Script | Description |
|--------|-------------|
| `npm run dev:backend` | Start backend in watch mode |
| `npm run dev:frontend` | Start Electron in dev mode |
| `npm test` | Run all tests (backend + frontend) |
| `npm run build` | Build backend + frontend renderer |
| `npm run build:exe` | Build Electron .exe installer |
| `npm run lint` | Lint both projects |
| `npm run docker:up` | Start Docker services |
| `npm run docker:down` | Stop Docker services |
| `npm run install:all` | Install deps for both projects |

### Backend (`backend/package.json`)

| Script | Description |
|--------|-------------|
| `npm run start:dev` | Development server (watch) |
| `npm run start:prod` | Production server |
| `npm run build` | Compile TypeScript |
| `npm test` | Run unit tests |
| `npm run test:e2e` | Run e2e tests |
| `npm run test:cov` | Tests with coverage |
| `npm run lint` | ESLint |
| `npm run seed` | Seed admin user |

### Frontend (`frontend/package.json`)

| Script | Description |
|--------|-------------|
| `npm run dev` | Electron dev server |
| `npm run dev:web` | Web-only dev server |
| `npm run build:renderer` | Build Vite (renderer only) |
| `npm run build:electron` | Full .exe build |
| `npm run build:web` | Web-only production build |
| `npm test` | Run Jest tests |
| `npm run test:cov` | Tests with coverage |
| `npm run lint` | ESLint |

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite 5, TailwindCSS 4, Redux Toolkit |
| Desktop | Electron 30, electron-builder |
| Backend | NestJS 11, TypeORM, better-sqlite3 |
| Auth | Passport JWT, bcrypt, RBAC |
| Testing | Jest, React Testing Library, Supertest |
| CI/CD | GitHub Actions |
| Container | Docker (multi-stage Alpine) |

---

## 📝 License

UNLICENSED — Private project.
