# Darukaa.Earth

> Geospatial environmental intelligence platform for managing carbon and biodiversity projects.

---

## Project Overview

Darukaa.Earth is a full-stack geospatial platform that enables organizations to manage, monitor, and report on environmental projects — including carbon sequestration sites and biodiversity conservation areas.

Administrators can authenticate, create and manage project portfolios, draw site polygons,
inspect PostGIS-backed geometries, and explore synthetic demonstration analytics over time.

---

## Architecture

```
React Frontend (Vite + TypeScript)
        ↓ REST API (Axios)
FastAPI Backend (Python)
        ↓ Service Layer
Service Layer (business logic)
        ↓ Repository Layer
Repository Layer (data access)
        ↓ SQLAlchemy ORM
PostgreSQL + PostGIS
```

**Separation of concerns:**
| Layer | Location | Responsibility |
|-------|----------|----------------|
| Routes | `app/api/routes/` | HTTP I/O, request validation, response shaping |
| Schemas | `app/schemas/` | Pydantic request/response models |
| Services | `app/services/` | Business logic (no HTTP concerns) |
| Repositories | `app/repositories/` | DB queries only (no business logic) |
| Models | `app/models/` | SQLAlchemy ORM table definitions |
| Config | `app/core/config.py` | Environment-based settings |
| DB | `app/db/` | Engine, session factory, base class |

---

## Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19 | UI framework |
| Vite | 8 | Build tool + dev server |
| TypeScript | 6 | Type safety |
| React Router | 7 | Client-side routing |
| Axios | **1.20.0** (pinned) | HTTP client |
| Tailwind CSS | 3 | Utility-first styling |
| Chart.js / react-chartjs-2 | 4 / 5 | Data visualization |
| Mapbox GL JS | 3 | Interactive geospatial maps |
| Vitest | 4.1.11+ | Unit testing |
| React Testing Library | 16 | Component testing |
| ESLint | 8 | Linting |
| Prettier | 3 | Formatting |

> **Security note:** `axios@1.20.0` is pinned. Versions `1.14.1` and `0.30.4` were compromised in a supply chain attack (March 2026, GHSA) and contained a Remote Access Trojan. `1.20.0` is the current safe release.

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.12 | Runtime |
| FastAPI | 0.115+ | Web framework |
| SQLAlchemy | 2.0 | ORM (synchronous) |
| Alembic | 1.13+ | Database migrations |
| Pydantic v2 | 2.8+ | Validation & settings |
| pydantic-settings | 2.5+ | Env-based configuration |
| psycopg2-binary | 2.9+ | PostgreSQL driver |
| GeoAlchemy2 | 0.15+ | PostGIS spatial types |
| python-jose | 3.3+ | JWT authentication |
| passlib[bcrypt] | 1.7+ | Password hashing |
| Ruff | 0.6+ | Linting + formatting |
| pytest | 8+ | Testing |

### Infrastructure
| Component | Technology |
|-----------|-----------|
| Database | PostgreSQL 16 + PostGIS 3.4 |
| Containerization | Docker Compose (DB only in dev) |
| CI | GitHub Actions |
| Pre-commit hooks | Husky + lint-staged |

---

## Repository Structure

