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

This is an Electron-based media library application with an embedded Express server backend. The application scans file systems for media files and manages them in a SQLite database.

### Core Components

**Main Process (src/main.ts)**
- Entry point that creates the Electron window and starts the embedded server
- Loads resources/index.html as the UI
- Starts the daemon server on initialization

**Embedded Server (src/demon.ts)**
- Express server running on port 43590
- Provides REST API endpoints for the frontend
- Handles database queries, file operations, and configuration management
- Key endpoints: `/getLibrary`, `/openFile`, `/getConfigSchemaJSON`, `/saveConfig`

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
- **Express**: Embedded HTTP server
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

## File Structure Notes
- TypeScript source in `src/`
- Compiled JavaScript output in `dist/`
- Frontend resources in `resources/` (HTML, CSS, JS, icons)
- Database and config in `python_server/` directory
- Legacy Python server remnants exist but are not used