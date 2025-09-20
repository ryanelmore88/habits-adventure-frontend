#!/bin/bash

# EC2 Deployment Script for Habits Adventure Frontend
# Run this script on your EC2 instance

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

echo_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Configuration
BACKEND_API_URL=${1:-"http://localhost:8000"}
COMPOSE_FILE=${2:-"docker-compose.local.yml"}

echo_info "Deploying Habits Adventure Frontend to EC2"
echo_info "Backend API URL: $BACKEND_API_URL"
echo_info "Using compose file: $COMPOSE_FILE"

# Update system packages
echo_info "Updating system packages..."
sudo yum update -y || sudo apt update -y

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo_info "Installing Docker..."
    # Amazon Linux 2
    if [ -f /etc/amazon-linux-release ]; then
        sudo yum install -y docker
        sudo systemctl start docker
        sudo systemctl enable docker
        sudo usermod -a -G docker $USER
    # Ubuntu/Debian
    elif [ -f /etc/debian_version ]; then
        sudo apt install -y docker.io docker-compose
        sudo systemctl start docker
        sudo systemctl enable docker
        sudo usermod -a -G docker $USER
    fi
fi

# Install Docker Compose if not present
if ! command -v docker-compose &> /dev/null; then
    echo_info "Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Clone or update repository
if [ ! -d "habits-adventure-frontend" ]; then
    echo_info "Cloning repository..."
    git clone https://github.com/your-username/habits-adventure-frontend.git
    cd habits-adventure-frontend
else
    echo_info "Updating repository..."
    cd habits-adventure-frontend
    git pull origin main
fi

# Set environment variables
echo_info "Setting up environment..."
cat > .env.production << EOF
VITE_API_BASE_URL=${BACKEND_API_URL}
VITE_APP_NAME=Habits Adventure
VITE_ENABLE_DICE=true
VITE_DEBUG_MODE=false
EOF

# Stop existing containers
echo_info "Stopping existing containers..."
docker-compose -f $COMPOSE_FILE down || true

# Build and start
echo_info "Building and starting containers..."
docker-compose -f $COMPOSE_FILE up --build -d

# Wait for health check
echo_info "Waiting for application to be healthy..."
sleep 30

# Check if frontend is running
if curl -f http://localhost:3000 >/dev/null 2>&1; then
    echo_info "✅ Frontend is running at http://localhost:3000"
else
    echo_warn "⚠️  Frontend may not be fully ready yet. Check logs with: docker-compose -f $COMPOSE_FILE logs"
fi

# Show logs
echo_info "Recent logs:"
docker-compose -f $COMPOSE_FILE logs --tail=10

echo_info "Deployment complete!"
echo_info "Commands to manage your deployment:"
echo_info "  View logs: docker-compose -f $COMPOSE_FILE logs -f"
echo_info "  Stop: docker-compose -f $COMPOSE_FILE down"
echo_info "  Restart: docker-compose -f $COMPOSE_FILE restart"
echo_info "  Update: git pull && docker-compose -f $COMPOSE_FILE up --build -d"