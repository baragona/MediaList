// Modules to control application life and create native browser window
import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { spawn } from "child_process";
import { connect } from "./dbaccess";
import { getConfig, getConfigSchemaJSON, saveConfig } from "./ConfigLoader";
import fs from "fs";

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
    const con = connect();
    const rows = con.prepare("select * from library").all();
    return rows;
  });

  ipcMain.handle('open-file', async (event, fileId: number) => {
    const con = connect();
    const result = con
      .prepare("select path from library where id = ?")
      .get(fileId) as { path: string } | undefined;
    
    if (!result) {
      throw new Error('File not found');
    }
    
    const path = result.path;
    spawn("open", ["-a", getConfig().openVideosWith, path]);
    return { success: true };
  });

  ipcMain.handle('scan-files', async () => {
    try {
      const { listdir, resetScanProgress, getScanProgress } = require('./filescanner');
      const config = getConfig();
      
      resetScanProgress();
      
      // Start scanning in background
      setTimeout(() => {
        for (const root of config.LibraryRoots) {
          if (fs.existsSync(root)) {
            listdir(root, 1, [0, 0]);
          }
        }
      }, 100);
      
      // Wait a bit for scan to complete (this is simplified - in production you'd want progress events)
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const progress = getScanProgress();
      return { 
        success: true, 
        message: `Scan complete. Found ${progress.found} new files.`,
        filesFound: progress.found 
      };
    } catch (error) {
      console.error('Scan error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Scan failed' 
      };
    }
  });

  ipcMain.handle('add-file', async (event, filePath: string) => {
    try {
      const con = connect();
      const stats = fs.statSync(filePath);
      const basename = path.basename(filePath);
      const realpath = fs.realpathSync(filePath);
      
      // Check if already exists
      const existing = con.prepare("SELECT id FROM library WHERE path = ?").get(realpath);
      if (existing) {
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
      
      return { success: true };
    } catch (error) {
      console.error('Error adding file:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to add file' 
      };
    }
  });

  // Config operations
  ipcMain.handle('get-config-schema', async () => {
    return getConfigSchemaJSON();
  });

  ipcMain.handle('save-config', async (event, configJSON: string) => {
    const config = JSON.parse(configJSON);
    saveConfig(config);
    return "saved";
  });

  // File browser operations
  ipcMain.handle('get-files-in-path', async (event, dirPath: string) => {
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
      console.error('Error reading directory:', error);
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
