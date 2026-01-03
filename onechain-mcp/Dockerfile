# Dockerfile untuk Railway deployment
# MCP Server dengan SSE transport untuk remote access

FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files dan source
COPY package*.json ./
COPY tsconfig.json ./
COPY src/ ./src/

# Install dependencies dan build
RUN npm ci && npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy built files
COPY --from=builder /app/dist ./dist

# Environment variables untuk Railway
ENV NODE_ENV=production
ENV ONECHAIN_NETWORK=testnet
ENV PORT=3000

# Expose port untuk Railway
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/health || exit 1

# Run server dengan SSE transport
CMD ["node", "dist/index-railway.js"]
