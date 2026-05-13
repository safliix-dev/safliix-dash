# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Dev server with Turbopack (localhost:3000)
npm run build      # Production build
npm run start      # Production start
npm run lint       # ESLint check
npx prisma migrate dev     # Run DB migrations (SQLite)
npx prisma generate        # Regenerate Prisma client after schema changes
npx prisma studio          # GUI for the SQLite DB
```

No test framework is configured in this project.

## Environment Setup

Copy `.env.local.example` to `.env.local` and fill in:

```
DATABASE_URL=file:./dev.db
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<secret>
KEYCLOAK_ISSUER=http://localhost:8080/realms/safliix-realm
KEYCLOAK_CLIENT_ID=safliix-admin
KEYCLOAK_CLIENT_SECRET=<secret>
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=/api/proxy
NEST_API_URL=http://localhost:3001/api
```

Requires a running Keycloak instance and a NestJS backend at `localhost:3001`.

## Architecture

**Stack**: Next.js 15 (App Router) + TypeScript + TailwindCSS 4 + DaisyUI 5 + Prisma (SQLite) + NextAuth v4 (Keycloak)

### Authentication Flow

NextAuth v4 with Keycloak (OIDC). Access/refresh tokens are **not** stored in the session cookie — instead they are saved to SQLite via `SessionService` (`src/services/session.service.ts`), and only a lightweight JWT with a `sessionStoreId` is kept in the cookie. This avoids cookie size limits.

`TokenService` (`src/services/token.service.ts`) handles expiration detection (60-second buffer) and automatic token refresh. The middleware at `src/middleware.ts` enforces role-based routing:
- `/admin/*` → `super_admin` role only
- `/users/*`, `/settings/*` → `admin` or `super_admin`
- All other authenticated routes → any logged-in user

### API Proxy Pattern

All calls to the NestJS backend go through the Next.js API route at `/api/proxy/[...path]` (`src/app/api/proxy/`). This route retrieves the current access token from SQLite and injects it as a Bearer header before forwarding to `NEST_API_URL`. Client-side code always calls `NEXT_PUBLIC_API_URL` (`/api/proxy`), never the backend directly.

### Database

SQLite (`dev.db`) via Prisma with `better-sqlite3` adapter. The schema is minimal — a single `SessionStore` model that holds serialized token data keyed by session ID. All domain data lives in the NestJS backend.

### Source Layout

```
src/
├── app/                  # Next.js App Router pages + API routes
│   ├── api/proxy/        # Token-injecting proxy to NestJS backend
│   ├── films/            # Film management (list, add, edit)
│   ├── series/           # Series & season management
│   ├── admins/           # Admin user management
│   ├── rights-holders/   # Rights holder management
│   └── stats/            # Dashboard with Nivo charts
├── lib/
│   ├── auth/             # NextAuth config & Keycloak provider setup
│   ├── api/              # HTTP client utilities (fetch wrappers)
│   ├── hooks/            # Custom React hooks (see below)
│   ├── contexts/         # React contexts
│   └── socket/           # Socket.io client utilities
├── services/             # Business logic: TokenService, SessionService, WebsocketAuthService
├── types/api/            # TypeScript interfaces for all backend API shapes
├── ui/
│   ├── components/       # Generic reusable components (Header, ConfirmationDialog, etc.)
│   ├── specific/         # Domain-specific components (films, series)
│   ├── layout/           # Layout wrappers
│   └── pdf/              # React-PDF report components
└── middleware.ts         # NextAuth middleware + role enforcement
```

### Key Custom Hooks (`src/lib/hooks/`)

Complex page logic is extracted into hooks rather than kept in page components:
- `useFilmManagement` — film CRUD, status filtering, sorting
- `useBaseContentManagement` — generic list/filter/sort base
- `useContentAction` — action dialog state machine (confirm → execute → refresh)
- `useDashboardData` — statistics aggregation for the stats page
- `useEncodingJobs` — polling/socket-driven encoding job status
- `useSocketStatus` / `useVideoSocket` — WebSocket connection and video events

### UI Conventions

- All interactive pages are `'use client'` components; layout and data-fetching wrappers can be server components.
- Styling uses TailwindCSS 4 with a single DaisyUI custom theme named `"mytheme"` (configured in `tailwind.config.mjs`).
- Icons: Lucide React. Charts: Nivo (`@nivo/bar`, `@nivo/core`). File uploads: Uppy. Video playback: HLS.js. PDFs: React-PDF.
- Forms use React Hook Form.
