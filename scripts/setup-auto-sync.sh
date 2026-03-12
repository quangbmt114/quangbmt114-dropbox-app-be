#!/bin/bash

# 🚀 Quick Setup: Auto-sync Types (Backend → Frontend)
# Run this script to setup automatic type generation

set -e

echo "🎯 Auto-Sync Types Setup"
echo "========================"
echo ""

# Ask user which solution
echo "Choose your solution:"
echo "1) GitHub Actions (separate repos) - RECOMMENDED"
echo "2) Pre-commit Hook (same repo/monorepo)"
echo "3) Manual setup (I'll do it myself)"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
  1)
    echo ""
    echo "📦 Setting up GitHub Actions..."
    echo ""
    
    # Create workflows directory
    mkdir -p .github/workflows
    
    # Create workflow file
    cat > .github/workflows/export-swagger.yml << 'EOF'
name: Export Swagger Schema

on:
  push:
    branches:
      - main
      - develop
    paths:
      - 'src/**/*.dto.ts'
      - 'src/**/*.controller.ts'
      - 'src/**/*.ts'

jobs:
  export-schema:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Generate Swagger schema
        run: npm run swagger:export
      
      - name: Upload schema as artifact
        uses: actions/upload-artifact@v3
        with:
          name: swagger-schema
          path: swagger.json
          retention-days: 30
      
      - name: Commit schema (optional)
        run: |
          git config user.name "GitHub Actions Bot"
          git config user.email "actions@github.com"
          git add swagger.json dist/swagger.* || true
          git diff --quiet && git diff --staged --quiet || git commit -m "🤖 Update API schema"
          git push || true
EOF
    
    echo "✅ Created .github/workflows/export-swagger.yml"
    echo ""
    echo "📝 Next steps:"
    echo "1. Push to GitHub: git add .github/workflows && git commit -m 'Add auto-export workflow' && git push"
    echo "2. Schema will auto-export on every push to main/develop"
    echo "3. Download from: Actions → Export Swagger Schema → Artifacts"
    echo ""
    echo "📚 For frontend setup, see: AUTO_SYNC_TYPES_SOLUTIONS.md"
    ;;
    
  2)
    echo ""
    echo "🪝 Setting up pre-commit hook..."
    echo ""
    
    # Check if husky is installed
    if ! npm list husky &>/dev/null; then
      echo "📦 Installing husky..."
      npm install --save-dev husky
    fi
    
    # Initialize husky
    npx husky install
    
    # Create pre-commit hook
    cat > .husky/pre-commit << 'EOF'
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "🔄 Checking for backend changes..."

# Check if any TypeScript files in src changed
if git diff --cached --name-only | grep -q "src.*\.ts$"; then
  echo "✨ Backend files changed, regenerating Swagger schema..."
  
  # Export Swagger
  npm run swagger:export
  
  # Stage the generated files
  git add swagger.json dist/swagger.* 2>/dev/null || true
  
  echo "✅ Swagger schema updated!"
fi

exit 0
EOF
    
    # Make executable
    chmod +x .husky/pre-commit
    
    # Add to package.json
    npm set-script prepare "husky install"
    
    echo "✅ Pre-commit hook installed!"
    echo ""
    echo "📝 How it works:"
    echo "- Every commit that changes .ts files → auto-generates swagger.json"
    echo "- swagger.json is automatically staged"
    echo "- Zero manual work!"
    echo ""
    echo "🧪 Test it:"
    echo "1. Make a change to any .ts file"
    echo "2. git add . && git commit -m 'test'"
    echo "3. Watch it auto-generate! ✨"
    ;;
    
  3)
    echo ""
    echo "📖 Manual Setup Guide"
    echo "====================="
    echo ""
    echo "✅ Your backend is already configured!"
    echo ""
    echo "Available commands:"
    echo "  npm run swagger:export     - Export schema to swagger.json"
    echo ""
    echo "To setup frontend type generation:"
    echo "1. Read: AUTO_SYNC_TYPES_SOLUTIONS.md"
    echo "2. Choose a solution that fits your workflow"
    echo "3. Follow the implementation guide"
    echo ""
    echo "Quick options:"
    echo "  - Monorepo setup (best for new projects)"
    echo "  - GitHub Actions (best for existing separate repos)"
    echo "  - NPM package (best for multiple frontends)"
    ;;
    
  *)
    echo "❌ Invalid choice. Please run again and choose 1-3."
    exit 1
    ;;
esac

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Setup complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📚 Documentation:"
echo "  - AUTO_SYNC_TYPES_SOLUTIONS.md - All solutions explained"
echo "  - TYPESCRIPT_TYPE_GENERATION.md - Type generation guide"
echo ""
echo "🚀 Your backend is ready to auto-sync with frontend!"
echo ""
