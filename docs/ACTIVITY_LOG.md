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
