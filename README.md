# UserSphere: Full-Stack User Management System

A production-grade, enterprise User Management System built with **Next.js (App Router)**, **React**, **Node.js**, and **PostgreSQL**.

This application performs direct database operations (Create, Read, Update, Delete, Search, and Aggregated Statistics) utilizing the native `pg` package with high-efficiency connection pooling and parameterized raw SQL queries. Strictly **no ORM** (no Prisma, Sequelize, TypeORM, or Drizzle) is used.

---

## 1. Project Setup

### Prerequisites
- **Node.js**: `v18.17+` or `v20+` (Node.js 22 tested)
- **npm**: `v9+` or `v10+`
- **PostgreSQL**: `v14+` through `v18+` (running locally or accessible via network)

### Clone & Installation
1. Navigate to the project root:
   ```bash
   cd DashBoard2
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

---

## 2. Dependencies

The application relies strictly on standard, high-performance packages:

### Runtime Dependencies
- `next`: `^14.2.15` - Modern App Router with server-side Route Handlers.
- `react` & `react-dom`: `^18.3.1` - UI component foundation.
- `pg`: `^8.13.1` - Native PostgreSQL client with built-in connection pooling (`pg.Pool`).
- `lucide-react`: `^0.453.0` - Lightweight, accessible icons.
- `dotenv`: `^16.4.5` - Environment variable loading for external scripts and migrations.

### Development Dependencies
- `typescript`: `^5.6.3` - Static typing for robust contracts.
- `@types/pg`, `@types/node`, `@types/react`: Type definitions for node and postgres.
- `tailwindcss`, `postcss`, `autoprefixer`: Utility-first CSS styling with clean SaaS light theme.

---

## 3. Environment Variables

Create a `.env` file in the project root by copying the template from `.env.example`:

```bash
cp .env.example .env
```

### Configuration Parameters

| Variable | Description | Default | Example |
| :--- | :--- | :--- | :--- |
| `PGHOST` | PostgreSQL hostname or Nimbus private domain | `localhost` | `postgres.internal.nimbus.net` |
| `PGPORT` | PostgreSQL TCP port | `5432` | `5432` |
| `PGUSER` | Database role/username | `postgres` | `postgres` |
| `PGPASSWORD` | Password for database user | *(empty)* | `your_secure_password` |
| `PGDATABASE` | Target database name | `user_management_demo` | `user_management_demo` |
| `PGSSL` | SSL encryption mode (`true`, `require`, or `false`) | `false` | `require` |

> **Security Note**: `.env`, `.env.local`, and `.env.*.local` are strictly excluded in `.gitignore` to prevent secret leakage. Database credentials are only accessed server-side and are never bundled into client-side code.

---

## 4. Database Creation

You can create the database manually using PostgreSQL `psql`:

```sql
CREATE DATABASE user_management_demo;
```

Alternatively, running the built-in migration tool will **automatically verify and create** the `user_management_demo` database if connecting with superuser/admin credentials.

---

## 5. Database Table Creation

The application schema is stored in `migrations/001_create_users.sql`:

```sql
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  department VARCHAR(100),
  job_role VARCHAR(100),
  status VARCHAR(20) DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Optimized indexes for fast searching and filtering
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_full_name ON users(full_name);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
```

---

## 6. Database Migration System

A pure SQL migration runner is implemented in `scripts/migrate.js`. It connects to PostgreSQL via `pg`, creates an atomic `schema_migrations` audit table, tracks applied migration files, and skips previously applied migrations.

### Run Migrations
```bash
npm run db:migrate
```

### Seed Initial Data (Optional)
To seed realistic enterprise team members for testing:
```bash
npm run db:seed
```

---

## 7. Application Execution

### Development Mode
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build & Launch
```bash
npm run build
npm start
```

### Automated Verification Tests
Run the standalone PostgreSQL CRUD verification suite:
```bash
npm run test:crud
```

Run the live HTTP API endpoint test suite:
```bash
npm run test:api
```

---

## 8. Backend API Endpoints

All route handlers execute in the Node.js runtime (`export const runtime = 'nodejs'`) and communicate directly via raw parameterized SQL queries with `pg.Pool`.

| Method | Endpoint | Description | Query / Body Parameters |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | PostgreSQL connectivity healthcheck | Returns `{ status: 'connected' \| 'disconnected' }` |
| `GET` | `/api/dashboard/stats` | Aggregated dashboard metrics | Total users, active/inactive counts, department distribution, 5 recent users |
| `GET` | `/api/users` | List paginated users with filters | `?search=term&department=dept&status=Active&page=1&limit=10&sortBy=created_at&sortOrder=desc` |
| `GET` | `/api/users/:id` | Fetch single user by numeric ID | `id` parameter |
| `POST` | `/api/users` | Create a new user | `{ full_name, email, phone?, department?, job_role?, status? }` |
| `PUT` | `/api/users/:id` | Update existing user details | `{ full_name, email, phone?, department?, job_role?, status? }` |
| `DELETE`| `/api/users/:id` | Delete user permanently | `id` parameter |

### Raw Parameterized SQL Examples

#### Create User (INSERT)
```sql
INSERT INTO users (full_name, email, phone, department, job_role, status)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;
```

#### Read Users (SELECT with Pagination & Search)
```sql
SELECT id, full_name, email, phone, department, job_role, status, created_at, updated_at
FROM users
WHERE (full_name ILIKE $1 OR email ILIKE $1 OR department ILIKE $1 OR job_role ILIKE $1)
  AND status = $2