```
darukaa-earth/
├── .github/
│   └── workflows/
│       └── ci.yml              # CI: lint + test + build (frontend & backend)
├── .husky/
│   └── pre-commit              # Runs lint-staged on commit
├── frontend/                   # React + Vite + TypeScript application
│   ├── src/
│   │   ├── assets/
│   │   ├── components/         # Reusable UI components
│   │   ├── context/
│   │   │   └── AuthContext.tsx # Authentication state and protected-route support
│   │   ├── hooks/              # Custom React hooks
│   │   ├── layouts/
│   │   │   └── AppLayout.tsx   # App shell with sidebar
│   │   ├── pages/              # Route-level page components
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── ProjectsPage.tsx
│   │   │   ├── ProjectDetailPage.tsx
│   │   │   ├── MapPage.tsx
│   │   │   └── SiteDetailPage.tsx
│   │   ├── services/
│   │   │   └── api.ts          # Axios instance
│   │   ├── tests/
│   │   │   ├── setup.ts        # Vitest global setup
│   │   │   └── App.test.tsx    # Route smoke tests
│   │   ├── types/
│   │   │   └── index.ts        # Shared TypeScript types
│   │   ├── utils/
│   │   ├── App.tsx             # Route configuration
│   │   ├── index.css           # Global styles (Tailwind)
│   │   └── main.tsx            # Entry point
│   ├── .eslintrc.cjs
│   ├── .prettierrc
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
├── backend/                    # FastAPI + SQLAlchemy application
│   ├── alembic/                # Database migrations
│   │   ├── versions/
│   │   ├── env.py
│   │   └── script.py.mako
│   ├── app/
│   │   ├── api/
│   │   │   └── routes/
│   │   │       └── health.py   # GET /api/v1/health (implemented)
│   │   ├── core/
│   │   │   ├── config.py       # Settings (pydantic-settings)
│   │   │   └── security.py     # Password hashing and JWT utilities
│   │   ├── db/
│   │   │   ├── base.py         # SQLAlchemy declarative base
│   │   │   └── database.py     # Engine + session factory
│   │   ├── models/
│   │   │   ├── user.py         # User ORM model
│   │   │   └── project.py      # Project ORM model
│   │   ├── repositories/       # Data access layer
│   │   ├── schemas/
│   │   │   ├── health.py       # HealthResponse
│   │   │   └── user.py         # User request/response schemas
│   │   └── services/           # Business logic layer
│   ├── tests/
│   │   └── test_health.py      # Health endpoint tests
│   ├── alembic.ini
│   ├── main.py                 # FastAPI app factory
│   ├── pyproject.toml          # Ruff + pytest config
│   ├── requirements.txt
│   └── requirements-dev.txt
├── .env.example                # Environment variable reference (safe to commit)
├── .gitignore
├── .lintstagedrc.json          # lint-staged config (TS → ESLint+Prettier, py → Ruff)
├── docker-compose.yml          # PostgreSQL + PostGIS for local dev
├── package.json                # Root (Husky + lint-staged only)
└── README.md
```

---

## Local Setup

### Prerequisites
- **Node.js** 20+
- **Python** 3.12+
- **Docker** (for local database)

### 1. Clone

```bash
git clone <repository-url>
cd darukaa-earth
```

### 2. Environment variables

```bash
cp .env.example .env
# Edit .env — at minimum set a real JWT_SECRET_KEY
```

### 3. Start the database

```bash
docker compose up -d
# Waits for healthy: docker compose ps
```

### 4. Frontend setup

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

### 5. Backend setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt -r requirements-dev.txt

# Run database migrations (requires running DB)
alembic upgrade head

uvicorn main:app --reload
# → http://localhost:8000
# → http://localhost:8000/docs  (OpenAPI)
```

---

## Environment Variables

See [`.env.example`](./.env.example) for the full reference.

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_BASE_URL` | Frontend | Backend API base URL |
| `VITE_MAPBOX_TOKEN` | Frontend | Mapbox public token |
| `DATABASE_URL` | Backend | PostgreSQL connection string |
| `JWT_SECRET_KEY` | Backend | Secret for JWT signing (use a long random string) |
| `JWT_ALGORITHM` | Backend | Algorithm (default: `HS256`) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Backend | Token expiry (default: `30`) |
| `CORS_ORIGINS` | Backend | JSON array of allowed origins |

---

## Development Commands

### Frontend

