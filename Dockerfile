FROM node:22-alpine AS base

RUN corepack enable

FROM base as deps

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

FROM base AS builder

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN pnpm build

FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup -g 1001 -S dash && adduser -S dash -u 1001

COPY --from=builder /app/public ./public
COPY --from=builder --chown=dash:dash /app/.next/standalone ./
COPY --from=builder --chown=dash:dash /app/.next/static ./.next/static

USER dash

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