ORDER BY created_at DESC
LIMIT $3 OFFSET $4;
```

#### Update User (UPDATE)
```sql
UPDATE users
SET full_name = $1,
    email = $2,
    phone = $3,
    department = $4,
    job_role = $5,
    status = $6,
    updated_at = NOW()
WHERE id = $7
RETURNING *;
```

#### Delete User (DELETE)
```sql
DELETE FROM users
WHERE id = $1
RETURNING *;
```

---

## 9. Nimbus Platform Deployment Preparation

The application is structured to deploy smoothly on the **Nimbus cloud platform**:

1. **Node.js Native Runtime**: All API routes specify `export const runtime = 'nodejs'`, ensuring seamless execution within standard Node.js server container environments.
2. **Environment Variable Injection**: Nimbus injects database credentials at container runtime. The database module reads `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, and `PGDATABASE` dynamically without hardcoding.
3. **Private Hostname & VPC Compatibility**: Supports connecting to PostgreSQL via Nimbus internal hostnames (e.g., `postgres.internal.nimbus.net`) on port `5432`.
4. **SSL Configuration**: Set `PGSSL=true` or `PGSSL=require` in Nimbus environment variables to enable secure TLS communication with managed PostgreSQL services (`rejectUnauthorized: false`).
5. **Connection Pooling**: Managed via a singleton `pg.Pool` instance with a maximum of 10 connections, 30-second idle timeout, and 5-second acquisition timeout, preventing connection exhaustion under Nimbus auto-scaling.
6. **Build & Start Pipeline**:
   ```bash
   # Build Step in Nimbus CI/CD
   npm install
   npm run build
   npm run db:migrate

   # Start Command
   npm start
   ```

---

## 10. Architecture & Directory Structure

```
DashBoard2/
├── migrations/
│   └── 001_create_users.sql        # Raw SQL schema definition
├── scripts/
│   ├── migrate.js                  # Migration runner tracking schema_migrations
│   ├── seed.js                     # Realistic sample user seeder
│   ├── test-crud.js                # Direct database CRUD test suite
│   └── test-api.js                 # HTTP REST API verification suite
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── dashboard/stats/    # GET /api/dashboard/stats
│   │   │   ├── health/             # GET /api/health
│   │   │   └── users/
│   │   │       ├── route.ts        # GET /api/users, POST /api/users
│   │   │       └── [id]/route.ts   # GET, PUT, DELETE /api/users/:id
│   │   ├── dashboard/page.tsx      # Dashboard UI with statistics & recent users
│   │   ├── users/page.tsx          # Full User Management UI (Search, Filter, Table)
│   │   ├── globals.css             # Tailwind and global layout styles
│   │   ├── layout.tsx              # Root HTML layout with AppShell & ToastProvider
│   │   └── page.tsx                # Automatic redirect to /dashboard
│   ├── components/
│   │   ├── AppShell.tsx            # Responsive layout wrapper with sidebar state
│   │   ├── Sidebar.tsx             # Navigation sidebar with status badges
│   │   ├── Navbar.tsx              # Header with real-time PostgreSQL health indicator
│   │   ├── StatsCard.tsx           # Stat metric cards with Lucide icons
│   │   ├── UserTable.tsx           # Data table with avatars, badges, and actions
│   │   ├── UserFormModal.tsx       # Create and Edit user modal with validation
│   │   ├── DeleteDialog.tsx        # Deletion confirmation modal
│   │   ├── UserDetailsModal.tsx    # Detailed user profile viewer
│   │   ├── DbStatusBanner.tsx      # Diagnostic alert banner for connection issues
│   │   └── Toast.tsx               # Non-blocking success/error toast notifications
│   ├── lib/
│   │   ├── db.ts                   # pg.Pool connection module with pooling & error handling
│   │   └── api-response.ts         # Standardized JSON response helpers
│   └── types/
│       └── user.ts                 # TypeScript interfaces for users & metrics
├── .env.example                    # Sample environment variables template
├── .gitignore                      # Git exclusion rules for node_modules & .env
├── next.config.mjs                 # Next.js configuration
├── package.json                    # Project dependencies & npm scripts
├── postcss.config.mjs              # PostCSS configuration
├── tailwind.config.ts              # Tailwind CSS theme configuration
├── tsconfig.json                   # TypeScript compiler configuration
└── README.md                       # Comprehensive system documentation
```

