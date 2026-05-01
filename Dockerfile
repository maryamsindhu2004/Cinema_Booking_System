# ── Stage 1: Build React Frontend ─────────────────────────────────
FROM node:18-alpine AS frontend-build

WORKDIR /app/frontend

# Install dependencies
COPY frontend/package*.json ./
RUN npm install --omit=optional

# Build the React app
COPY frontend/ ./
RUN npm run build

# ── Stage 2: Production Backend ────────────────────────────────────
FROM node:18-alpine AS production

WORKDIR /app

# Install backend dependencies (skip Windows-only optional packages)
COPY backend/package*.json ./
RUN npm install --omit=optional

# Copy backend source
COPY backend/ ./

# Copy built React app into backend's public folder
COPY --from=frontend-build /app/frontend/build ./public

EXPOSE 5000

CMD ["node", "index.js"]
