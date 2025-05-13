#!/bin/bash

# Deployment script for Railway/Render
echo "🚀 Deploying Realtime Whiteboard Backend..."

# Set production environment
export NODE_ENV=production

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --only=production

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Build the application
echo "🏗️ Building application..."
npm run build

# Run database migrations (if needed)
echo "🗄️ Running database setup..."
# npx prisma db push

echo "✅ Deployment preparation complete!"
echo "🌐 Starting server..."
npm start