```bash
cd frontend
npm run dev          # Start dev server (http://localhost:5173)
npm run lint         # ESLint check
npm run lint:fix     # ESLint auto-fix
npm run format       # Prettier write
npm run format:check # Prettier check (CI)
npm run test         # Vitest run (single pass)
npm run test:watch   # Vitest watch mode
npm run build        # Production build
```

### Backend

```bash
cd backend
source .venv/bin/activate

uvicorn main:app --reload            # Dev server with auto-reload
ruff check .                         # Lint
ruff format .                        # Format
pytest tests/ -v                     # Run tests
alembic revision --autogenerate -m "description"  # Generate migration
alembic upgrade head                 # Apply migrations
alembic downgrade -1                 # Rollback last migration
```

### Docker

```bash
docker compose up -d       # Start DB
docker compose down        # Stop DB (data persists)
docker compose down -v     # Stop DB + wipe data
```

---

## Testing

### Frontend (Vitest + React Testing Library)

```bash
cd frontend && npm run test
```

Current tests:
- `src/tests/App.test.tsx` — Route smoke tests (5 routes verified)

### Backend (pytest)

```bash
cd backend && pytest tests/ -v
```

Current tests:
- `tests/test_health.py` — Health endpoint (status code, body, content-type)

### CI

GitHub Actions runs on pushes and pull requests targeting `main`. The frontend job runs
Prettier, ESLint, TypeScript, Vitest, and a Vite production build with a non-secret
Mapbox placeholder. The backend job runs Ruff and pytest against PostgreSQL 16 with
PostGIS 3.4.

After CI succeeds for a commit on `main`, the **Deploy after CI** workflow triggers the
production Render and Vercel deploy hooks. The hook URLs are stored only as GitHub
Actions secrets (`RENDER_DEPLOY_HOOK_URL` and `VERCEL_DEPLOY_HOOK_URL`), never in the
repository. Do not enable direct push-based auto-deploys in Render or Vercel when this
gate is active.

---

## Local Database Setup (PostgreSQL + PostGIS)

Darukaa.Earth requires a local PostgreSQL instance with the PostGIS extension installed.

#### 1. Start Database Services
Ensure your PostgreSQL server is running. For Homebrew on macOS:
```bash
brew services start postgresql@17
```

#### 2. Provision Databases & Extensions
Use the provided script to set up the `darukaa` and `darukaa_test` databases and enable PostGIS:
```bash
./setup_local_db.sh
```

#### 3. Run Migrations
Apply the Alembic migrations to build the schema:
```bash
alembic upgrade head
```

#### 4. Seed Demonstration Data
To populate the database with a reproducible, India-focused demonstration dataset (including synthetic analytics):
```bash
python scripts/seed_demo_data.py
```
> **Note**: This dataset uses curated, demonstration geometries inspired by Indian conservation regions. It does not redistribute raw official datasets. Synthetic analytics are generated mathematically to demonstrate the platform and are NOT real empirical measurements. 

To safely reset and rebuild only the demonstration data:
```bash
python scripts/seed_demo_data.py --reset
```

---

## Architectural Decisions

### Why synchronous SQLAlchemy?
The initial scaffold uses synchronous SQLAlchemy (not `asyncpg`). Rationale: easier to reason about during the foundation stage, simpler test setup, and no async route handlers exist yet. Migration to async is straightforward when concurrency requirements warrant it.

### Why ESLint v8?
ESLint v9 uses a flat config format incompatible with several ecosystem plugins at this time. ESLint v8 with `.eslintrc.cjs` is stable and well-supported for this stack.

### Why Axios and not Fetch?
Axios provides request/response interceptors needed for JWT token injection and refresh logic in the auth stage. The native Fetch API lacks interceptor support without wrapping. Axios v1.20.0 is pinned for the supply chain attack security reason documented above.

### Why Docker only for the database?
Running FastAPI and Vite locally (outside Docker) provides a significantly faster development experience: instant hot-reload, easier debugger attachment, no container rebuild cycle. The database is the only component that benefits from containerization in local dev.
