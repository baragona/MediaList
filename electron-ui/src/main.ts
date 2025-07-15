// Modules to control application life and create native browser window
import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { spawn } from "child_process";
import { connect } from "./dbaccess";
import { getConfig, getConfigSchemaJSON, saveConfig } from "./ConfigLoader";
import fs from "fs";
import { logger } from "./logger";
import { DatabaseError, FileSystemError, NotFoundError, handleError } from "./errors";

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    title: "MediaList",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // and load the index.html of the app.
  mainWindow.loadFile("../resources/index.html");
}

// Set up IPC handlers
function setupIpcHandlers() {
  // Database operations
  ipcMain.handle('get-library', async () => {
    try {
      const con = connect();
      const rows = con.prepare("select * from library").all();
      logger.info(`Retrieved ${rows.length} items from library`, "Database");
      return rows;
    } catch (error) {
      logger.error("Failed to get library", "Database", error as Error);
      const handled = handleError(error, "get-library");
      throw new DatabaseError(handled.message);
    }
  });

  ipcMain.handle('open-file', async (_event, fileId: number) => {
    try {
      const con = connect();
      const result = con
        .prepare("select path from library where id = ?")
        .get(fileId) as { path: string } | undefined;
      
      if (!result) {
        throw new NotFoundError(`File with id ${fileId}`);
      }
      
      const filePath = result.path;
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new FileSystemError("File no longer exists", filePath);
      }
      
      logger.info(`Opening file: ${filePath}`, "FileOpen");
      spawn("open", ["-a", getConfig().openVideosWith, filePath]);
      return { success: true };
    } catch (error) {
      logger.error("Failed to open file", "FileOpen", error as Error);
      const handled = handleError(error, "open-file");
      return { success: false, error: handled.message };
    }
  });

  ipcMain.handle('scan-files', async () => {
    try {
      const { FileScanner } = require('./async-filescanner');
      const scanner = new FileScanner();
      
      // Set up progress reporting
      scanner.on('progress', (progress: import('./async-filescanner').ScanProgress) => {
        // In a real app, you'd send this to the renderer process
        logger.debug(`Scan progress: ${progress.processedFiles} files processed, ${progress.foundFiles} found`, 'FileScan');
      });
      
      scanner.on('fileAdded', (file: { path: string; basename: string }) => {
        logger.info(`Added to library: ${file.basename}`, 'FileScan');
      });
      
      const progress = await scanner.scanLibraryRoots();
      
      return { 
        success: true, 
        message: `Scan complete. Found ${progress.foundFiles} new files.`,
        filesFound: progress.foundFiles,
        totalProcessed: progress.processedFiles,
        errors: progress.errors
      };
    } catch (error) {
      logger.error('Scan error', 'FileScan', error as Error);
      const handled = handleError(error, 'scan-files');
      return { 
        success: false, 
        error: handled.message 
      };
    }
  });

  ipcMain.handle('add-file', async (_event, filePath: string) => {
    try {
      // Validate file exists
      if (!fs.existsSync(filePath)) {
        throw new FileSystemError('File does not exist', filePath);
      }
      
      const con = connect();
      const stats = fs.statSync(filePath);
      const basename = path.basename(filePath);
      const realpath = fs.realpathSync(filePath);
      
      // Check if already exists
      const existing = con.prepare("SELECT id FROM library WHERE path = ?").get(realpath);
      if (existing) {
        logger.warn(`File already in library: ${realpath}`, 'AddFile');
        return { success: false, error: 'File already in library' };
      }
      
      // Insert new file
      con.prepare(
        "insert or ignore into library (path,basename,size,modified,added,fff) values (?,?,?,?,?,?)"
      ).run(
        realpath,
        basename,
        stats.size,
        stats.mtime.getTime(),
        Date.now(),
        "pending"
      );
      
      logger.info(`Added file to library: ${realpath}`, 'AddFile');
      return { success: true };
    } catch (error) {
      logger.error('Error adding file', 'AddFile', error as Error);
      const handled = handleError(error, 'add-file');
      return { 
        success: false, 
        error: handled.message
      };
    }
  });

  // Config operations
  ipcMain.handle('get-config-schema', async () => {
    return getConfigSchemaJSON();
  });

  ipcMain.handle('save-config', async (_event, configJSON: string) => {
    const config = JSON.parse(configJSON);
    saveConfig(config);
    return "saved";
  });

  // File browser operations
  ipcMain.handle('get-files-in-path', async (_event, dirPath: string) => {
    try {
      const files = fs.readdirSync(dirPath);
      const results = [];
      
      for (const file of files) {
        const fullPath = path.join(dirPath, file);
        try {
          const stats = fs.lstatSync(fullPath);
          let type = 'file';
          if (stats.isDirectory()) {
            type = 'dir';
          } else if (fullPath.endsWith('.app')) {
            type = 'app';
          }
          results.push({ name: file, type });
        } catch {
          // Skip files we can't access
        }
      }
      
      return results.sort((a, b) => {
        // Directories first, then files
        if (a.type === 'dir' && b.type !== 'dir') return -1;
        if (a.type !== 'dir' && b.type === 'dir') return 1;
        return a.name.localeCompare(b.name);
      });
    } catch (error) {
      logger.error('Error reading directory', 'FileBrowser', error as Error);
      return [];
    }
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  setupIpcHandlers();
  createWindow();

  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
