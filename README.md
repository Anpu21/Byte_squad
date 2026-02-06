# LedgerPro

LedgerPro is a modern, offline-first Desktop Accounting System built with Electron, React, and NestJS.

## Features

- **Offline-First**: Runs locally on your machine with SQLite
- **Modern UI**: Beautiful, responsive interface with Dark Mode
- **Secure**: Local data encryption and automatic backups
- **Production Ready**: Built with industry-standard tech stack
- **Cross-Platform**: Windows, macOS, and Linux support

## Tech Stack

- **Frontend**: Electron, React, TypeScript, Tailwind CSS
- **Backend**: NestJS, TypeORM, SQLite (Local), PostgreSQL (Cloud Sync)
- **DevOps**: Docker, GitHub Actions

## Prerequisites

- Node.js 20+
- Docker & Docker Compose (optional)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/ledgerpro.git
cd ledgerpro
```

### 2. Setup Backend

```bash
cd smartbiz-backend
npm install
npm run start:dev
```

### 3. Setup Frontend

```bash
cd smartbiz-frontend
npm install
npm run dev:electron
```

## Building for Production

To build the Windows installer (.exe):

```bash
cd smartbiz-frontend
npm run build
# Output: smartbiz-frontend/release/LedgerPro.exe
```

## Project Structure

```
ledgerpro/
├── smartbiz-backend/       # NestJS Backend API
│   ├── src/                # Source code
│   ├── test/               # E2E Tests
│   └── Dockerfile
│
├── smartbiz-frontend/      # Electron + React App
│   ├── electron/           # Main process code
│   ├── src/                # React UI code
│   └── package.json
│
└── docker-compose.yml      # Docker coordination
```