# Stage 1: Build the React frontend
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy full source and build
COPY . .
RUN npm run build

# Stage 2: Minimal runtime image
FROM node:20-slim

# Install Python3 (required by yt-dlp)
# We use Debian-slim so that the native pre-compiled glibc Linux binaries 
# downloaded by SauceBox's auto-provisioner work flawlessly.
RUN apt-get update && \
    apt-get install -y python3 && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install only production dependencies for the headless server
COPY package*.json ./
RUN npm ci --omit=dev

# Copy the built frontend from builder stage
COPY --from=builder /app/dist ./dist

# Copy the Electron IPC backend modules and the standalone headless server
COPY electron/ ./electron/
COPY server.js ./

# Set environment flags to tell SauceBox it is running headlessly in Docker
ENV SAUCEBOX_DOCKER=true
ENV SAUCEBOX_DATA=/data
ENV PORT=8080

# Expose Web API and Frontend UI port
EXPOSE 8080

# Use array syntax for reliable signal handling
CMD ["node", "server.js"]
