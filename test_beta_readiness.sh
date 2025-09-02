#!/bin/bash

# PayTrackr Beta Readiness Test Script
echo "🧪 PayTrackr Beta Readiness Test"
echo "================================"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test counter
PASSED=0
FAILED=0

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
    ((PASSED++))
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    ((FAILED++))
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Test 1: Check if backend dependencies are installed
echo "📦 Testing Backend Dependencies..."
if [ -d "backend/node_modules" ]; then
    print_success "Backend dependencies installed"
else
    print_error "Backend dependencies missing"
fi

# Test 2: Check if mobile dependencies are installed
echo "📱 Testing Mobile Dependencies..."
if [ -d "mobile/node_modules" ]; then
    print_success "Mobile dependencies installed"
else
    print_error "Mobile dependencies missing"
fi

# Test 3: Check if .env files exist
echo "🔐 Testing Environment Configuration..."
if [ -f "backend/.env" ]; then
    print_success "Backend .env file exists"
else
    print_warning "Backend .env file missing (copy from .env.example)"
fi

# Test 4: Check if package.json scripts exist
echo "📜 Testing Package Scripts..."
if grep -q '"dev"' "package.json"; then
    print_success "Development script configured"
else
    print_error "Development script missing"
fi

# Test 5: Check for security vulnerabilities
echo "🔒 Testing Security Status..."
npm audit --audit-level=high --json > /dev/null 2>&1
if [ $? -eq 0 ]; then
    AUDIT_RESULT=$(npm audit --audit-level=high --json 2>/dev/null | grep -o '"severity":[^,]*' | wc -l)
    if [ "$AUDIT_RESULT" -eq 0 ]; then
        print_success "No high-severity vulnerabilities found"
    else
        print_error "High-severity vulnerabilities detected"
    fi
else
    print_warning "Could not run security audit"
fi

# Test 6: Check backend structure
echo "🏗️  Testing Backend Structure..."
REQUIRED_FILES=("backend/src/app.js" "backend/src/routes/auth.js" "backend/package.json")
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_success "Backend file exists: $file"
    else
        print_error "Backend file missing: $file"
    fi
done

# Test 7: Check mobile structure
echo "📱 Testing Mobile Structure..."
MOBILE_FILES=("mobile/App.js" "mobile/src/screens/HomeScreen.js" "mobile/package.json")
for file in "${MOBILE_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_success "Mobile file exists: $file"
    else
        print_error "Mobile file missing: $file"
    fi
done

# Test 8: Check for TODO comments
echo "📝 Testing Code Quality..."
TODO_COUNT=$(find . -name "*.js" -not -path "./node_modules/*" -not -path "./mobile/node_modules/*" -not -path "./backend/node_modules/*" -exec grep -l "TODO\|FIXME\|BUG\|HACK\|XXX" {} \; | wc -l)
if [ "$TODO_COUNT" -eq 0 ]; then
    print_success "No TODO/FIXME comments found"
else
    print_warning "Found $TODO_COUNT files with TODO/FIXME comments"
fi

# Test 9: Check if README is comprehensive
echo "📖 Testing Documentation..."
if [ -f "README.md" ]; then
    README_SIZE=$(wc -c < README.md)
    if [ "$README_SIZE" -gt 10000 ]; then
        print_success "Comprehensive README documentation"
    else
        print_warning "README might need more documentation"
    fi
else
    print_error "README.md missing"
fi

# Test 10: Check for test files
echo "🧪 Testing Test Infrastructure..."
if [ -f "backend/package.json" ]; then
    if grep -q '"test"' "backend/package.json"; then
        print_success "Backend test script configured"
    else
        print_warning "Backend test script not configured"
    fi
fi

# Summary
echo ""
echo "📊 Test Results Summary:"
echo "========================"
echo "✅ Passed: $PASSED"
echo "❌ Failed: $FAILED"

TOTAL=$((PASSED + FAILED))
SUCCESS_RATE=$((PASSED * 100 / TOTAL))

if [ $SUCCESS_RATE -ge 80 ]; then
    echo -e "${GREEN}🎉 Beta Readiness: $SUCCESS_RATE% - READY FOR BETA!${NC}"
elif [ $SUCCESS_RATE -ge 60 ]; then
    echo -e "${YELLOW}⚠️  Beta Readiness: $SUCCESS_RATE% - NEEDS MINOR FIXES${NC}"
else
    echo -e "${RED}❌ Beta Readiness: $SUCCESS_RATE% - REQUIRES ATTENTION${NC}"
fi

echo ""
echo "📋 Next Steps:"
if [ $FAILED -gt 0 ]; then
    echo "1. Address failed tests above"
fi
echo "2. Run 'npm run dev' to start development environment"
echo "3. Test core functionality manually"
echo "4. Set up beta distribution channels"
echo "5. Create user feedback collection system"

echo ""
echo "🚀 Ready to proceed with beta testing when all critical issues are resolved!"
