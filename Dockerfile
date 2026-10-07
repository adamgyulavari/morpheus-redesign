# Morpheus Színműhely — Next.js site + Payload CMS, one Node server.
# The build needs no database: no page is rendered at build time.
# On start, pending migrations run (prodMigrations, via instrumentation.ts), then the server listens on 3000.

FROM node:24-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# 1. dependencies
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# 2. build (output: 'standalone')
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# 3. slim runtime: only the traced standalone server, static assets and public files
FROM node:24-alpine AS runtime
RUN apk add --no-cache libc6-compat
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs \
 # uploads go to S3; ./media is only used when S3 is not configured (mount a volume there)
 && mkdir -p /app/media && chown nextjs:nodejs /app/media
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public ./public
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/users/me > /dev/null || exit 1
CMD ["node", "server.js"]
