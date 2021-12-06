import bodyParser from "body-parser";
import { spawn } from "child_process";
import express from "express";
import fs from "fs";
import pathLib from "path";
import { getConfig, getConfigSchemaJSON, saveConfig } from "./ConfigLoader";
import { connect } from "./dbaccess";
import { isapp, os_path_split_asunder } from "./pathsplit";
const app = express();
app.use(bodyParser.json());

app.get("/do", function (req, res) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
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

  if (argObj.action == "getLibrary") {
    const con = connect();
    const rows = con.prepare("select * from library").all();
    res.send(JSON.stringify(rows));
    return;
  }
  if (argObj.action == "openFile") {
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
    return;
  }
  if (argObj.action == "getConfigSchemaJSON") {
    res.send(getConfigSchemaJSON());
    return;
  }
  if (argObj.action == "saveConfig") {
    const jscfg = argObj.newConfigJSON;
    const config = JSON.parse(jscfg);
    saveConfig(config);
    res.send("saved");
    return;
  }
  if (argObj.action == "getFilesInPath") {
    const givenpath = argObj.path;
    const files = fs.readdirSync(givenpath);
    const fdata = [];
    for (const fpath of files) {
      try {
        const thispath = pathLib.join(givenpath, fpath);
        var type = "file";
        if (isapp(thispath)) {
          type = "app";
        }
        if (fs.statSync(thispath).isDirectory()) {
          type = "dir";
        }
        const readable = fs.accessSync(thispath, fs.constants.R_OK);
        fdata.push({
          name: fpath,
          type: type,
          readable: readable,
        });
      } catch (e) {
        console.log("error on file listing files in path:", e);
      }
    }
    res.send(JSON.stringify(fdata));
    return;
  }
  if (argObj.action == "splitPath") {
    const path = argObj.path;
    res.send(JSON.stringify(os_path_split_asunder(path)));
    return;
  } else {
    res.status(500).send("WTF");
    return;
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
