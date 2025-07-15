import fs from "fs";
import path from "path";
import { getConfig } from "./ConfigLoader";
import { connect } from "./dbaccess";
import { logger } from "./logger";
import { DatabaseError } from "./errors";

const config = getConfig();
const library_root = config["LibraryRoots"][0];
const movie_filetypes = config["VideoFileExtensions"];
const movie_minsize = config["MinMovieSize"];
const max_search_depth = config["MaxSearchDepth"];

function dropLibrary() {
  try {
    const con = connect();
    con.prepare("Drop table if exists library").run();
    logger.info("Dropped library table", "FileScan");
  } catch (error) {
    logger.error("Failed to drop library table", "FileScan", error as Error);
    throw new DatabaseError("Failed to drop library table", error as Error);
  }
}

function createLibrary() {
  try {
    const con = connect();

    con
      .prepare(
        "CREATE TABLE IF NOT EXISTS library (id INTEGER PRIMARY KEY,  path TEXT , basename, size integer, modified integer, added integer,fff text)"
      )
      .run();
    con.prepare(" create unique index if not exists path on library (path)").run();
    con.prepare(" create index if not exists fff on library (fff)").run();
    con.prepare(" create index if not exists size on library (size)").run();
    con.prepare(" create index if not exists modified on library (modified)").run();
    con.prepare(" create index if not exists added on library (added)").run();
    logger.info("Created library table and indexes", "FileScan");
  } catch (error) {
    logger.error("Failed to create library table", "FileScan", error as Error);
    throw new DatabaseError("Failed to create library table", error as Error);
  }
}


let scanProgress = { found: 0, currentFile: '' };

export function getScanProgress() {
  return scanProgress;
}

export function resetScanProgress() {
  scanProgress = { found: 0, currentFile: '' };
}

function foundMediaFile(filePath: string) {
  try {
    const con = connect();

    const realpath = fs.realpathSync(filePath);
    const basename = path.basename(filePath);
    const stats = fs.statSync(filePath);
    const size = stats.size;
    const modified = stats.mtime.getTime();
    const added = Date.now();
    const fff = "pending";
    
    // Check if file already exists
    const existing = con.prepare("SELECT id FROM library WHERE path = ?").get(realpath) as { id: number } | undefined;
    
    if (!existing) {
      con
        .prepare(
          "insert into library (path,basename,size,modified,added,fff) values (?,?,?,?,?,?)"
        )
        .run(realpath, basename, size, modified, added, fff);
      logger.debug(`Added file to library: ${basename}`, "FileScan");
      scanProgress.found++;
    } else {
      logger.debug(`File already in library: ${basename}`, "FileScan");
    }
    scanProgress.currentFile = filePath;
  } catch (error) {
    logger.error(`Failed to add media file: ${filePath}`, "FileScan", error as Error);
    // Don't throw - continue scanning other files
  }
}

function isTooBoring(counts: [number, number]) {
  if (counts[0] === 0 && counts[1] > 5) {
    return true;
  }
  return false;
}

export function listdir(root: string, depth: number, parentCounts: [number, number]) {
  let nInteresting = 0;
  let nBoring = 0;
  let subdirs: string[] = [];
  let babies: string[];
  try {
    babies = fs.readdirSync(root);
  } catch (error) {
    logger.error(`Failed to read directory: ${root}`, "FileScan", error as Error);
    return;
  }
  for (const files of babies) {
    const thispath = path.join(root, files);
    const fileExtension = thispath.split(".").pop() || "";
    const fileName = thispath.split("/").pop() || "";
    if (fileName.startsWith(".")) {
      nBoring += 1;
      continue;
    }
    try {
      if (fs.lstatSync(thispath).isSymbolicLink()) {
        logger.debug(`Skipping symbolic link: ${thispath}`, "FileScan");
        nBoring += 1;
        continue;
      }
    } catch (error) {
      logger.error(`Failed to stat file: ${thispath}`, "FileScan", error as Error);
      continue;
    }
    if (fs.lstatSync(thispath).isDirectory()) {
      subdirs.push(thispath);
    } else if (fs.lstatSync(thispath).isFile()) {
      const size = fs.statSync(thispath).size;
      if (size < movie_minsize) {
        // Too small, skipping
        nBoring += 1;
        continue;
      }
      if (fileExtension && movie_filetypes.includes(fileExtension)) {
        logger.info(`Found media file: ${thispath}`, "FileScan");
        nInteresting += 1;
        foundMediaFile(thispath);
      }
    } else {
      logger.warn(`Unknown file type: ${thispath}`, "FileScan");
    }
  }
  // now look at all the subdirs
  for (const dir of subdirs) {
    // if the parent was really boring, and this directory is boring too, then don't look any deeper
    if (isTooBoring(parentCounts) && isTooBoring([nInteresting, nBoring])) {
      // the parent was too boring to bother looking any deeper
      continue;
    }

    if (depth + 1 <= max_search_depth) {
      listdir(dir, depth + 1, [nInteresting, nBoring]);
    } else {
      logger.debug(`Max depth reached at: ${dir}`, "FileScan");
    }
  }
}

if (require.main === module) {
  dropLibrary();
  createLibrary();

  if (library_root) {
    listdir(library_root, 1, [0, 0]);
  } else {
    console.error("No library root configured");
  }
}
