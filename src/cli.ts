#!/usr/bin/env node

import { type ChildProcess, spawn, spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { stdin as input, stdout as output } from "node:process";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = join(__dirname, "..", "templates");
const PKG_VERSION = readPackageVersion();

type Framework = "hono" | "fastify";
type Database = "sqlite" | "postgres";

interface CliOptions {
  projectName: string;
  framework: Framework;
  database: Database;
  template: string;
  includeWeb: boolean;
  includeSecurity: boolean;
  install: boolean;
  git: boolean;
  dryRun: boolean;
  interactive: boolean;
}

function readPackageVersion(): string {
  try {
    const pkgPath = join(__dirname, "..", "package.json");
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as { version?: string };
    return pkg.version ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

function runCommand(command: string, args: string[], cwd: string): Promise<number> {
  return new Promise((resolve) => {
    const proc = spawn(command, args, {
      cwd,
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    proc.on("close", (code) => resolve(code ?? 1));
    proc.on("error", () => resolve(1));
  });
}

function runCommandSync(command: string, args: string[], cwd: string): void {
  spawnSync(command, args, { cwd, stdio: "inherit", shell: process.platform === "win32" });
}

function printBanner(): void {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║           template-create-ts v${PKG_VERSION.padEnd(24)}║
║  TypeScript fullstack/backend scaffold with Bun          ║
╚══════════════════════════════════════════════════════════╝
`);
}

function isValidProjectName(name: string): boolean {
  return /^[a-z0-9][a-z0-9._-]*$/i.test(name) && !name.includes(" ");
}

async function promptChoice<T extends string>(
  rl: ReturnType<typeof createInterface>,
  label: string,
  choices: { label: string; value: T }[],
  defaultValue: T,
): Promise<T> {
  console.log(`\n${label}`);
  for (const [i, choice] of choices.entries()) {
    const marker = choice.value === defaultValue ? "*" : " ";
    console.log(`  ${marker} ${i + 1}. ${choice.label}`);
  }
  const answer = await rl.question(`Choose [default: ${defaultValue}]: `);
  const index = Number.parseInt(answer.trim(), 10);
  if (!Number.isNaN(index) && index >= 1 && index <= choices.length) {
    return choices[index - 1]?.value ?? defaultValue;
  }
  const trimmed = answer.trim().toLowerCase();
  const match = choices.find((c) => c.value === trimmed || c.label.toLowerCase() === trimmed);
  return match?.value ?? defaultValue;
}

async function promptYesNo(
  rl: ReturnType<typeof createInterface>,
  label: string,
  defaultValue: boolean,
): Promise<boolean> {
  const hint = defaultValue ? "Y/n" : "y/N";
  const answer = (await rl.question(`${label} [${hint}]: `)).trim().toLowerCase();
  if (!answer) return defaultValue;
  return answer === "y" || answer === "yes";
}

async function runInteractivePrompts(
  partial: Omit<CliOptions, "projectName" | "interactive"> & { projectName?: string },
): Promise<CliOptions> {
  const rl = createInterface({ input, output });
  try {
    let projectName = partial.projectName ?? "";
    while (!projectName || !isValidProjectName(projectName)) {
      projectName = (await rl.question("Project name (npm-safe, no spaces): ")).trim();
      if (!isValidProjectName(projectName)) {
        console.log("Invalid name. Use letters, numbers, hyphens, underscores, or dots.");
      }
    }

    const framework = await promptChoice(
      rl,
      "API framework:",
      [
        { label: "Hono (default, lightweight)", value: "hono" },
        { label: "Fastify (plugin ecosystem)", value: "fastify" },
      ],
      partial.framework,
    );

    const database = await promptChoice(
      rl,
      "Database:",
      [
        { label: "SQLite (local file, zero setup)", value: "sqlite" },
        { label: "PostgreSQL (Docker / production)", value: "postgres" },
      ],
      partial.database,
    );

    const includeWeb = await promptYesNo(rl, "Include React frontend?", partial.includeWeb);
    const includeSecurity = await promptYesNo(
      rl,
      "Include full security toolchain (Snyk, NodeSecure)?",
      partial.includeSecurity,
    );

    return {
      projectName,
      framework,
      database,
      template: partial.template,
      includeWeb,
      includeSecurity,
      install: partial.install,
      git: partial.git,
      dryRun: partial.dryRun,
      interactive: true,
    };
  } finally {
    rl.close();
  }
}

function parseCliArgs(): CliOptions {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      framework: { type: "string", short: "f", default: "hono" },
      db: { type: "string", default: "sqlite" },
      template: { type: "string", short: "t", default: "default" },
      "no-install": { type: "boolean", default: false },
      "no-git": { type: "boolean", default: false },
      "no-web": { type: "boolean", default: false },
      "no-security": { type: "boolean", default: false },
      interactive: { type: "boolean", short: "i", default: false },
      "dry-run": { type: "boolean", default: false },
      help: { type: "boolean", short: "h", default: false },
    },
  });

  if (values.help) {
    console.log(`
Usage: template-create-ts [project-name] [options]

Options:
  -i, --interactive               Prompt for framework, database, and options
  -f, --framework <hono|fastify>  API framework (default: hono)
      --db <sqlite|postgres>      Database dialect (default: sqlite)
  -t, --template <name>           Template variant (default: default)
      --no-web                    API-only scaffold (skip React app)
      --no-security               Skip heavy security devDependencies
      --no-install                Skip bun install
      --no-git                      Skip git init
      --dry-run                     Preview actions without writing files
  -h, --help                      Show help

Examples:
  bunx template-create-ts
  bunx template-create-ts my-app -i
  bunx template-create-ts my-api -f fastify --db postgres --no-web
  bunx template-create-ts my-app --dry-run
`);
    process.exit(0);
  }

  const framework = values.framework as Framework;
  if (framework !== "hono" && framework !== "fastify") {
    console.error("Error: framework must be 'hono' or 'fastify'.");
    process.exit(1);
  }

  const database = values.db as Database;
  if (database !== "sqlite" && database !== "postgres") {
    console.error("Error: --db must be 'sqlite' or 'postgres'.");
    process.exit(1);
  }

  const projectName = positionals[0];
  const needsInteractive = values.interactive || !projectName;

  if (!needsInteractive && projectName && !isValidProjectName(projectName)) {
    console.error("Error: project name must be npm-safe (no spaces).");
    process.exit(1);
  }

  return {
    projectName: projectName ?? "",
    framework,
    database,
    template: values.template as string,
    includeWeb: !values["no-web"],
    includeSecurity: !values["no-security"],
    install: !values["no-install"],
    git: !values["no-git"],
    dryRun: values["dry-run"] as boolean,
    interactive: needsInteractive,
  };
}

function copyDir(src: string, dest: string): void {
  cpSync(src, dest, { recursive: true });
}

function replaceInFile(filePath: string, replacements: Record<string, string>): void {
  if (!existsSync(filePath)) return;
  let content = readFileSync(filePath, "utf-8");
  for (const [key, value] of Object.entries(replacements)) {
    content = content.replaceAll(key, value);
  }
  writeFileSync(filePath, content, "utf-8");
}

function walkAndReplace(dir: string, replacements: Record<string, string>): void {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      walkAndReplace(fullPath, replacements);
    } else if (/\.(json|ts|tsx|js|md|env\.example|toml|html|css|yml|yaml)$/.test(entry)) {
      replaceInFile(fullPath, replacements);
    }
  }
}

function applyFramework(projectDir: string, framework: Framework): void {
  const apiDir = join(projectDir, "apps", "api");
  const frameworkDir = join(apiDir, framework);
  const srcDir = join(apiDir, "src");

  if (!existsSync(frameworkDir)) {
    console.error(`Error: framework template '${framework}' not found.`);
    process.exit(1);
  }

  const frameworkPkg = join(frameworkDir, "package.json");
  if (existsSync(frameworkPkg)) {
    cpSync(frameworkPkg, join(apiDir, "package.json"), { force: true });
  }

  mkdirSync(srcDir, { recursive: true });
  const frameworkSrc = join(frameworkDir, "src");
  if (existsSync(frameworkSrc)) {
    cpSync(frameworkSrc, srcDir, { recursive: true });
  }

  rmSync(join(apiDir, "hono"), { recursive: true, force: true });
  rmSync(join(apiDir, "fastify"), { recursive: true, force: true });
}

function applyNoWeb(projectDir: string): void {
  rmSync(join(projectDir, "apps", "web"), { recursive: true, force: true });
  const pkgPath = join(projectDir, "package.json");
  if (!existsSync(pkgPath)) return;
  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as {
    workspaces?: string[];
    scripts?: Record<string, string>;
  };
  pkg.workspaces = ["apps/*", "packages/*"];
  if (pkg.scripts) {
    const { "dev:web": _removed, ...rest } = pkg.scripts;
    pkg.scripts = rest;
  }
  writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`, "utf-8");
  rmSync(join(projectDir, "tests", "e2e"), { recursive: true, force: true });
}

function applyNoSecurity(projectDir: string): void {
  const pkgPath = join(projectDir, "package.json");
  if (!existsSync(pkgPath)) return;
  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as {
    devDependencies?: Record<string, string>;
    scripts?: Record<string, string>;
  };
  const remove = ["@nodesecure/cli", "snyk", "bun-scan"];
  for (const dep of remove) {
    delete pkg.devDependencies?.[dep];
  }
  if (pkg.scripts) {
    const { "security:nodesecure": _n, "security:scan": _s, ...rest } = pkg.scripts;
    pkg.scripts = {
      ...rest,
      security: "bun run security:quick",
      "security:full":
        "bun run security:quick && bun run security:snyk && bun run security:nodesecure && bun run security:scan",
    };
  }
  writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`, "utf-8");
}

function applyDatabase(projectDir: string, database: Database): void {
  const isPostgres = database === "postgres";
  const replacements: Record<string, string> = {
    "{{DB_DIALECT}}": isPostgres ? "postgresql" : "sqlite",
    "{{DATABASE_URL}}": isPostgres
      ? "postgresql://postgres:postgres@localhost:5432/app"
      : "file:./local.db",
  };
  walkAndReplace(join(projectDir, "packages", "db"), replacements);
}

function ensureNodeModulesInGitignore(projectDir: string): void {
  const gitignorePath = join(projectDir, ".gitignore");
  const nodeModulesEntry = "node_modules/";
  let content = existsSync(gitignorePath) ? readFileSync(gitignorePath, "utf-8") : "";

  if (!content.split(/\r?\n/).some((line) => line.trim() === nodeModulesEntry)) {
    content = `${content.trimEnd()}\n\n# Dependencies\n${nodeModulesEntry}\n`;
    writeFileSync(gitignorePath, content, "utf-8");
  }
}

function generateAppSecret(): string {
  return randomBytes(32).toString("hex");
}

function writeEnvFile(projectDir: string, database: Database): void {
  const envExample = join(projectDir, ".env.example");
  const envFile = join(projectDir, ".env");
  if (!existsSync(envExample)) return;

  let content = readFileSync(envExample, "utf-8");
  const secret = generateAppSecret();
  content = content.replace(/APP_SECRET=.*/, `APP_SECRET=${secret}`);
  if (database === "postgres") {
    content = content.replace(
      /DATABASE_URL=.*/,
      "DATABASE_URL=postgresql://postgres:postgres@localhost:5432/app",
    );
  }
  writeFileSync(envFile, content, "utf-8");
}

async function runInstall(projectDir: string): Promise<boolean> {
  console.log("\n📦 Installing dependencies with Bun...");
  const exitCode = await runCommand("bun", ["install"], projectDir);
  if (exitCode !== 0) {
    console.warn("Warning: bun install exited with code", exitCode);
    return false;
  }
  return true;
}

function runGitInit(projectDir: string): void {
  console.log("\n🔧 Initializing git repository...");
  runCommandSync("git", ["init"], projectDir);
  runCommandSync("git", ["add", "."], projectDir);
  runCommandSync(
    "git",
    ["commit", "-m", "chore: initial commit from template-create-ts"],
    projectDir,
  );
}

async function waitForHealth(url: string, attempts = 20): Promise<boolean> {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

async function postScaffoldHealthCheck(projectDir: string): Promise<void> {
  console.log("\n🩺 Running post-scaffold health check...");
  const apiDir = join(projectDir, "apps", "api");
  const envFile = join(projectDir, ".env");
  const args = existsSync(envFile)
    ? ["--env-file", envFile, "run", "src/index.ts"]
    : ["run", "src/index.ts"];

  const proc: ChildProcess = spawn("bun", args, {
    cwd: apiDir,
    stdio: "ignore",
    shell: process.platform === "win32",
    detached: process.platform !== "win32",
  });

  const healthy = await waitForHealth("http://localhost:9001/health");
  if (proc.pid) {
    try {
      if (process.platform === "win32") {
        spawnSync("taskkill", ["/pid", String(proc.pid), "/f", "/t"], { stdio: "ignore" });
      } else {
        process.kill(-proc.pid, "SIGTERM");
      }
    } catch {
      proc.kill("SIGTERM");
    }
  }

  if (healthy) {
    console.log("✅ Health check passed (GET /health → 200)");
  } else {
    console.warn("⚠️  Health check skipped or failed — run `bun run dev:api` manually");
  }
}

function printDryRunSummary(options: CliOptions, targetDir: string): void {
  console.log("\n[dry-run] Would create:");
  console.log(`  Directory: ${targetDir}`);
  console.log(`  Framework: ${options.framework}`);
  console.log(`  Database:  ${options.database}`);
  console.log(`  Web app:   ${options.includeWeb ? "yes" : "no"}`);
  console.log(`  Security:  ${options.includeSecurity ? "full toolchain" : "quick only"}`);
  console.log(`  Install:   ${options.install ? "yes" : "no"}`);
  console.log(`  Git init:  ${options.git ? "yes" : "no"}`);
}

async function main(): Promise<void> {
  printBanner();
  let options = parseCliArgs();

  if (options.interactive) {
    options = await runInteractivePrompts(options);
  }

  if (!options.projectName) {
    console.error("Error: project name is required.\nRun with --interactive or --help.");
    process.exit(1);
  }

  const templatePath = join(TEMPLATES_DIR, options.template);
  if (!existsSync(templatePath)) {
    console.error(`Error: template '${options.template}' not found at ${templatePath}`);
    process.exit(1);
  }

  const targetDir = resolve(process.cwd(), options.projectName);
  if (existsSync(targetDir)) {
    console.error(`Error: directory '${options.projectName}' already exists.`);
    process.exit(1);
  }

  if (options.dryRun) {
    printDryRunSummary(options, targetDir);
    return;
  }

  console.log(`Creating project: ${options.projectName}`);
  console.log(`Framework: ${options.framework}`);
  console.log(`Database: ${options.database}`);
  console.log(`Web: ${options.includeWeb ? "yes" : "no"}`);

  mkdirSync(targetDir, { recursive: true });
  copyDir(templatePath, targetDir);

  const replacements: Record<string, string> = {
    "{{PROJECT_NAME}}": options.projectName,
    "{{FRAMEWORK}}": options.framework,
    "{{DB_DIALECT}}": options.database === "postgres" ? "postgresql" : "sqlite",
    "{{DATABASE_URL}}":
      options.database === "postgres"
        ? "postgresql://postgres:postgres@localhost:5432/app"
        : "file:./local.db",
  };
  walkAndReplace(targetDir, replacements);

  applyFramework(targetDir, options.framework);
  applyDatabase(targetDir, options.database);
  if (!options.includeWeb) applyNoWeb(targetDir);
  if (!options.includeSecurity) applyNoSecurity(targetDir);

  ensureNodeModulesInGitignore(targetDir);
  writeEnvFile(targetDir, options.database);

  let installed = false;
  if (options.install) {
    installed = await runInstall(targetDir);
  }

  if (options.git) {
    runGitInit(targetDir);
  }

  if (installed) {
    await postScaffoldHealthCheck(targetDir);
  }

  const webHint = options.includeWeb
    ? "  bun run dev:web        # Start React frontend (port 9000)\n"
    : "";

  console.log(`
✅ Project created successfully!

Next steps:
  cd ${options.projectName}
  bun run db:push        # Push database schema (first run)
${webHint}  bun run dev:api        # Start API server (port 9001)
  bun run dev            # Start all services
  bun run test           # Run Vitest unit + integration tests
  bun run security:quick # Fast security audit (CI default)

Documentation: README.md
`);
}

main().catch((err: unknown) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
