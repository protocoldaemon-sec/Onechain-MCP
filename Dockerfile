FROM node:20-alpine AS builder

WORKDIR /app

# Copy onechain-mcp folder
COPY onechain-mcp/package*.json ./
COPY onechain-mcp/tsconfig.json ./
COPY onechain-mcp/src/ ./src/

# Install dependencies dan build
RUN npm ci && npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

COPY onechain-mcp/package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
ENV ONECHAIN_NETWORK=testnet
ENV PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/health || exit 1

CMD ["node", "dist/index-railway.js"]
