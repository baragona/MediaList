# MediaList

A cross-platform media library manager built with Electron, React, and TypeScript. MediaList scans your file system for media files, maintains a SQLite database of your collection, and provides a Windows 95-themed interface for browsing and playing your media.

## Features

- **Automatic Media Scanning**: Recursively scans configured directories for video files
- **SQLite Database**: Fast, lightweight storage of your media library metadata
- **Cross-Platform**: Works on Windows, macOS, and Linux thanks to Electron
- **React UI**: Modern React 19 frontend with Windows 95 aesthetic
- **Virtual Scrolling**: Efficiently handles large media libraries with thousands of files
- **Dynamic Text Fitting**: Squishy text algorithm ensures file names fit perfectly in columns
- **Configurable**: Customize file extensions, scan depth, minimum file sizes, and video player
- **Modern Architecture**: Built with TypeScript and Electron IPC for secure, efficient communication
- **Drag & Drop**: Add files to your library by dragging them into the application
- **Comprehensive Testing**: Full unit test coverage for React components and hooks

## Prerequisites

- [Node.js](https://nodejs.org/) (v14 or higher)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [Git](https://git-scm.com/) (for cloning the repository)

## Installation

```bash
# Clone this repository
git clone https://github.com/baragona/MediaList.git

# Navigate to the project directory
cd MediaList/electron-ui

# Install dependencies
npm install

# Build both TypeScript and React files
npm run build
npm run build:react
```

## Development

```bash
# Run TypeScript in watch mode
npm run watch

# Run React development server (in another terminal)
npm run dev:react

# In another terminal, start the application
npm start

# Run the linter
npm run lint

# Run React component tests
npm run test:react

# Run tests with coverage
npm run test:react -- --coverage
```

## Usage

### Running the Application

```bash
# Build and start the application
npm start
```

### Running the File Scanner Separately

You can run the file scanner as a standalone utility:

```bash
$(npm bin)/electron ./dist/filescanner.js
```

### Configuration

The application stores its configuration in `data/medialist_config.json`. Key settings include:

- `LibraryRoots`: Array of directories to scan for media files
- `openVideosWith`: Path to your preferred video player application
- `VideoFileExtensions`: List of file extensions to include in scans
- `MaxSearchDepth`: How many subdirectory levels to scan
- `MinMovieSize`: Minimum file size (in bytes) to include in the library

### Troubleshooting

If you encounter dependency issues, especially with native modules:

```bash
$(npm bin)/electron-rebuild
```

## Architecture

MediaList uses a modern Electron + React architecture:

- **Main Process** (`src/main.ts`): Manages the application lifecycle and window creation
- **Renderer Process**: React 19 application with Windows 95 themed UI
- **IPC Communication**: Secure communication between main and renderer processes via contextBridge
- **SQLite Database**: Stores media file metadata with full-text search capabilities
- **File Scanner** (`src/filescanner.ts`): Efficiently scans directories for media files
- **Configuration System** (`src/ConfigLoader.ts`): JSON-based settings management
- **React Components**: Modular, tested components including:
  - MediaGrid with virtual scrolling for performance
  - SquishyText for dynamic text fitting
  - ConfigDialog for settings management
  - Error boundaries and loading states
- **Custom Hooks**: Reusable React hooks for API communication, debouncing, and text fitting

## Project History

MediaList started in 2013 as a macOS-native application. In 2021, it was completely rewritten using Electron for cross-platform support. The latest 2025 updates modernized the codebase with:

- Full TypeScript migration for type safety
- Migration from jQuery to React 19 with hooks
- Windows 95 themed UI with authentic styling
- Electron IPC architecture (replacing the embedded HTTP server)
- Virtual scrolling for handling large media libraries
- Comprehensive unit test coverage with Jest and React Testing Library
- Performance optimizations including memoization and debouncing
- Accessibility features with ARIA labels and keyboard navigation
- AI-assisted development support

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[CC0 1.0 (Public Domain)](LICENSE.md)