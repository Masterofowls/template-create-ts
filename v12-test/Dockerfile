FROM oven/bun:1 AS base
WORKDIR /app

FROM base AS install
COPY package.json bun.lock ./
COPY apps/api/package.json ./apps/api/
COPY packages/db/package.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/
RUN bun install --frozen-lockfile --production

FROM base AS release
COPY --from=install /app/node_modules ./node_modules
COPY . .
WORKDIR /app/apps/api
ENV API_HOST=0.0.0.0
ENV API_PORT=9001
EXPOSE 9001
CMD ["bun", "--env-file=../../.env", "run", "src/index.ts"]
