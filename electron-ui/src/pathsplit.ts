import fs from "fs";
import path from "path";
export function os_path_split_asunder(fullpath: string) {
  return fullpath.split(path.sep);
}

function isDir(path: fs.PathLike) {
  try {
    var stat = fs.lstatSync(path);
    return stat.isDirectory();
  } catch (e) {
    // lstatSync throws an error if path doesn't exist
    return false;
  }
}
export function isapp(path: string): boolean {
  return isDir(path) && path.endsWith(".app");
}
