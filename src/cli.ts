#!/usr/bin/env node

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
import { fileURLToPath } from "node:url";
import { spawn, spawnSync } from "node:child_process";

import { parseArgs } from "node:util";
const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = join(__dirname, "..", "templates");

function runCommand(command: string, args: string[], cwd: string): Promise<number> {
  return new Promise((resolve) => {
    const proc = spawn(command, args, { cwd, stdio: "inherit", shell: process.platform === "win32" });
    proc.on("close", (code) => resolve(code ?? 1));
    proc.on("error", () => resolve(1));
  });
}

function runCommandSync(command: string, args: string[], cwd: string): void {
  spawnSync(command, args, { cwd, stdio: "inherit", shell: process.platform === "win32" });
}

type Framework = "hono" | "fastify";

interface CliOptions {
  projectName: string;
  framework: Framework;
  template: string;
  install: boolean;
  git: boolean;
}

function printBanner(): void {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║           template-create-ts v1.0.0                      ║
║  TypeScript fullstack/backend scaffold with Bun          ║
╚══════════════════════════════════════════════════════════╝
`);
}

function parseCliArgs(): CliOptions {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      framework: { type: "string", short: "f", default: "hono" },
      template: { type: "string", short: "t", default: "default" },
      "no-install": { type: "boolean", default: false },
      "no-git": { type: "boolean", default: false },
      help: { type: "boolean", short: "h", default: false },
    },
  });

  if (values.help) {
    console.log(`
Usage: template-create-ts <project-name> [options]

Options:
  -f, --framework <hono|fastify>  API framework (default: hono)
  -t, --template <name>             Template variant (default: default)
  --no-install                      Skip bun install
  --no-git                          Skip git init
  -h, --help                        Show help

Examples:
  bunx template-create-ts my-app
  bunx template-create-ts my-api -f fastify
  npx template-create-ts my-app
`);
    process.exit(0);
  }

  const projectName = positionals[0];
  if (!projectName) {
    console.error("Error: project name is required.\nRun with --help for usage.");
    process.exit(1);
  }

  const framework = values.framework as Framework;
  if (framework !== "hono" && framework !== "fastify") {
    console.error("Error: framework must be 'hono' or 'fastify'.");
    process.exit(1);
  }

  return {
    projectName,
    framework,
    template: values.template as string,
    install: !values["no-install"],
    git: !values["no-git"],
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
    } else if (/\.(json|ts|tsx|js|md|env\.example|toml|html|css)$/.test(entry)) {
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
    cpSync(frameworkPkg, join(apiDir, "package.json"), { overwrite: true });
  }

  mkdirSync(srcDir, { recursive: true });
  const frameworkSrc = join(frameworkDir, "src");
  if (existsSync(frameworkSrc)) {
    cpSync(frameworkSrc, srcDir, { recursive: true });
  }

  rmSync(join(apiDir, "hono"), { recursive: true, force: true });
  rmSync(join(apiDir, "fastify"), { recursive: true, force: true });
}

async function runInstall(projectDir: string): Promise<void> {
  console.log("\n📦 Installing dependencies with Bun...");
  const exitCode = await runCommand("bun", ["install"], projectDir);
  if (exitCode !== 0) {
    console.warn("Warning: bun install exited with code", exitCode);
  }
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

async function main(): Promise<void> {
  printBanner();
  const options = parseCliArgs();

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

  console.log(`Creating project: ${options.projectName}`);
  console.log(`Framework: ${options.framework}`);
  console.log(`Template: ${options.template}`);

  mkdirSync(targetDir, { recursive: true });
  copyDir(templatePath, targetDir);

  const replacements: Record<string, string> = {
    "{{PROJECT_NAME}}": options.projectName,
    "{{FRAMEWORK}}": options.framework,
  };
  walkAndReplace(targetDir, replacements);

  applyFramework(targetDir, options.framework);

  const envExample = join(targetDir, ".env.example");
  const envFile = join(targetDir, ".env");
  if (existsSync(envExample) && !existsSync(envFile)) {
    cpSync(envExample, envFile);
  }

  if (options.install) {
    await runInstall(targetDir);
  }

  if (options.git) {
    runGitInit(targetDir);
  }

  console.log(`
✅ Project created successfully!

Next steps:
  cd ${options.projectName}
  bun run dev:web        # Start React frontend (port 9000)
  bun run dev:api        # Start API server (port 9001)
  bun run db:studio      # Open Drizzle Studio
  bun run test           # Run Jest unit tests
  bun run test:e2e       # Run Playwright E2E tests
  bun run security       # Run security audit suite

Documentation: README.md
`);
}

main().catch((err: unknown) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
