# ──────────────────────────────────────────────────
# Stage 1 — Install production dependencies only
# ──────────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ──────────────────────────────────────────────────
# Stage 2 — Build the NestJS application
# ──────────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ──────────────────────────────────────────────────
# Stage 3 — Production image (minimal)
# ──────────────────────────────────────────────────
FROM node:20-alpine AS production

# Security: run as non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy only what's needed
COPY --from=deps   /app/node_modules ./node_modules
COPY --from=build  /app/dist         ./dist
COPY --from=build  /app/package.json ./package.json

# Set environment
ENV NODE_ENV=production
ENV PORT=4000

# Expose the API port
EXPOSE 4000

# Switch to non-root user
USER appuser

# Start the application
CMD ["node", "dist/main.js"]
