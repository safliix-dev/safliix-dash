# =============================================================================
# Dockerfile — safliix-dash (Next.js 15 standalone)
# Multi-stage build: deps -> builder -> runtime
# Calque sur sachrist
# NOTE: node_modules complet copié en runtime (solution temporaire)
# → Migration vers stage migrator dédié prévue (voir DEVOPS_PRISMA_MIGRATIONS.md)
# =============================================================================

# ---------------------------------------------------------------------------
# Stage 1: Install dependencies
# ---------------------------------------------------------------------------
FROM node:20-alpine AS deps

# Installation des dépendances système pour better-sqlite3 (node-gyp)
# - python3 : requis par node-gyp
# - build-base : gcc, g++, make (compilateur C++)
# - libc6-compat : déjà présent, on le garde
RUN apk add --no-cache python3 build-base libc6-compat

WORKDIR /app

# Copy package manifests
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# ---------------------------------------------------------------------------
# Stage 2: Build the application
# ---------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies from stage 1
COPY --from=deps /app/node_modules ./node_modules

# Copy all source files
COPY . .

# NEXT_PUBLIC_* vars doivent etre baked au build (pas injectables a runtime)
# Passer via: docker build --build-arg NEXT_PUBLIC_API_URL=...
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SOCKET_URL
ARG NEXT_PUBLIC_PROCESSOR_SOCKET_URL
ARG NEXT_PUBLIC_KEYCLOAK_URL
ARG NEXT_PUBLIC_KEYCLOAK_REALM
ARG NEXT_PUBLIC_KEYCLOAK_CLIENT_ID
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL
ENV NEXT_PUBLIC_PROCESSOR_SOCKET_URL=$NEXT_PUBLIC_PROCESSOR_SOCKET_URL
ENV NEXT_PUBLIC_KEYCLOAK_URL=$NEXT_PUBLIC_KEYCLOAK_URL
ENV NEXT_PUBLIC_KEYCLOAK_REALM=$NEXT_PUBLIC_KEYCLOAK_REALM
ENV NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=$NEXT_PUBLIC_KEYCLOAK_CLIENT_ID

# Generate Prisma client before build (required: src/generated/prisma/client)
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate
RUN npm run build

# ---------------------------------------------------------------------------
# Stage 3: Production runtime
# ---------------------------------------------------------------------------
FROM node:20-alpine AS runtime

RUN apk add --no-cache libc6-compat

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 10001 nodejs \
    && adduser --system --uid 10001 nextjs

# Copy the standalone output
COPY --from=builder /app/.next/standalone ./

# Copy static assets
COPY --from=builder /app/.next/static ./.next/static

# Copy public directory
COPY --from=builder /app/public ./public

# Copy Prisma migrations for migrate deploy at startup
COPY --from=builder /app/prisma ./prisma


# ⭐ AJOUT : Copier le fichier de configuration Prisma (racine)
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

# Copie complète des node_modules — inclut toutes les dépendances transitives
# de Prisma CLI (valibot, effect, fast-check, etc.)
# Solution temporaire en attendant le stage migrator dédié
COPY --from=deps /app/node_modules ./node_modules

# Persistent volume mount point for SQLite database file
RUN mkdir -p /app/data

# Set correct ownership
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose the application port
EXPOSE 3000

# Environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL="file:/app/data/sessions.db"

# Health check (aligned on INFRA-FAANG1)
HEALTHCHECK --interval=15s --timeout=5s --start-period=15s --retries=2 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Run migrations then start
CMD ["sh", "-c", "node node_modules/prisma/build/index.js migrate deploy && node server.js"]