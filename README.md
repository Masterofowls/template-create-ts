# template-create-ts

Ultimate reusable TypeScript fullstack/backend template scaffolder.

Scaffold production-ready monorepos with **Bun**, **React**, **Hono/Fastify**, **Drizzle ORM**, **Better Auth**, **Zod**, **Socket.IO**, and a comprehensive security toolchain.

## Quick Start

```bash
# Using Bun
bunx template-create-ts my-app

# Using npx
npx template-create-ts my-app

# Fastify backend instead of Hono
bunx template-create-ts my-api -f fastify
```

## What You Get

### Core Stack
- **TypeScript** — strict mode, workspace monorepo
- **Bun** — runtime & package manager
- **React + Vite** — frontend on port 9000
- **Hono or Fastify** — API server on port 9001
- **Drizzle ORM** — SQLite (libsql) with Drizzle Kit & Studio
- **Better Auth** — email/password authentication
- **Zod** — runtime validation
- **Socket.IO** — realtime messaging
- **Biome** — linting & formatting

### Testing
- **Jest** — unit tests
- **Playwright** — E2E browser tests

### Security Tooling
| Tool | Purpose |
|------|---------|
| `@bun-security-scanner/osv` | OSV vulnerability scanning |
| `@nodesecure/cli` | Dependency analysis |
| `snyk` | Security testing |
| `npq` | Safe install auditing |
| `lockfile-lint` | Lockfile integrity |
| `bun-scan` | Bun security scan |
| `depcheck` | Unused dependency detection |
| `detective-typescript` | Dependency graph |
| `dompurify` / `xss` / `is-unsafe` | Input sanitization |
| `secure-json-parse` | Safe JSON parsing |
| `crypto-js` | Hashing & encryption |

## CLI Options

```
template-create-ts <project-name> [options]

  -f, --framework <hono|fastify>  API framework (default: hono)
  -t, --template <name>           Template variant (default: default)
  --no-install                    Skip bun install
  --no-git                        Skip git init
  -h, --help                      Show help
```

## Development

```bash
git clone <repo>
cd template-create-ts
bun install
bun run build
bun run dev -- my-test-app --no-install
```

## License

MIT
