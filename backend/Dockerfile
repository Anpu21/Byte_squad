# ---- Stage 1: Development ----
FROM node:22-alpine AS development

WORKDIR /app

# Install dependencies first (Docker layer caching)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start in watch mode
CMD ["npm", "run", "start:dev"]


# ---- Stage 2: Build ----
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Build the NestJS application
RUN npm run build

# Prune dev dependencies for smaller production image
RUN npm prune --production


# ---- Stage 3: Production ----
FROM node:22-alpine AS production

# Security: run as non-root user
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

WORKDIR /app

# Copy only what's needed for production
COPY --from=build --chown=appuser:appgroup /app/dist ./dist
COPY --from=build --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=build --chown=appuser:appgroup /app/package.json ./package.json
COPY --from=build --chown=appuser:appgroup /app/tsconfig.json ./tsconfig.json
COPY --from=build --chown=appuser:appgroup /app/tsconfig-paths-bootstrap.js ./tsconfig-paths-bootstrap.js

# Set environment variables
ENV NODE_ENV=production

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 3000

# Start the production server
CMD ["node", "-r", "./tsconfig-paths-bootstrap.js", "dist/src/main.js"]