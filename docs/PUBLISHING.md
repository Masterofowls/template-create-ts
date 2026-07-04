# Publishing to npm

## Current package

- **npm**: https://www.npmjs.com/package/template-create-ts
- **GitHub**: https://github.com/Masterofowls/template-create-ts
- **Workflow**: `.github/workflows/publish.yml`

## OIDC trusted publisher (recommended)

Configure at: https://www.npmjs.com/package/template-create-ts/access

| Field | Value |
|-------|-------|
| Publisher | GitHub Actions |
| Organization or user | `Masterofowls` |
| Repository | `template-create-ts` |
| Workflow filename | `publish.yml` |
| Environment name | *(leave blank)* |
| Allowed actions | **npm publish** ✓ |

### Why CI returns 404

```
npm error 404 Not Found - PUT https://registry.npmjs.org/template-create-ts
```

This almost always means the **trusted publisher is missing or misconfigured** — not that the package doesn't exist. Provenance can succeed while the publish PUT is rejected.

Common mistakes:

- Repository field contains the full URL instead of `template-create-ts`
- Workflow filename is `.github/workflows/publish.yml` instead of `publish.yml`
- **npm publish** is not checked under Allowed actions
- Organization/user is empty or wrong

Verify with npm CLI v11+ (as package owner):

```bash
npx npm@11 trust list template-create-ts
```

Or re-add:

```bash
npx npm@11 trust github template-create-ts \
  --file publish.yml \
  --repo Masterofowls/template-create-ts \
  --allow-publish -y
```

## NPM_TOKEN fallback (GitHub secret)

Until OIDC is confirmed working, add a repository secret:

1. GitHub → **Settings** → **Secrets and variables** → **Actions**
2. New secret: `NPM_TOKEN` (granular token with publish + bypass 2FA)
3. Re-run the **Publish** workflow

The workflow uses `NPM_TOKEN` when set; otherwise it relies on OIDC.

## Release flow

```bash
# 1. Bump version in package.json + .release-please-manifest.json
# 2. Commit, tag (must match package.json), and push
git tag v1.2.4
git push origin main --tags

# Or merge the Release Please PR (automated)
```

Current version: **1.2.4** — localhost dev, optional DB (`--db none`), git scaffold fixes.

Tag **must** match `package.json` version (CI enforces this).

## Manual publish (local)

```bash
bun run build
npm publish --access public
```
