# ---- Build stage ----
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Avoid any interactive apt prompts during Docker build.
ENV DEBIAN_FRONTEND=noninteractive

# Optional: use an NPM registry mirror to speed up installs on slow/blocked VPS networks
ARG NPM_REGISTRY
ENV npm_config_audit=false
ENV npm_config_fund=false
RUN if [ -n "$NPM_REGISTRY" ]; then npm config set registry "$NPM_REGISTRY"; fi && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-timeout 300000

# Optional: allow overriding Prisma engines download base (useful in restricted networks)
ARG PRISMA_ENGINES_MIRROR
ENV PRISMA_ENGINES_MIRROR=${PRISMA_ENGINES_MIRROR}

# Prisma (and some native deps) rely on OpenSSL + CA certificates.
# Alpine images are more likely to hit Prisma engine / OpenSSL friction.
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    openssl \
  && rm -rf /var/lib/apt/lists/*

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy Prisma schema
COPY prisma ./prisma

# Generate Prisma Client
# NOTE:
# - In this project, @prisma/client is pinned to 6.1 while the devDependency
#   "prisma" version in package.json / package-lock can drift.
# - To avoid "Prisma Client and CLI version mismatch" errors during Docker builds,
#   we explicitly install a matching Prisma CLI version here (without modifying package.json).
# - Install corepack and use npm cache to speed up binary downloads
RUN npm install prisma@6.1 --no-save
ENV PRISMA_BINARY_CACHE_DIR=/root/.cache/prisma
RUN mkdir -p $PRISMA_BINARY_CACHE_DIR
RUN npx prisma generate

# Copy source code
COPY . .

# Build application
RUN npm run build

# Verify build output exists and show contents
RUN echo "=== Build output directory ===" && \
    ls -la /app/dist/ || (echo "Build failed - dist directory is empty" && exit 1) && \
    echo "=== Looking for main files ===" && \
    find /app/dist -name "main.*" -type f || echo "No main.* files found" && \
    echo "=== Dist structure ===" && \
    find /app/dist -type f | head -20 && \
    echo "=== Checking for main.js in common locations ===" && \
    (test -f /app/dist/main.js && echo "Found: dist/main.js") || \
    (test -f /app/dist/src/main.js && echo "Found: dist/src/main.js") || \
    (echo "WARNING: main.js not found in expected locations" && find /app/dist -name "*.js" | head -5)

# ---- Production stage ----
FROM node:20-bookworm-slim

WORKDIR /app

# Avoid any interactive apt prompts during Docker build.
ENV DEBIAN_FRONTEND=noninteractive

# Optional: use an NPM registry mirror to speed up installs on slow/blocked VPS networks
ARG NPM_REGISTRY
ENV npm_config_audit=false
ENV npm_config_fund=false
RUN if [ -n "$NPM_REGISTRY" ]; then npm config set registry "$NPM_REGISTRY"; fi && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-timeout 300000

# Optional: allow overriding Prisma engines download base (useful in restricted networks)
ARG PRISMA_ENGINES_MIRROR
ENV PRISMA_ENGINES_MIRROR=${PRISMA_ENGINES_MIRROR}

# System dependencies for Prisma engines (OpenSSL).
# Puppeteer deps are optional and can be enabled via build-arg INSTALL_PUPPETEER_DEPS=1.
ARG INSTALL_PUPPETEER_DEPS=1
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    openssl \
  && rm -rf /var/lib/apt/lists/*

# Optional: Puppeteer bundled Chromium runtime libs.
# If your VPS build hangs on heavy apt postinst steps (e.g. shared-mime-info),
# set INSTALL_PUPPETEER_DEPS=0 to skip these (PDF generation will not work).
RUN if [ "$INSTALL_PUPPETEER_DEPS" = "1" ]; then \
      apt-get update && apt-get install -y --no-install-recommends \
        fonts-liberation \
        libasound2 \
        libatk-bridge2.0-0 \
        libatk1.0-0 \
        libcups2 \
        libdbus-1-3 \
        libdrm2 \
        libgbm1 \
        libnspr4 \
        libnss3 \
        libpango-1.0-0 \
        libpangocairo-1.0-0 \
        libx11-xcb1 \
        libxcomposite1 \
        libxdamage1 \
        libxrandr2 \
        libxshmfence1 \
        libgtk-3-0 \
      && rm -rf /var/lib/apt/lists/* ; \
    else \
      echo "Skipping Puppeteer/Chromium system deps (INSTALL_PUPPETEER_DEPS=0)"; \
    fi

# Install production dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy Prisma files
COPY prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

# Ensure Prisma CLI version matches @prisma/client (6.1) at runtime as well.
# This avoids runtime errors such as "ensureBinariesExist is not a function"
# that come from version mismatches between the Prisma CLI and client.
RUN npm install prisma@6.1 --no-save

# Copy built application
COPY --from=builder /app/dist ./dist

# Verify dist directory exists in production stage
RUN ls -la /app/dist/ || (echo "dist directory not found in production stage" && exit 1)

# Create uploads directory
RUN mkdir -p uploads/documents uploads/logos && \
    chmod -R 755 uploads

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Start script that runs migrations and starts the app
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

ENTRYPOINT ["./docker-entrypoint.sh"]
# Try different possible paths for main.js
CMD ["sh", "-c", "if [ -f dist/main.js ]; then node dist/main.js; elif [ -f dist/src/main.js ]; then node dist/src/main.js; else echo 'Error: main.js not found' && find dist -name '*.js' | head -5 && exit 1; fi"]
