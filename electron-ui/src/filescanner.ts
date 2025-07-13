import fs from "fs";
import path from "path";
import { getConfig } from "./ConfigLoader";
import { connect } from "./dbaccess";

const config = getConfig();
const library_root = config["LibraryRoots"][0];
const movie_filetypes = config["VideoFileExtensions"];
const movie_minsize = config["MinMovieSize"];
const max_search_depth = config["MaxSearchDepth"];

function dropLibrary() {
  const con = connect();
  con.prepare("Drop table if exists library").run();
}

function createLibrary() {
  const con = connect();

  con
    .prepare(
      "CREATE TABLE IF NOT EXISTS library (id INTEGER PRIMARY KEY,  path TEXT , basename, size integer, modified integer, added integer,fff text)"
    )
    .run();
  con.prepare(" create unique index path on library (path)").run();
  con.prepare(" create index fff on library (fff)").run();
  con.prepare(" create index size on library (size)").run();
  con.prepare(" create index modified on library (modified)").run();
  con.prepare(" create index added on library (added)").run();
}


let scanProgress = { found: 0, currentFile: '' };

export function getScanProgress() {
  return scanProgress;
}

export function resetScanProgress() {
  scanProgress = { found: 0, currentFile: '' };
}

function foundMediaFile(path: string) {
  const con = connect();

  const realpath = fs.realpathSync(path);
  const basename = path.split("/").pop();
  const size = fs.statSync(path).size;
  const modified = fs.statSync(path).mtime.getTime();
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
    console.log("inserted");
    scanProgress.found++;
  } else {
    console.log("already exists:", realpath);
  }
  scanProgress.currentFile = path;
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
  var babies: string[];
  try {
    babies = fs.readdirSync(root);
  } catch {
    console.log("couldn't list contents for " + root);
    return;
  }
  for (const files of babies) {
    const thispath = path.join(root, files);
    const fileExtension = thispath.split(".").pop();
    const fileName = thispath.split("/").pop();
    if (fileName.startsWith(".")) {
      nBoring += 1;
      continue;
    }
    if (fs.lstatSync(thispath).isSymbolicLink()) {
      console.log("Symbolic link!");
      nBoring += 1;
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
      if (movie_filetypes.includes(fileExtension)) {
        console.log(thispath);
        nInteresting += 1;
        foundMediaFile(thispath);
      }
    } else {
      console.log("some kind of weird file " + thispath);
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
      console.log(dir);
      console.log("MAXDEPTH not going any deeper");
    }
  }
}

if (require.main === module) {
  dropLibrary();
  createLibrary();

  listdir(library_root, 1, [0, 0]);
}
