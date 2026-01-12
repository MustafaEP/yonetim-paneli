# ---- Build stage ----
FROM node:20-alpine AS builder

WORKDIR /app

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
RUN npm install prisma@6.1 --no-save && npx prisma generate

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
FROM node:20-alpine

WORKDIR /app

# Install production dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy Prisma files
COPY prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

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
