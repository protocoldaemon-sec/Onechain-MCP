FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and source
COPY package*.json ./
COPY tsconfig.json ./
COPY src/ ./src/

# Install all dependencies and build
RUN npm ci && npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Set default network
ENV ONECHAIN_NETWORK=testnet

# Run the MCP server
CMD ["node", "dist/index.js"]
