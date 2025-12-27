# ---- Build stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy Prisma schema
COPY prisma ./prisma

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY . .

# Build application
RUN npm run build

# Verify build output exists
RUN ls -la /app/dist/ || (echo "Build failed - dist directory is empty" && exit 1)
RUN test -f /app/dist/main.js || (echo "Build failed - main.js not found" && exit 1)

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
CMD ["node", "dist/main"]
