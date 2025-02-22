# Modern Real-time Collaboration Whiteboard

## Project Structure
```
realtime-whiteboard/
├── client/          # React frontend application
├── server/          # Node.js backend application
├── docker/          # Docker configuration files
├── docs/            # Documentation
└── README.md        # This file
```

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- MongoDB (local or Atlas)
- Redis (optional, for scaling)

### Installation & Setup
```bash
# Install root dependencies
npm install

# Install all dependencies (client + server)
npm run install:all

# Start development environment
npm run dev
```

This will start:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- Socket.io: ws://localhost:5000

### Docker Setup (Alternative)
```bash
docker-compose up --build
```

## Technology Stack (2025)

### Frontend
- **React 18** - Latest React with concurrent features
- **TypeScript 5** - Type safety and modern JS features  
- **Vite** - Fast build tool and dev server
- **Fabric.js 6** - Canvas manipulation library
- **Socket.io Client 4.7** - Real-time communication
- **Zustand** - Modern state management
- **React Query** - Server state management
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library

### Backend  
- **Node.js 18+** - Runtime environment
- **Express 4.19** - Web framework
- **TypeScript 5** - Type safety
- **Socket.io 4.7** - Real-time WebSocket communication
- **Prisma** - Modern database ORM
- **MongoDB** - Document database for sessions/boards
- **Redis** - Caching and session storage
- **JWT** - Authentication
- **Zod** - Runtime type validation
- **Winston** - Logging

### DevOps & Tools
- **Docker & Docker Compose** - Containerization
- **ESLint & Prettier** - Code quality
- **Husky** - Git hooks
- **Jest & Vitest** - Testing frameworks
- **GitHub Actions** - CI/CD

## Features Roadmap

### Phase 1: Core Features ✅
- [x] Modern project setup with latest dependencies
- [ ] User authentication (JWT)
- [ ] Basic drawing tools (pen, eraser)
- [ ] Real-time collaboration
- [ ] Basic shapes (rectangle, circle, line)
- [ ] Color picker
- [ ] Brush size selector

### Phase 2: Advanced Drawing ⏳
- [ ] Text tool
- [ ] Advanced shapes (arrow, polygon)
- [ ] Layer management
- [ ] Undo/Redo functionality
- [ ] Copy/Paste
- [ ] Selection tool
- [ ] Image upload and insertion

### Phase 3: Collaboration Features ⏳
- [ ] User presence indicators
- [ ] Real-time cursors
- [ ] Voice/Video chat integration
- [ ] Comments and annotations
- [ ] Board sharing and permissions
- [ ] Export (PDF, PNG, SVG)

### Phase 4: Advanced Features ⏳
- [ ] Templates library
- [ ] Board versioning
- [ ] Presentation mode
- [ ] Mobile responsive design
- [ ] Offline mode with sync
- [ ] Plugins/Extensions system

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - User logout

### Boards
- `GET /api/boards` - Get user's boards
- `POST /api/boards` - Create new board
- `GET /api/boards/:id` - Get specific board
- `PUT /api/boards/:id` - Update board
- `DELETE /api/boards/:id` - Delete board
- `POST /api/boards/:id/share` - Share board

### Real-time Events
- `board:join` - Join board session
- `board:leave` - Leave board session
- `draw:start` - Start drawing
- `draw:move` - Drawing movement
- `draw:end` - End drawing
- `cursor:move` - Cursor position
- `user:typing` - User typing indicator

## Development

### Project Setup
```bash
# Clone and setup
git clone <repository-url>
cd realtime-whiteboard
npm run install:all

# Start development
npm run dev
```

### Code Quality
```bash
# Linting
npm run lint

# Type checking
npm run type-check

# Testing
npm run test

# Build
npm run build
```

### Database Setup
```bash
# Generate Prisma client
cd server
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database
npx prisma db seed
```

## Deployment

### Environment Variables
Create `.env` files in both client and server directories:

**Server (.env)**
```
NODE_ENV=production
PORT=5000
DATABASE_URL="mongodb://localhost:27017/whiteboard"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-jwt-secret"
JWT_REFRESH_SECRET="your-refresh-secret"
```

**Client (.env)**
```
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=ws://localhost:5000
```

### Docker Deployment
```bash
docker-compose -f docker-compose.prod.yml up --build
```

## 🔐 Authentication System

The application features a comprehensive authentication system with the following components:

### Frontend Authentication
- **Modern UI**: Clean, responsive authentication forms with smooth animations
- **Form Validation**: Real-time validation with user-friendly error messages
- **State Management**: Zustand store with persistence for authentication state
- **Protected Routes**: Route protection with automatic redirects
- **Token Management**: Automatic token refresh and secure storage

### Backend Authentication
- **JWT-based**: Secure JSON Web Token authentication
- **Password Hashing**: bcrypt for secure password storage
- **Input Validation**: Zod schemas for request validation
- **Error Handling**: Comprehensive error handling with appropriate HTTP status codes
- **Middleware**: Authentication and validation middleware

### API Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Token refresh
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/logout` - User logout

### Security Features
- Strong password requirements (8+ chars, uppercase, lowercase, number)
- JWT token expiration (15 minutes for access, 7 days for refresh)
- CORS protection
- Helmet security headers
- Input sanitization and validation

## Contributing
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License
MIT License - see LICENSE file for details.

## Support
- 📧 Email: support@whiteboard.com
- 💬 Discord: [Join our community](https://discord.gg/whiteboard)
- 📖 Documentation: [docs.whiteboard.com](https://docs.whiteboard.com)