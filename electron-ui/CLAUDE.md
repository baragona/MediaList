# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Build and Development
- `npm run build` - Compile TypeScript to JavaScript in dist/ directory
- `npm run build:react` - Build React application with webpack
- `npm run watch` - Watch mode compilation for TypeScript (automatically rebuilds on changes)
- `npm run dev:react` - Start React development server with hot reloading
- `npm start` - Build everything and start the Electron application
- `npm run start:react` - Start Electron with React build only (skips TypeScript build)
- `npm run lint` - Run ESLint on TypeScript files in src/
- `npm run test:react` - Run React component tests with Jest
- `npm run test:react -- --coverage` - Run tests with coverage report

### Running Components
- `$(npm bin)/electron ./dist/main.js` - Start the main Electron app
- `$(npm bin)/electron ./dist/filescanner.js` - Run the file scanner utility
- `$(npm bin)/electron-rebuild` - Rebuild native dependencies if needed

## Architecture Overview

This is an Electron-based media library application with a React frontend, using IPC (Inter-Process Communication) for secure communication between main and renderer processes. The application scans file systems for media files and manages them in a SQLite database.

### Features

- **Automatic Media Scanning**: Recursively scans configured directories for video files
- **SQLite Database**: Fast, lightweight storage of media library metadata
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **React UI**: Modern React 19 frontend with Windows 95 aesthetic
- **Virtual Scrolling**: Efficiently handles large media libraries
- **Dynamic Text Fitting**: Squishy text algorithm for perfect text sizing
- **Drag & Drop**: Add files to the library by dragging them into the application
- **Configurable**: Customize file extensions, scan depth, minimum file sizes, and video player
- **Comprehensive Testing**: Full unit test coverage for React components

### Core Components

**Main Process (src/main.ts)**
- Entry point that creates the Electron window and manages application lifecycle
- Loads the React build from dist-react/index.html
- Handles IPC communication with the renderer process
- Manages database queries, file operations, and configuration through IPC handlers

**Database Layer (src/dbaccess.ts)**
- SQLite database interface using better-sqlite3
- Database file located at `python_server/medialist.db`
- Provides connection and utility functions

**File Scanner (src/filescanner.ts)**
- Scans configured library roots for media files
- Creates and populates the library database table
- Configurable file types, size limits, and search depth
- Can be run standalone with `$(npm bin)/electron ./dist/filescanner.js`

**Configuration System (src/ConfigLoader.ts)**
- JSON-based configuration stored in `python_server/medialist_config.json`
- Schema-driven config with defaults for video player, file extensions, search parameters
- Provides both loading and saving functionality

**React Frontend (src/react/)**
- Modern React 19 application with functional components and hooks
- Windows 95 themed UI with authentic styling and icons
- Key components:
  - MediaGrid: Virtual scrolling grid for displaying media files
  - SquishyText: Dynamic text fitting component
  - ConfigDialog: Configuration management UI
  - SearchBar, Toolbar: Navigation and filtering
  - ErrorBoundary, LoadingSpinner: Error handling and loading states
- Custom hooks:
  - useElectronAPI: Wrapper for IPC communication
  - useSquishyText: Text fitting algorithm
  - useDebounce: Performance optimization

### Key Technologies
- **Electron**: Desktop app framework
- **TypeScript**: Primary language with strict type checking
- **React 19**: Modern frontend framework with hooks
- **Webpack**: Module bundler for React application
- **Jest & React Testing Library**: Testing framework
- **Electron IPC**: Secure inter-process communication via contextBridge
- **better-sqlite3**: SQLite database driver
- **CSS**: Windows 95 themed styling with border-image

### Database Schema
The `library` table contains:
- `id` (PRIMARY KEY)
- `path` (TEXT, unique index)
- `basename`, `size`, `modified`, `added` (metadata)
- `fff` (processing status field)

### Configuration Schema
Key configuration options:
- `LibraryRoots`: Array of directories to scan
- `openVideosWith`: Path to video player application
- `VideoFileExtensions`: Supported video file types
- `MaxSearchDepth`: How deep to scan directories
- `MinMovieSize`: Minimum file size threshold

## Project History

MediaList started in 2013 as a macOS-native application. In 2021, it was completely rewritten using Electron for cross-platform support. The latest 2025 updates modernized the codebase with:

- Full TypeScript migration with strict type checking
- Migration from jQuery to React 19 with functional components
- Windows 95 themed UI with authentic visual design
- Electron IPC architecture (replacing the embedded HTTP server)
- Virtual scrolling for performance with large libraries
- Comprehensive unit test coverage
- Performance optimizations (memoization, debouncing)
- Accessibility features (ARIA labels, keyboard navigation)
- AI-assisted development support

## File Structure Notes
- TypeScript source in `src/` (main process and utilities)
- React source in `src/react/` (frontend application)
- Compiled JavaScript output in `dist/` (main process)
- Compiled React output in `dist-react/` (frontend bundle)
- Test files in `src/react/**/__tests__/` and `src/react/**/*.test.ts(x)`
- Windows 95 icons and images in `src/react/assets/`
- Database and config in `python_server/` directory
- Legacy jQuery UI in `resources/` (no longer used)
- Legacy Python server remnants exist but are not used

## Testing Guidelines
- All React components should have corresponding test files
- Use React Testing Library for component tests
- Mock Electron IPC calls in tests
- Run `npm run test:react` before committing
- Aim for high test coverage but prioritize meaningful tests

## Code Style
- Use TypeScript strict mode
- Prefer functional React components with hooks
- Use proper TypeScript types (avoid `any`)
- Follow existing code patterns and conventions
- Keep components modular and testable