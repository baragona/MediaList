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

export function startDaemon() {
  app.listen(43590, function () {
    console.log("listening on port 43590");
  });
}

// if this file is run directly, start the daemon
if (require.main === module) {
  startDaemon();
}
