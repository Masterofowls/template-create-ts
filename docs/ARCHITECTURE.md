# Architecture

## Overview

`template-create-ts` is an npm CLI package that scaffolds a Bun monorepo template for fullstack TypeScript applications.

```
template-create-ts (npm CLI)
└── templates/default/
    ├── apps/
    │   ├── api/     → Hono or Fastify + Socket.IO
    │   └── web/     → React + Vite
    ├── packages/
    │   ├── db/      → Drizzle ORM schema & client
    │   └── shared/  → Zod schemas & security utilities
    └── tests/
        ├── unit/    → Jest
        └── e2e/     → Playwright
```

## CLI Flow

1. Copy `templates/default` to target directory
2. Replace `{{PROJECT_NAME}}` and `{{FRAMEWORK}}` placeholders
3. Select framework (Hono/Fastify) — copy `src/` and `package.json`
4. Copy `.env.example` → `.env`
5. Run `bun install` and `git init`

## Port Allocation

| Service | Port |
|---------|------|
| Web (Vite) | 9000 |
| API | 9001 |
| Drizzle Studio | 4983 (default) |

## Database

Drizzle ORM with SQLite (libsql) is configured in `@pkg/db`. Example `notes` table schema included as a starting point.

## Security Layer

`@pkg/shared/security` provides sanitization (XSS, HTML), safe JSON parsing, and crypto utilities used by both API and web layers.
