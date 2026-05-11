# ---- Stage 1: Development ----
FROM node:22-alpine AS development

WORKDIR /app

# Install pnpm globally — pinned to the version in package.json's packageManager field.
# Using `npm install -g` instead of corepack because npm's HTTP retry behavior is
# more resilient on flaky networks (corepack downloads the pnpm tarball directly
# on first use, which fails hard when the container can't reach registry.npmjs.org).
RUN npm install -g pnpm@10.33.2

# Install dependencies first (Docker layer caching)
COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start in watch mode
CMD ["pnpm", "run", "start:dev"]


# ---- Stage 2: Build ----
FROM node:22-alpine AS build

WORKDIR /app

RUN npm install -g pnpm@10.33.2

COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

COPY . .

# Build the NestJS application
RUN pnpm run build

# Strip dev dependencies for a smaller production image
RUN pnpm prune --prod


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
