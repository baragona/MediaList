import bodyParser from "body-parser";
import { spawn } from "child_process";
import express from "express";
import { getConfig, getConfigSchemaJSON, saveConfig } from "./ConfigLoader";
import { connect } from "./dbaccess";
const app = express();
app.use(bodyParser.json());

function getArgsFromQueryString(req: express.Request) {
  const args = req.query;
  //convert args from [key: string]: undefined | string | string[] | ParsedQs | ParsedQs[] to a simple object of strings:
  const argObj: { [key: string]: string } = {};
  for (const key in args) {
    const value = args[key];
    if (typeof value === "string") {
      argObj[key] = value;
    } else if (Array.isArray(value)) {
      const innerValue = value[0];
      if (typeof innerValue === "string") {
        argObj[key] = innerValue;
      } else {
        throw new Error("Unexpected value type in query string.");
      }
    }
  }
  return argObj;
}
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.get("/getLibrary", function (req, res) {
  const con = connect();
  const rows = con.prepare("select * from library").all();
  res.send(JSON.stringify(rows));
});

app.get("/openFile", function (req, res) {
  const argObj = getArgsFromQueryString(req);
  const fileId = argObj.fileId;
  const con = connect();
  const path = con
    .prepare("select path from library where id = ?")
    .get(fileId).path;

  const ls = spawn("open", ["-a", getConfig().openVideosWith, path]);
  ls.stdout.on("data", (data: string) => {
    console.log(`stdout: ${data}`);
  });

  ls.stderr.on("data", (data: string) => {
    console.log(`stderr: ${data}`);
  });

  ls.on("error", (error: { message: string }) => {
    console.log(`error: ${error.message}`);
  });

  ls.on("close", (code: number) => {
    console.log(`child process exited with code ${code}`);
  });
  res.send("opened");
});

app.get("/getConfigSchemaJSON", function (req, res) {
  res.send(getConfigSchemaJSON());
});

app.get("/saveConfig", function (req, res) {
  const argObj = getArgsFromQueryString(req);

  const jscfg = argObj.newConfigJSON;
  const config = JSON.parse(jscfg);
  saveConfig(config);
  res.send("saved");
});

app.post("/addFile", function (req, res) {
  try {
    const { filePath } = req.body;
    
    if (!filePath || typeof filePath !== 'string') {
      return res.status(400).json({ success: false, error: "File path is required" });
    }

    const fs = require('fs');
    const path = require('path');
    const { getConfig } = require('./ConfigLoader');
    
    const config = getConfig();
    const videoFileExtensions = config.VideoFileExtensions;
    const minMovieSize = config.MinMovieSize;
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(400).json({ success: false, error: "File does not exist" });
    }
    
    // Get file stats
    const stats = fs.statSync(filePath);
    
    // Check if it's a file (not directory)
    if (!stats.isFile()) {
      return res.status(400).json({ success: false, error: "Path is not a file" });
    }
    
    // Check file size
    if (stats.size < minMovieSize) {
      return res.status(400).json({ success: false, error: "File is too small (below minimum movie size)" });
    }
    
    // Check file extension
    const fileExtension = path.extname(filePath).toLowerCase().substring(1);
    if (!videoFileExtensions.includes(fileExtension)) {
      return res.status(400).json({ success: false, error: `File extension '${fileExtension}' is not supported` });
    }
    
    // Get file details
    const realPath = fs.realpathSync(filePath);
    const basename = path.basename(filePath);
    const size = stats.size;
    const modified = stats.mtime.getTime();
    const added = Date.now();
    const fff = "pending";
    
    // Insert into database
    const con = connect();
    try {
      con.prepare(
        "insert or ignore into library (path,basename,size,modified,added,fff) values (?,?,?,?,?,?)"
      ).run(realPath, basename, size, modified, added, fff);
      
      res.json({ success: true, message: "File added successfully" });
    } catch (dbError) {
      console.error("Database error:", dbError);
      res.status(500).json({ success: false, error: "Database error occurred" });
    }
    
  } catch (error) {
    console.error("Error adding file:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

app.post("/scanFiles", async function (req, res) {
  const { listdir, resetScanProgress, getScanProgress } = require('./filescanner');
  const { getConfig } = require('./ConfigLoader');
  
  try {
    const config = getConfig();
    
    // Reset progress tracking
    resetScanProgress();
    
    // Start scanning all library roots
    let scanPromise = new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          for (const root of config.LibraryRoots) {
            try {
              listdir(root, 1, [0, 0]);
            } catch (err) {
              console.error(`Error scanning root ${root}:`, err);
            }
          }
          const finalProgress = getScanProgress();
          resolve(finalProgress);
        } catch (err) {
          reject(err);
        }
      }, 0);
    });
    
    // Wait for scan to complete
    const result = await scanPromise as { found: number, currentFile: string };
    
    res.json({ 
      success: true, 
      found: result.found,
      message: `Scan completed. Found ${result.found} new files.`
    });
    
  } catch (error) {
    console.error('Scan error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Scan failed'
    });
  }
});

export function startDaemon() {
  app.listen(43590, function () {
    console.log("listening on port 43590");
  });
}

// if this file is run directly, start the daemon
if (require.main === module) {
  startDaemon();
}
