# Activity Log

## 2026-07-04

- Created `template-create-ts` npm CLI package with Bun, Biome, TypeScript
- Built fullstack monorepo template: React + Vite, Hono/Fastify API, Drizzle ORM, Better Auth, Socket.IO
- Added security toolchain: OSV scanner, Snyk, npq, lockfile-lint, bun-scan, depcheck, nodesecure
- Added Jest unit tests and Playwright E2E test scaffolding
- Added shared package with Zod schemas and sanitization utilities (xss, dompurify, secure-json-parse, crypto-js)
- Verified CLI scaffold generates correct project structure with framework selection
- Built CLI bundle to `dist/cli.js`
- Prepared npm publish for `template-create-ts@1.0.0`
- Published `template-create-ts@1.0.0` to npm registry successfully
- Created GitHub repo https://github.com/Masterofowls/template-create-ts with CI and publish workflows
- Added npm OIDC trusted publisher setup scripts (`scripts/configure-npm-trust.ps1`)
- **v1.2.2** — Fixed dev server: unified `scripts/dev.ts` (API first, then web), `host: 127.0.0.1` + `strictPort` in Vite (fixes Windows ERR_CONNECTION_REFUSED / IPv6 `[::1]` mismatch), port preflight check, SQLite path resolved from monorepo root (`file:packages/db/local.db`), DB health uses `db.all` for libsql
- Verified scaffolded `test-dev-app`: `bun run dev` → API `/health` 200, web `http://127.0.0.1:9000` 200
- **v1.2.3** — localhost dev: Vite `host: true`, dual-stack port checks, CORS accepts `localhost` + `127.0.0.1`, defaults use `http://localhost:9000/9001`; verified both URLs return 200
- **v1.2.4** — Optional database: `DB_ENABLED=false` / `--db none`, lazy DB client, `/health` returns `database.status: disabled` with overall `ok`; no `db:push` required
