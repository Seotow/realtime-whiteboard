@echo off
REM Deployment script for Windows

echo 🚀 Deploying Realtime Whiteboard Backend...

REM Set production environment
set NODE_ENV=production

REM Install dependencies
echo 📦 Installing dependencies...
npm ci --only=production

REM Generate Prisma client
echo 🔧 Generating Prisma client...
npx prisma generate

REM Build the application
echo 🏗️ Building application...
npm run build

REM Run database migrations (if needed)
echo 🗄️ Running database setup...
REM npx prisma db push

echo ✅ Deployment preparation complete!
echo 🌐 Starting server...
npm start
