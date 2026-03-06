# Bridge Bidding Tracker

## Overview

Bridge Bidding Tracker is a mobile application designed for serious bridge players to record and track bidding sequences during duplicate bridge games. The app provides a professional, editorial-style interface that mimics traditional scoresheets while offering digital convenience. Users can create games, record bidding for each board, and maintain notes about their play.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React Native with Expo SDK 54
- Uses Expo's managed workflow for cross-platform development (iOS, Android, Web)
- New Architecture enabled for improved performance
- React Compiler experiment enabled

**Navigation**: React Navigation v7
- Stack-based navigation pattern (GameList → CreateGame → BiddingEntry)
- Native stack navigator for platform-native transitions
- Modal presentation for game creation flow

**State Management**:
- TanStack Query (React Query) for server state and caching
- Local component state with React hooks
- AsyncStorage for persistent local data storage

**UI/Styling Approach**:
- Custom theming system with light/dark mode support (Colors constant with theme tokens)
- Typography scale and spacing constants for consistency
- Reanimated for smooth animations and gesture handling
- react-native-keyboard-controller for keyboard-aware form handling

**Key Design Decisions**:
- ThemedView/ThemedText components abstract color scheme handling
- Custom hook (useTheme) provides theme context throughout the app
- Path aliases configured: `@/` for client code, `@shared/` for shared code

### Backend Architecture

**Server**: Express.js v5 running on Node.js
- TypeScript with tsx for development
- CORS configured for Replit domains and localhost development
- Static file serving for production web builds

**Database**: PostgreSQL with Drizzle ORM
- Schema defined in shared/schema.ts for type sharing between client and server
- Drizzle-zod for validation schema generation
- Currently uses in-memory storage (MemStorage class) as a placeholder

**API Structure**:
- Routes registered in server/routes.ts
- API endpoints prefixed with /api
- HTTP server created for potential WebSocket support

### Data Layer

**Local Storage** (Current Implementation):
- AsyncStorage for persisting game data on device
- Game, Board, and Bid types defined in client/types/bridge.ts
- UUID generation for unique identifiers

**PBN Import Feature**:
- Users can import PBN (Portable Bridge Notation) files to merge hand records and analysis into existing games
- PBN parser (`client/lib/pbnParser.ts`) extracts boards, hands, double dummy results, bidding, and opening leads
- Import modal with conflict resolution when both PBN and user data exist for bidding/leads
- Board type extended to include: `hands` (BoardHands), `doubleDummy` (DoubleDummyResult)
- HandDisplay component shows N/E/S/W card holdings in diamond layout
- DoubleDummyTable component shows trick counts for each declarer/strain combination

**Database Schema** (Prepared for Server Sync):
- Users table with id, username, password
- Drizzle migrations output to /migrations folder
- Schema ready for expansion with game/board tables

### Build System

**Development**:
- Expo CLI for mobile development with Metro bundler
- Express server runs separately (tsx server/index.ts)
- EXPO_PUBLIC_DOMAIN environment variable connects client to server

**Production**:
- Custom build script (scripts/build.js) for static web builds
- Server bundled with esbuild to server_dist/
- Supports Replit deployment environment variables

## External Dependencies

### Core Frameworks
- **Expo SDK 54**: Mobile app framework and build tooling
- **React Native 0.81.5**: Cross-platform UI framework
- **Express 5**: HTTP server framework

### Database & ORM
- **PostgreSQL (pg)**: Relational database (requires DATABASE_URL)
- **Drizzle ORM**: TypeScript-first ORM with migrations
- **drizzle-zod**: Schema validation integration

### UI & Animation
- **react-native-reanimated**: Declarative animations
- **react-native-gesture-handler**: Touch gesture handling
- **expo-haptics**: Haptic feedback
- **@react-navigation/native-stack**: Navigation

### Data & Storage
- **@tanstack/react-query**: Server state management
- **@react-native-async-storage/async-storage**: Local persistence
- **uuid**: Unique identifier generation

### Development Tools
- **TypeScript**: Type safety
- **tsx**: TypeScript execution for server
- **esbuild**: Production bundling
- **drizzle-kit**: Database migrations

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `EXPO_PUBLIC_DOMAIN`: API server domain for client requests
- `REPLIT_DEV_DOMAIN`: Development domain (auto-set by Replit)
- `REPLIT_DOMAINS`: Production domains for CORS (auto-set by Replit)