import fs from "fs/promises";
import { Stats } from "fs";
import path from "path";
import { getConfig } from "./ConfigLoader";
import { connect } from "./dbaccess";
import { logger } from "./logger";
import { DatabaseError } from "./errors";
import { EventEmitter } from "events";

export interface ScanProgress {
  totalFiles: number;
  processedFiles: number;
  foundFiles: number;
  currentFile: string;
  errors: string[];
}

export class FileScanner extends EventEmitter {
  private config = getConfig();
  private movieFiletypes = this.config["VideoFileExtensions"];
  private movieMinsize = this.config["MinMovieSize"];
  private maxSearchDepth = this.config["MaxSearchDepth"];
  private progress: ScanProgress = {
    totalFiles: 0,
    processedFiles: 0,
    foundFiles: 0,
    currentFile: '',
    errors: []
  };

  public getProgress(): ScanProgress {
    return { ...this.progress };
  }

  public async scanLibraryRoots(): Promise<ScanProgress> {
    this.resetProgress();
    
    for (const root of this.config.LibraryRoots) {
      try {
        await fs.access(root);
        await this.scanDirectory(root, 1, [0, 0]);
      } catch (error) {
        logger.error(`Cannot access library root: ${root}`, "AsyncScan", error as Error);
        this.progress.errors.push(`Cannot access: ${root}`);
      }
    }

    this.emit('complete', this.progress);
    return this.progress;
  }

  private resetProgress(): void {
    this.progress = {
      totalFiles: 0,
      processedFiles: 0,
      foundFiles: 0,
      currentFile: '',
      errors: []
    };
  }

  private async scanDirectory(
    root: string, 
    depth: number, 
    parentCounts: [number, number]
  ): Promise<void> {
    let nInteresting = 0;
    let nBoring = 0;
    const subdirs: string[] = [];

    let entries: string[];
    try {
      entries = await fs.readdir(root);
    } catch (error) {
      logger.error(`Failed to read directory: ${root}`, "AsyncScan", error as Error);
      this.progress.errors.push(`Failed to read: ${root}`);
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(root, entry);
      this.progress.currentFile = fullPath;
      this.progress.processedFiles++;
      
      // Emit progress every 10 files
      if (this.progress.processedFiles % 10 === 0) {
        this.emit('progress', this.progress);
      }

      // Skip hidden files
      if (entry.startsWith(".")) {
        nBoring++;
        continue;
      }

      try {
        const stats = await fs.lstat(fullPath);

        if (stats.isSymbolicLink()) {
          logger.debug(`Skipping symbolic link: ${fullPath}`, "AsyncScan");
          nBoring++;
          continue;
        }

        if (stats.isDirectory()) {
          subdirs.push(fullPath);
        } else if (stats.isFile()) {
          if (stats.size < this.movieMinsize) {
            nBoring++;
            continue;
          }

          const ext = path.extname(fullPath).slice(1).toLowerCase();
          if (ext && this.movieFiletypes.includes(ext)) {
            logger.info(`Found media file: ${fullPath}`, "AsyncScan");
            nInteresting++;
            await this.addMediaFile(fullPath, stats);
          }
        } else {
          logger.warn(`Unknown file type: ${fullPath}`, "AsyncScan");
        }
      } catch (error) {
        logger.error(`Failed to process: ${fullPath}`, "AsyncScan", error as Error);
        this.progress.errors.push(`Failed to process: ${fullPath}`);
      }
    }

    // Process subdirectories
    for (const dir of subdirs) {
      if (this.isTooBoring(parentCounts) && this.isTooBoring([nInteresting, nBoring])) {
        continue;
      }

      if (depth + 1 <= this.maxSearchDepth) {
        await this.scanDirectory(dir, depth + 1, [nInteresting, nBoring]);
      } else {
        logger.debug(`Max depth reached at: ${dir}`, "AsyncScan");
      }
    }
  }

  private async addMediaFile(filePath: string, stats: Stats): Promise<void> {
    try {
      const con = connect();
      const realpath = await fs.realpath(filePath);
      const basename = path.basename(filePath);
      const size = stats.size;
      const modified = stats.mtime.getTime();
      const added = Date.now();

      // Check if file already exists
      const existing = con.prepare("SELECT id FROM library WHERE path = ?").get(realpath) as { id: number } | undefined;

      if (!existing) {
        con.prepare(
          "INSERT INTO library (path, basename, size, modified, added, fff) VALUES (?, ?, ?, ?, ?, ?)"
        ).run(realpath, basename, size, modified, added, "pending");
        
        logger.debug(`Added file to library: ${basename}`, "AsyncScan");
        this.progress.foundFiles++;
        this.progress.totalFiles++;
        this.emit('fileAdded', { path: realpath, basename });
      } else {
        logger.debug(`File already in library: ${basename}`, "AsyncScan");
      }
    } catch (error) {
      logger.error(`Failed to add media file: ${filePath}`, "AsyncScan", error as Error);
      this.progress.errors.push(`Failed to add: ${filePath}`);
    }
  }

  private isTooBoring(counts: [number, number]): boolean {
    return counts[0] === 0 && counts[1] > 5;
  }

  public async dropLibrary(): Promise<void> {
    try {
      const con = connect();
      con.prepare("DROP TABLE IF EXISTS library").run();
      logger.info("Dropped library table", "AsyncScan");
    } catch (error) {
      logger.error("Failed to drop library table", "AsyncScan", error as Error);
      throw new DatabaseError("Failed to drop library table", error as Error);
    }
  }

  public async createLibrary(): Promise<void> {
    try {
      const con = connect();
      con.prepare(
        "CREATE TABLE IF NOT EXISTS library (id INTEGER PRIMARY KEY, path TEXT, basename TEXT, size INTEGER, modified INTEGER, added INTEGER, fff TEXT)"
      ).run();
      
      con.prepare("CREATE UNIQUE INDEX IF NOT EXISTS idx_path ON library (path)").run();
      con.prepare("CREATE INDEX IF NOT EXISTS idx_fff ON library (fff)").run();
      con.prepare("CREATE INDEX IF NOT EXISTS idx_size ON library (size)").run();
      con.prepare("CREATE INDEX IF NOT EXISTS idx_modified ON library (modified)").run();
      con.prepare("CREATE INDEX IF NOT EXISTS idx_added ON library (added)").run();
      
      logger.info("Created library table and indexes", "AsyncScan");
    } catch (error) {
      logger.error("Failed to create library table", "AsyncScan", error as Error);
      throw new DatabaseError("Failed to create library table", error as Error);
    }
  }
}