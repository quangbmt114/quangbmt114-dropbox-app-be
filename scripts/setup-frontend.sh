#!/bin/bash

# 🚀 Frontend Setup Script - curl Method
# Run this in your frontend project to setup type generation

set -e

echo "🎯 Frontend API Type Generation Setup"
echo "======================================"
echo ""

# Check if we're in a node project
if [ ! -f "package.json" ]; then
  echo "❌ Error: package.json not found"
  echo "   Please run this script in your frontend project root"
  exit 1
fi

# Ask for backend URL
echo "📡 Backend Configuration"
read -p "Enter backend URL (default: http://localhost:7001): " BACKEND_URL
BACKEND_URL=${BACKEND_URL:-http://localhost:7001}

echo ""
echo "📦 Installing dependencies..."
npm install --save-dev @openapitools/openapi-generator-cli

echo ""
echo "📝 Adding scripts to package.json..."

# Check if jq is available for JSON manipulation
if command -v jq &> /dev/null; then
  # Use jq for clean JSON manipulation
  cat package.json | jq '.scripts += {
    "download:schema": "curl '"$BACKEND_URL"'/api-json > swagger.json",
    "generate:api": "openapi-generator-cli generate -i swagger.json -g typescript-axios -o src/api/generated",
    "update:api": "npm run download:schema && npm run generate:api"
  }' > package.json.tmp && mv package.json.tmp package.json
  
  echo "✅ Scripts added to package.json"
else
  # Manual instructions if jq not available
  echo ""
  echo "⚠️  Please add these scripts manually to package.json:"
  echo ""
  echo '{
  "scripts": {
    "download:schema": "curl '"$BACKEND_URL"'/api-json > swagger.json",
    "generate:api": "openapi-generator-cli generate -i swagger.json -g typescript-axios -o src/api/generated",
    "update:api": "npm run download:schema && npm run generate:api"
  }
}'
  echo ""
fi

echo ""
echo "📁 Updating .gitignore..."
if [ -f ".gitignore" ]; then
  # Add to gitignore if not already there
  grep -qxF "swagger.json" .gitignore || echo "swagger.json" >> .gitignore
  grep -qxF "src/api/generated/" .gitignore || echo "src/api/generated/" >> .gitignore
  echo "✅ .gitignore updated"
else
  echo "⚠️  No .gitignore found, creating one..."
  cat > .gitignore << EOF
# API generated files
swagger.json
src/api/generated/
EOF
  echo "✅ .gitignore created"
fi

echo ""
echo "🧪 Testing connection to backend..."
if curl -f -s "$BACKEND_URL/api-json" > /dev/null; then
  echo "✅ Backend is accessible!"
  
  echo ""
  read -p "Download schema now? (y/n): " DOWNLOAD
  if [ "$DOWNLOAD" = "y" ] || [ "$DOWNLOAD" = "Y" ]; then
    echo "📥 Downloading schema..."
    npm run download:schema
    echo "✅ swagger.json downloaded"
    
    echo ""
    read -p "Generate types now? (y/n): " GENERATE
    if [ "$GENERATE" = "y" ] || [ "$GENERATE" = "Y" ]; then
      echo "🔨 Generating TypeScript types..."
      npm run generate:api
      echo "✅ Types generated in src/api/generated/"
    fi
  fi
else
  echo "⚠️  Backend not accessible at $BACKEND_URL"
  echo "   Make sure backend is running: npm run start:dev"
  echo ""
  echo "   You can download schema later with: npm run update:api"
fi

echo ""
echo "📁 Creating API client wrapper..."
mkdir -p src/api

cat > src/api/client.ts << 'EOF'
// API Client Configuration
import { Configuration, AuthApi, FilesApi, UsersApi } from './generated/api';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:7001';

const config = new Configuration({
  basePath: BASE_URL,
  accessToken: () => {
    return localStorage.getItem('token') || '';
  },
});

export const authApi = new AuthApi(config);
export const filesApi = new FilesApi(config);
export const usersApi = new UsersApi(config);

// Export types
export type { 
  FileResponseDto,
  UploadChunkDto,
  CompleteUploadDto,
  UserResponseDto,
  BaseResponseDto
} from './generated/models';
EOF

echo "✅ Created src/api/client.ts"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Setup Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Available Commands:"
echo "  npm run download:schema  - Download OpenAPI schema"
echo "  npm run generate:api     - Generate TypeScript types"
echo "  npm run update:api       - Download + Generate (one command)"
echo ""
echo "💻 Usage in your code:"
echo '  import { filesApi } from "./api/client";'
echo '  const files = await filesApi.filesControllerGetUserFiles();'
echo ""
echo "📚 Documentation:"
echo "  See: FRONTEND_SETUP_CURL_METHOD.md"
echo ""
echo "🚀 Next Steps:"
echo "  1. Make sure backend is running: npm run start:dev"
echo "  2. Update API types: npm run update:api"
echo "  3. Import and use: import { filesApi } from './api/client'"
echo ""
echo "🎉 Happy coding!"
echo ""
