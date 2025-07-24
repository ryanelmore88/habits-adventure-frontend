# File: frontend/Dockerfile (SIMPLIFIED VERSION)
# Multi-stage build for optimized production deployment

# Build stage
FROM node:18-alpine as builder

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./

# Install ALL dependencies (including dev dependencies needed for build)
RUN npm ci --silent

# Copy source code first
COPY . .

# Copy dice assets AFTER installing dependencies (required for 3D dice functionality)
RUN mkdir -p public/assets/dice-box && \
    cp -R node_modules/@3d-dice/dice-box/dist/assets/* public/assets/dice-box/ || true

# Create production environment file
ARG VITE_API_BASE_URL=http://localhost:8000
ARG VITE_APP_NAME="Habits Adventure"
ARG VITE_ENABLE_DICE=true
ARG VITE_DEBUG_MODE=false

RUN echo "VITE_API_BASE_URL=${VITE_API_BASE_URL}" > .env.production && \
    echo "VITE_APP_NAME=${VITE_APP_NAME}" >> .env.production && \
    echo "VITE_ENABLE_DICE=${VITE_ENABLE_DICE}" >> .env.production && \
    echo "VITE_DEBUG_MODE=${VITE_DEBUG_MODE}" >> .env.production

# Build the application
RUN npm run build

# Production stage with nginx
FROM nginx:alpine as production

# Install curl for health checks
RUN apk add --no-cache curl

# Copy built app from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Create simple nginx configuration using echo
RUN echo 'server {' > /etc/nginx/conf.d/default.conf && \
    echo '    listen 80;' >> /etc/nginx/conf.d/default.conf && \
    echo '    server_name localhost;' >> /etc/nginx/conf.d/default.conf && \
    echo '    root /usr/share/nginx/html;' >> /etc/nginx/conf.d/default.conf && \
    echo '    index index.html;' >> /etc/nginx/conf.d/default.conf && \
    echo '    location / {' >> /etc/nginx/conf.d/default.conf && \
    echo '        try_files $uri $uri/ /index.html;' >> /etc/nginx/conf.d/default.conf && \
    echo '    }' >> /etc/nginx/conf.d/default.conf && \
    echo '}' >> /etc/nginx/conf.d/default.conf

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]