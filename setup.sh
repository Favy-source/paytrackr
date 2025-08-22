#!/bin/bash

# PayTrackr Setup Script
echo "🚀 Setting up PayTrackr - Personal Finance Management App"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 16 or higher."
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 16 ]; then
        print_error "Node.js version 16 or higher is required. Current version: $(node --version)"
        exit 1
    fi
    
    print_success "Node.js $(node --version) is installed"
}

# Check if MongoDB is installed
check_mongodb() {
    if ! command -v mongod &> /dev/null; then
        print_warning "MongoDB is not installed. Please install MongoDB Community Edition."
        print_status "Visit: https://docs.mongodb.com/manual/installation/"
    else
        print_success "MongoDB is installed"
    fi
}

# Install backend dependencies
install_backend() {
    print_status "Installing backend dependencies..."
    cd backend
    
    if [ ! -f package.json ]; then
        print_error "Backend package.json not found!"
        exit 1
    fi
    
    npm install
    if [ $? -eq 0 ]; then
        print_success "Backend dependencies installed"
    else
        print_error "Failed to install backend dependencies"
        exit 1
    fi
    
    cd ..
}

# Install mobile dependencies
install_mobile() {
    print_status "Installing mobile app dependencies..."
    cd mobile
    
    if [ ! -f package.json ]; then
        print_error "Mobile package.json not found!"
        exit 1
    fi
    
    npm install
    if [ $? -eq 0 ]; then
        print_success "Mobile dependencies installed"
    else
        print_error "Failed to install mobile dependencies"
        exit 1
    fi
    
    cd ..
}

# Setup environment files
setup_env() {
    print_status "Setting up environment files..."
    
    # Backend environment
    if [ ! -f backend/.env ]; then
        if [ -f backend/.env.example ]; then
            cp backend/.env.example backend/.env
            print_success "Created backend/.env from example"
            print_warning "Please update backend/.env with your configuration"
        else
            print_error "backend/.env.example not found!"
        fi
    else
        print_success "Backend environment file exists"
    fi
}

# Check if Expo CLI is installed
check_expo() {
    if ! command -v expo &> /dev/null; then
        print_status "Installing Expo CLI..."
        npm install -g @expo/cli
        if [ $? -eq 0 ]; then
            print_success "Expo CLI installed"
        else
            print_error "Failed to install Expo CLI"
            exit 1
        fi
    else
        print_success "Expo CLI is installed"
    fi
}

# Main setup function
main() {
    echo ""
    print_status "Starting PayTrackr setup..."
    echo ""
    
    # Check prerequisites
    check_node
    check_mongodb
    check_expo
    
    echo ""
    print_status "Installing dependencies..."
    
    # Install dependencies
    install_backend
    install_mobile
    
    # Setup environment
    setup_env
    
    echo ""
    print_success "🎉 Setup completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Update backend/.env with your MongoDB URI and JWT secret"
    echo "2. Start MongoDB service"
    echo "3. Run 'npm run backend:dev' to start the backend server"
    echo "4. Run 'npm run mobile:start' to start the mobile app"
    echo ""
    echo "Or run 'npm run dev' to start both simultaneously"
    echo ""
    print_status "Happy coding! 🚀"
}

# Run main function
main
