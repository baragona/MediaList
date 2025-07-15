# MediaList

A cross-platform media library manager built with Electron and TypeScript. MediaList scans your file system for media files, maintains a SQLite database of your collection, and provides a user-friendly interface for browsing and playing your media.

## Features

- **Automatic Media Scanning**: Recursively scans configured directories for video files
- **SQLite Database**: Fast, lightweight storage of your media library metadata
- **Cross-Platform**: Works on Windows, macOS, and Linux thanks to Electron
- **Configurable**: Customize file extensions, scan depth, minimum file sizes, and video player
- **Modern Architecture**: Built with TypeScript and Electron IPC for secure, efficient communication
- **Drag & Drop**: Add files to your library by dragging them into the application

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

# Build the TypeScript files
npm run build
```

## Development

```bash
# Run in development mode with auto-rebuild
npm run watch

# In another terminal, start the application
npm start

# Run the linter
npm run lint
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

The application stores its configuration in `python_server/medialist_config.json`. Key settings include:

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

MediaList uses a modern Electron architecture:

- **Main Process** (`src/main.ts`): Manages the application lifecycle and window creation
- **Renderer Process**: The UI running in the Electron window
- **IPC Communication**: Secure communication between main and renderer processes
- **SQLite Database**: Stores media file metadata with full-text search capabilities
- **File Scanner** (`src/filescanner.ts`): Efficiently scans directories for media files
- **Configuration System** (`src/ConfigLoader.ts`): JSON-based settings management

## Project History

MediaList started in 2013 as a macOS-native application. In 2021, it was completely rewritten using Electron for cross-platform support. The latest 2025 updates modernized the codebase with:

- Full TypeScript migration
- Electron IPC architecture (replacing the embedded HTTP server)
- Improved type safety and code quality
- AI-assisted development support

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[CC0 1.0 (Public Domain)](LICENSE.md)