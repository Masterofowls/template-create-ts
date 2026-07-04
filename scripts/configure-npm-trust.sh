#!/usr/bin/env bash
set -euo pipefail

PACKAGE="template-create-ts"
REPO="Masterofowls/template-create-ts"
WORKFLOW="publish.yml"

if [[ -z "${NPM_TOKEN:-}" ]]; then
  echo "Set NPM_TOKEN to a granular npm token with publish permissions." >&2
  exit 1
fi

NPMRC="$(mktemp)"
trap 'rm -f "$NPMRC"' EXIT
echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" >"$NPMRC"

npx npm@11 trust github "$PACKAGE" \
  --file "$WORKFLOW" \
  --repo "$REPO" \
  --allow-publish \
  -y \
  --userconfig "$NPMRC"

echo "Trusted publisher configured for ${PACKAGE} via ${WORKFLOW} on ${REPO}"
