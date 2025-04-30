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

### Phase 1: Foundation & Core Features ✅
#### Project Infrastructure
- [x] Modern project setup with latest dependencies
- [x] TypeScript configuration for both client and server
- [x] Vite build system with HMR
- [x] ESLint and Prettier setup
- [x] Docker containerization
- [x] Environment configuration

#### Authentication System ✅
- [x] JWT-based authentication with refresh tokens (extended to 1h access, 30d refresh)
- [x] User registration and login endpoints
- [x] Password hashing with bcrypt
- [x] Protected routes middleware
- [x] Zustand authentication store
- [x] Form validation with Zod schemas

#### Database & Backend
- [x] MongoDB integration with Prisma ORM
- [x] User model and authentication schemas
- [x] Error handling middleware
- [x] CORS and security headers
- [x] Winston logging setup
- [x] Board model and CRUD operations
- [x] Database migrations and seeding

#### Real-time Infrastructure
- [x] Socket.io server setup
- [x] Socket.io client integration
- [x] Room management for boards
- [x] Connection handling and reconnection
- [x] Event type definitions
- [x] Basic real-time testing

#### Canvas Foundation ✅
- [x] Fabric.js canvas initialization
- [x] Canvas responsive sizing (1920x1080 default)
- [x] Mouse and touch event handling
- [x] Canvas state management with history
- [x] Viewport controls (zoom, pan with Space key)
- [x] Canvas serialization/deserialization
- [x] Real-time canvas synchronization
- [x] Auto-save functionality
- [x] Canvas focus management
- [x] Keyboard shortcuts (Ctrl+Z, Ctrl+Y, Ctrl+S, etc.)

#### Basic Drawing Tools ✅
- [x] **Pen tool implementation**
  - [x] Variable brush sizes (1-50px with slider)
  - [x] Smooth line rendering with Fabric.js
  - [x] Multiple brush types (pencil, circle, spray)
  - [x] Alt + right mouse drag for brush size adjustment
  - [x] Custom brush cursor display
- [x] **Eraser tool**
  - [x] Destination-out composite operation
  - [x] Custom eraser brush with white color
  - [x] Variable eraser size (2x brush size)
  - [x] Visual eraser cursor
- [x] **Color system**
  - [x] Color picker component with dropdown
  - [x] 15 preset color palette
  - [x] Custom color input (hex/RGB)
  - [x] Real-time color preview
- [x] **Opacity control**
  - [x] Opacity slider (0.1-1.0)
  - [x] Real-time opacity preview
  - [x] Percentage display
- [x] **Zoom controls**
  - [x] Zoom in/out buttons
  - [x] Zoom reset to 100%
  - [x] Mouse wheel zoom with Alt key
  - [x] Zoom level display
  
#### Real-time Collaboration ✅
- [x] **Multi-user canvas sharing**
  - [x] Real-time drawing synchronization
  - [x] Canvas action broadcasting (add/update/delete/clear)
  - [x] Object conflict resolution
  - [x] User identification in actions
- [x] **Cursor sharing**
  - [x] Real-time cursor position updates
  - [x] Cursor movement broadcasting
  - [x] User-specific cursor colors
- [x] **Session management**
  - [x] Board join/leave events
  - [x] User presence tracking
  - [x] Connection state handling
  - [x] Reconnection support

### Phase 2: Advanced Drawing Features ✅
- [x] **Text tool** (editable text objects)
- [x] **Advanced shapes** (arrow with SVG paths)
- [x] **Layer management** (object stacking order)
- [x] **Undo/Redo functionality** (20-state history)
- [x] **Copy/Paste** (selection management)
- [x] **Selection tool** (multi-object selection)
- [x] **Image upload and insertion** (file import)

### Phase 3: Collaboration Features ✅
- [x] User presence indicators
- [x] Real-time cursors
- [x] Board sharing and permissions
- [x] Public/private board settings with modal interface
- [x] Board access tracking for shared links
- [x] Join room modal with URL/ID support
- [x] Board settings modal (replacing route-based settings)
- [x] Export (PDF, PNG, SVG)
- [ ] Voice/Video chat integration
- [ ] Comments and annotations

### Phase 4: Advanced Features ✅
- [x] Mobile responsive design
- [x] Offline mode with sync
- [x] Shape tools spawn in center of visible canvas area
- [x] Board name display on board pages
- [x] Clean navigation (removed duplicate buttons)
- [x] Extended token/session expiration times
- [x] Code cleanup (removed debug logs, unused files)
- [ ] Templates library
- [ ] Board versioning
- [ ] Presentation mode
- [ ] Plugins/Extensions system

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - User logout

### Boards
- `GET /api/boards` - Get user's boards
- `GET /api/boards/accessed` - Get boards accessed via shared links
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