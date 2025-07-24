# File: frontend/Dockerfile
# Multi-stage build for optimized production deployment

# Build stage
FROM node:18-alpine as builder

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production --silent

# Copy dice assets (required for 3D dice functionality)
RUN mkdir -p public/assets/dice-box && \
    cp -R node_modules/@3d-dice/dice-box/dist/assets/* public/assets/dice-box/ || true

# Copy source code
COPY . .

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

# Copy nginx configuration
COPY <<EOF /etc/nginx/conf.d/default.conf
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Enable gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Handle client-side routing (React Router)
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API proxy (optional - remove if backend is on different domain)
    location /api/ {
        proxy_pass \${VITE_API_BASE_URL};
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]