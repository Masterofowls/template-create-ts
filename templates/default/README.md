# {{PROJECT_NAME}}

Fullstack TypeScript monorepo scaffolded with [template-create-ts](https://www.npmjs.com/package/template-create-ts).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | [Bun](https://bun.sh) |
| Language | TypeScript |
| Frontend | React + Vite |
| API | {{FRAMEWORK}} (Hono or Fastify) |
| ORM | Drizzle ORM + Drizzle Kit + Drizzle Studio |
| Validation | Zod |
| Realtime | Socket.IO |
| Lint/Format | Biome |
| Unit Tests | Jest |
| E2E Tests | Playwright |

## Security Tooling

- `@bun-security-scanner/osv` — OSV vulnerability scanning
- `@nodesecure/cli` — dependency analysis
- `snyk` — security testing
- `npq` — safe npm install auditing
- `lockfile-lint` — lockfile integrity
- `bun-scan` — Bun-specific security scan
- `depcheck` — unused dependency detection
- `detective-typescript` — dependency graph analysis
- `dompurify` / `xss` / `is-unsafe` / `secure-json-parse` / `crypto-js` — runtime sanitization

## Quick Start

```bash
# Install dependencies
bun install

# Copy environment variables
cp .env.example .env

# Push database schema
bun run db:push

# Start development servers
bun run dev:web   # http://localhost:9000
bun run dev:api   # http://localhost:9001
```

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev:web` | Start React dev server |
| `bun run dev:api` | Start API server |
| `bun run build` | Build all packages |
| `bun run typecheck` | TypeScript check |
| `bun run lint` | Biome lint |
| `bun run test` | Jest unit tests |
| `bun run test:e2e` | Playwright E2E tests |
| `bun run db:studio` | Drizzle Studio |
| `bun run db:push` | Push schema to database |
| `bun run security` | Full security audit suite |

## Project Structure

```
{{PROJECT_NAME}}/
├── apps/
│   ├── api/          # {{FRAMEWORK}} backend + Socket.IO
│   └── web/          # React frontend
├── packages/
│   ├── db/           # Drizzle schema & client
│   └── shared/       # Zod schemas & security utilities
└── tests/
    ├── unit/         # Jest tests
    └── e2e/          # Playwright tests
```

## License

MIT
