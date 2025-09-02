#!/bin/bash

# PayTrackr Beta Testing Setup Script
echo "🚀 Setting up PayTrackr for Beta Testing"
echo "========================================"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Step 1: Install all dependencies
print_step "Installing all dependencies..."
npm run install:all
if [ $? -eq 0 ]; then
    print_success "All dependencies installed successfully"
else
    print_warning "Some dependencies might have failed to install"
fi

# Step 2: Set up environment variables
print_step "Setting up environment configuration..."
if [ ! -f "backend/.env" ]; then
    cp backend/.env.example backend/.env
    print_warning "Please edit backend/.env with your MongoDB URI and JWT secret"
else
    print_success "Environment file already exists"
fi

# Step 3: Test backend startup
print_step "Testing backend startup..."
cd backend
timeout 5s npm start > /dev/null 2>&1
if [ $? -eq 0 ]; then
    print_success "Backend starts successfully"
else
    print_warning "Backend startup test failed - check configuration"
fi
cd ..

# Step 4: Test mobile build
print_step "Testing mobile development setup..."
cd mobile
if [ -f "package.json" ] && [ -d "node_modules" ]; then
    print_success "Mobile development environment ready"
else
    print_warning "Mobile setup might need attention"
fi
cd ..

# Step 5: Create beta testing instructions
print_step "Creating beta testing instructions..."
cat > BETA_INSTRUCTIONS.md << 'EOF'
# PayTrackr Beta Testing Instructions

## 🚀 Quick Start

1. **Clone and Setup:**
   ```bash
   git clone <repository-url>
   cd paytrackr
   npm run install:all
   ```

2. **Configure Environment:**
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your MongoDB connection
   ```

3. **Start Development:**
   ```bash
   npm run dev
   ```

4. **Test the App:**
   - Backend API: http://localhost:3000
   - Mobile App: Use Expo Go or run on device

## 🧪 Testing Checklist

### Core Features to Test:
- [ ] User registration and login
- [ ] Add/edit/delete transactions
- [ ] Bill management and reminders
- [ ] Income tracking
- [ ] Analytics dashboard
- [ ] Referral system
- [ ] Dark mode toggle
- [ ] Data export

### Performance to Test:
- [ ] App startup time
- [ ] Screen load times
- [ ] API response times
- [ ] Memory usage

## 🐛 Bug Reporting

Please report bugs using this format:
```
Platform: iOS/Android
Device: [Device model]
Issue: [Brief description]
Steps: [How to reproduce]
Expected: [What should happen]
Actual: [What happens]
```

## 📞 Support

For beta testing support, contact: favour.nwachukwu@example.com
EOF

print_success "Beta testing instructions created"

# Step 6: Final summary
echo ""
echo "🎉 PayTrackr Beta Setup Complete!"
echo "================================="
echo ""
echo "📋 What you can do now:"
echo "1. Run 'npm run dev' to start the development environment"
echo "2. Test the app on your device using Expo Go"
echo "3. Share with beta testers using the instructions in BETA_INSTRUCTIONS.md"
echo "4. Monitor performance and collect feedback"
echo ""
echo "📱 For mobile testing:"
echo "- Install Expo Go on your device"
echo "- Scan the QR code shown when you run 'npm run dev'"
echo "- Or run directly on iOS/Android with 'npm run mobile:ios' or 'npm run mobile:android'"
echo ""
echo "🔗 Useful links:"
echo "- Backend API: http://localhost:3000/api"
echo "- Mobile App: Expo development server"
echo "- Documentation: README.md"
echo "- Beta Checklist: BETA_TESTING_CHECKLIST.md"
echo ""
print_success "Setup complete! Ready for beta testing! 🎯"
