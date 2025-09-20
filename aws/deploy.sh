#!/bin/bash

# Habits Adventure Frontend AWS Deployment Script
# Usage: ./deploy.sh [environment] [region] [backend-api-url]
# Example: ./deploy.sh production us-west-2 https://api.habits-adventure.com

set -e

# Default values
ENVIRONMENT=${1:-production}
AWS_REGION=${2:-us-west-2}
BACKEND_API_URL=${3:-https://api.habits-adventure.com}
PROJECT_NAME="habits-adventure"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

echo_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

echo_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if AWS CLI is installed and configured
if ! command -v aws &> /dev/null; then
    echo_error "AWS CLI is not installed. Please install it first."
    exit 1
fi

if ! aws sts get-caller-identity &> /dev/null; then
    echo_error "AWS CLI is not configured. Please run 'aws configure' first."
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo_info "Using AWS Account: $ACCOUNT_ID"
echo_info "Deploying to region: $AWS_REGION"
echo_info "Environment: $ENVIRONMENT"
echo_info "Backend API URL: $BACKEND_API_URL"

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo_error "Docker is not running. Please start Docker first."
    exit 1
fi

# Step 1: Deploy CloudFormation infrastructure
echo_info "Deploying CloudFormation infrastructure..."
STACK_NAME="${PROJECT_NAME}-${ENVIRONMENT}-infrastructure"

aws cloudformation deploy \
    --template-file aws/cloudformation-infrastructure.yml \
    --stack-name $STACK_NAME \
    --parameter-overrides \
        ProjectName=$PROJECT_NAME \
        Environment=$ENVIRONMENT \
        BackendApiUrl=$BACKEND_API_URL \
    --capabilities CAPABILITY_NAMED_IAM \
    --region $AWS_REGION

# Get ECR repository URI from CloudFormation outputs
ECR_URI=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $AWS_REGION \
    --query "Stacks[0].Outputs[?OutputKey=='ECRRepository'].OutputValue" \
    --output text)

echo_info "ECR Repository: $ECR_URI"

# Step 2: Build and push Docker image
echo_info "Building Docker image..."

# Get ECR login token
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_URI

# Build the image with build args
docker build -t habits-frontend:latest \
    --build-arg VITE_API_BASE_URL=$BACKEND_API_URL \
    --build-arg VITE_APP_NAME="Habits Adventure" \
    --build-arg VITE_ENABLE_DICE=true \
    --build-arg VITE_DEBUG_MODE=false \
    .

# Tag and push to ECR
docker tag habits-frontend:latest $ECR_URI:latest
docker tag habits-frontend:latest $ECR_URI:$(git rev-parse --short HEAD)

echo_info "Pushing Docker image to ECR..."
docker push $ECR_URI:latest
docker push $ECR_URI:$(git rev-parse --short HEAD)

# Step 3: Update ECS task definition and update service
echo_info "Updating ECS task definition..."

# Get current task definition
TASK_DEFINITION_ARN=$(aws ecs describe-services \
    --cluster ${PROJECT_NAME}-${ENVIRONMENT} \
    --services ${PROJECT_NAME}-frontend-${ENVIRONMENT} \
    --region $AWS_REGION \
    --query "services[0].taskDefinition" \
    --output text 2>/dev/null || echo "")

if [ -n "$TASK_DEFINITION_ARN" ]; then
    echo_info "Found existing task definition: $TASK_DEFINITION_ARN"
    
    # Get the current task definition and update the image
    aws ecs describe-task-definition \
        --task-definition $TASK_DEFINITION_ARN \
        --region $AWS_REGION \
        --query "taskDefinition" > current-task-def.json
    
    # Update the image in the task definition
    jq --arg image "$ECR_URI:latest" \
        '.containerDefinitions[0].image = $image | del(.taskDefinitionArn, .revision, .status, .requiresAttributes, .placementConstraints, .compatibilities, .registeredAt, .registeredBy)' \
        current-task-def.json > updated-task-def.json
    
    # Register new task definition
    NEW_TASK_DEF=$(aws ecs register-task-definition \
        --cli-input-json file://updated-task-def.json \
        --region $AWS_REGION \
        --query "taskDefinition.taskDefinitionArn" \
        --output text)
    
    echo_info "New task definition registered: $NEW_TASK_DEF"
    
    # Update the service
    echo_info "Updating ECS service..."
    aws ecs update-service \
        --cluster ${PROJECT_NAME}-${ENVIRONMENT} \
        --service ${PROJECT_NAME}-frontend-${ENVIRONMENT} \
        --task-definition $NEW_TASK_DEF \
        --region $AWS_REGION >/dev/null
    
    # Wait for service to stabilize
    echo_info "Waiting for service to stabilize..."
    aws ecs wait services-stable \
        --cluster ${PROJECT_NAME}-${ENVIRONMENT} \
        --services ${PROJECT_NAME}-frontend-${ENVIRONMENT} \
        --region $AWS_REGION
    
    # Clean up temporary files
    rm -f current-task-def.json updated-task-def.json
    
    echo_info "Service updated successfully!"
else
    echo_warn "ECS service not found. This might be the first deployment."
    echo_warn "The service will be created by CloudFormation with the latest image."
fi

# Step 4: Get the application URL
ALB_DNS=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $AWS_REGION \
    --query "Stacks[0].Outputs[?OutputKey=='LoadBalancerDNS'].OutputValue" \
    --output text)

echo_info "Deployment completed successfully!"
echo_info "Application URL: http://$ALB_DNS"
echo_info "Note: It may take a few minutes for the service to be fully available."

# Optional: Open the URL in default browser (macOS/Linux)
if command -v open &> /dev/null; then
    echo_warn "Opening application in browser..."
    open "http://$ALB_DNS"
elif command -v xdg-open &> /dev/null; then
    echo_warn "Opening application in browser..."
    xdg-open "http://$ALB_DNS"
fi