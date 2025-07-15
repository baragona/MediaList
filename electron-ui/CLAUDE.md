# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Build and Development
- `npm run build` - Compile TypeScript to JavaScript in dist/ directory
- `npm run watch` - Watch mode compilation (automatically rebuilds on changes)
- `npm start` - Build and start the Electron application
- `npm run lint` - Run ESLint on TypeScript files in src/

### Running Components
- `$(npm bin)/electron ./dist/main.js` - Start the main Electron app
- `$(npm bin)/electron ./dist/filescanner.js` - Run the file scanner utility
- `$(npm bin)/electron-rebuild` - Rebuild native dependencies if needed

## Architecture Overview

This is an Electron-based media library application using IPC (Inter-Process Communication) for secure communication between main and renderer processes. The application scans file systems for media files and manages them in a SQLite database.

### Features

- **Automatic Media Scanning**: Recursively scans configured directories for video files
- **SQLite Database**: Fast, lightweight storage of media library metadata
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Drag & Drop**: Add files to the library by dragging them into the application
- **Configurable**: Customize file extensions, scan depth, minimum file sizes, and video player

### Core Components

**Main Process (src/main.ts)**
- Entry point that creates the Electron window and manages application lifecycle
- Loads resources/index.html as the UI
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

### Key Technologies
- **Electron**: Desktop app framework
- **TypeScript**: Primary language (compiled to CommonJS)
- **Electron IPC**: Secure inter-process communication
- **better-sqlite3**: SQLite database driver
- **Frontend**: Legacy jQuery-based UI in resources/ directory

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

- Full TypeScript migration
- Electron IPC architecture (replacing the embedded HTTP server)
- Improved type safety and code quality
- AI-assisted development support

## File Structure Notes
- TypeScript source in `src/`
- Compiled JavaScript output in `dist/`
- Frontend resources in `resources/` (HTML, CSS, JS, icons)
- Database and config in `python_server/` directory
- Legacy Python server remnants exist but are not used