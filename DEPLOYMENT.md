# Deployment Guide

This document provides instructions for deploying the Habits Adventure frontend locally and on AWS.

## Prerequisites

### Local Deployment
- Docker and Docker Compose installed
- Node.js 18+ (for development)
- Git

### AWS Deployment
- AWS CLI installed and configured
- Docker installed
- jq installed (for JSON processing in deploy script)
- Appropriate AWS permissions for ECS, ECR, CloudFormation, etc.

## Local Deployment

### Production-like Environment

```bash
# Build and run the production-ready frontend
docker-compose -f docker-compose.local.yml up --build

# Access the application
open http://localhost:3000
```

This will start:
- Frontend on port 3000 (production build with nginx)
- Backend on port 8000 (if configured)
- Neptune-compatible database on port 8182

### Development Environment

```bash
# Run development environment with hot reload
docker-compose -f docker-compose.dev.yml up --build

# Access the development server
open http://localhost:5173
```

This provides:
- Hot reload for development
- Development database
- Debug mode enabled

### Development with Override

```bash
# Standard development (uses docker-compose.yml + docker-compose.override.yml)
docker-compose up --build
```

## AWS Deployment

### One-Command Deployment

```bash
# Deploy to AWS with defaults
./aws/deploy.sh

# Deploy to specific environment and region
./aws/deploy.sh production us-west-2 https://your-api-domain.com

# Deploy to staging
./aws/deploy.sh staging us-east-1 https://staging-api.your-domain.com
```

### Manual AWS Deployment Steps

#### 1. Deploy Infrastructure

```bash
# Deploy CloudFormation stack
aws cloudformation deploy \
    --template-file aws/cloudformation-infrastructure.yml \
    --stack-name habits-adventure-production-infrastructure \
    --parameter-overrides \
        ProjectName=habits-adventure \
        Environment=production \
        BackendApiUrl=https://your-api-domain.com \
    --capabilities CAPABILITY_NAMED_IAM \
    --region us-west-2
```

#### 2. Build and Push Docker Image

```bash
# Get ECR login
aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin YOUR_ECR_URI

# Build with production settings
docker build -t habits-frontend:latest \
    --build-arg VITE_API_BASE_URL=https://your-api-domain.com \
    --build-arg VITE_APP_NAME="Habits Adventure" \
    --build-arg VITE_ENABLE_DICE=true \
    --build-arg VITE_DEBUG_MODE=false \
    .

# Tag and push
docker tag habits-frontend:latest YOUR_ECR_URI:latest
docker push YOUR_ECR_URI:latest
```

#### 3. Update ECS Service

The CloudFormation template creates the ECS service automatically. For updates:

```bash
# Force new deployment with latest image
aws ecs update-service \
    --cluster habits-adventure-production \
    --service habits-adventure-frontend-production \
    --force-new-deployment \
    --region us-west-2
```

## Configuration

### Environment Variables

The application uses different environment variables for different deployment scenarios:

#### Local Development (.env)
```bash
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_NAME=Habits Adventure
VITE_ENABLE_DICE=true
VITE_DEBUG_MODE=true
```

#### Docker Build Args
```bash
# These are passed during docker build
VITE_API_BASE_URL=https://your-api-domain.com
VITE_APP_NAME="Habits Adventure"
VITE_ENABLE_DICE=true
VITE_DEBUG_MODE=false
```

#### AWS ECS Environment
Environment variables are set in the ECS task definition and can be updated via CloudFormation parameters.

### Backend Integration

Ensure your backend API:
- Is accessible from the frontend's network location
- Has CORS configured for the frontend domain
- Uses HTTPS in production
- Has proper health check endpoints

### Database Configuration

The docker-compose files include a Neptune-compatible graph database (Gremlin server). For AWS production:
- Use Amazon Neptune for the graph database
- Update backend connection strings
- Configure VPC networking for database access

## Monitoring and Debugging

### Local Debugging

```bash
# View logs
docker-compose logs -f habits-frontend

# Execute commands in container
docker-compose exec habits-frontend sh

# Check health
curl http://localhost:3000
```

### AWS Monitoring

```bash
# Check ECS service status
aws ecs describe-services \
    --cluster habits-adventure-production \
    --services habits-adventure-frontend-production

# View CloudWatch logs
aws logs tail /ecs/habits-adventure-production --follow

# Check ALB target health
aws elbv2 describe-target-health \
    --target-group-arn YOUR_TARGET_GROUP_ARN
```

### Common Issues

1. **Dice assets not loading**: Ensure the postinstall script ran successfully
2. **CORS errors**: Check backend ALLOWED_ORIGINS configuration
3. **404 on refresh**: Ensure nginx try_files directive is configured for SPA routing
4. **Build failures**: Check Docker build args match environment requirements

## Security Considerations

### Production Checklist
- [ ] Use HTTPS with proper SSL certificates
- [ ] Configure security groups to allow only necessary traffic
- [ ] Use least-privilege IAM roles
- [ ] Enable CloudTrail logging
- [ ] Set up monitoring and alerting
- [ ] Configure backup strategies for persistent data
- [ ] Review and rotate secrets regularly

### Network Security
- Frontend communicates only with authorized backend
- Database access restricted to backend services
- Load balancer configured with appropriate security groups
- VPC configured with proper subnet isolation

## Scaling

### Horizontal Scaling
- Adjust ECS service desired count
- Configure auto-scaling based on CPU/memory usage
- Use multiple availability zones for high availability

### Performance Optimization
- Enable CloudFront CDN for static assets
- Configure appropriate cache headers
- Optimize Docker image layers
- Use multi-stage builds to minimize image size

## Rollback Procedures

### AWS Rollback
```bash
# Rollback to previous task definition
aws ecs update-service \
    --cluster habits-adventure-production \
    --service habits-adventure-frontend-production \
    --task-definition PREVIOUS_TASK_DEFINITION_ARN

# Rollback CloudFormation stack
aws cloudformation cancel-update-stack --stack-name STACK_NAME
# Then deploy previous template version
```

### Local Rollback
```bash
# Stop and remove containers
docker-compose down

# Use specific image tag
docker-compose up --build
```