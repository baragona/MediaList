import fs from "fs";

type SchemaKey =
  | "LibraryRoots"
  | "openVideosWith"
  | "VideoFileExtensions"
  | "AudioFileExtensions"
  | "MaxSearchDepth"
  | "MinMovieSize"
  | "MinAudioSize";

type ConfigType = {
  openVideosWith: string;
  AudioFileExtensions: string[];
  MinAudioSize: number;
  VideoFileExtensions: string[];
  MaxSearchDepth: number;
  LibraryRoots: string[];
  MinMovieSize: number;
};

interface SchemaProperty {
  default: string | number | string[];
  type: "string" | "number" | "array";
  icon?: string;
  items?: { type: "string" };
  title?: string;
}

interface Schema {
  order: SchemaKey[];
  properties: Record<SchemaKey, SchemaProperty>;
}

const schemaKeys = [
  "LibraryRoots",
  "openVideosWith",
  "VideoFileExtensions",
  "AudioFileExtensions",
  "MaxSearchDepth",
  "MinMovieSize",
  "MinAudioSize",
] as SchemaKey[];

const schema: Schema = {
  order: schemaKeys,
  properties: {
    openVideosWith: {
      default: "/Applications/VLC.app",
      type: "string",
      icon: "win95icons/Icon_61-0.png",
    },
    AudioFileExtensions: {
      default: [] as string[],
      items: {
        type: "string",
      },
      type: "array",
      icon: "win95icons/Icon_43-0.png",
    },
    MinAudioSize: {
      default: 300 * 1024,
      type: "number",
      icon: "win95icons/Icon_69-0.png",
    },
    VideoFileExtensions: {
      default: ["avi", "mp4", "mkv", "m4v"],
      items: {
        type: "string",
      },
      type: "array",
      icon: "win95icons/Icon_43-0.png",
    },
    MaxSearchDepth: {
      default: 7,
      type: "number",
      icon: "win95icons/Icon_45-0.png",
    },
    LibraryRoots: {
      default: [] as string[],
      icon: "win95icons/Icon_21-0.png",
      items: {
        type: "string",
      },
      type: "array",
    },
    MinMovieSize: {
      default: 52428800,
      type: "number",
      icon: "win95icons/Icon_69-0.png",
    },
  },
};

const defaults: ConfigType = {
  openVideosWith: "/Applications/VLC.app",
  AudioFileExtensions: [] as string[],
  MinAudioSize: 300 * 1024,
  VideoFileExtensions: ["avi", "mp4", "mkv", "m4v"],
  MaxSearchDepth: 7,
  LibraryRoots: [] as string[],
  MinMovieSize: 52428800,
};

export function getConfigSchemaJSON() {
  const current = getConfig();
  const sch = Object.assign({}, schema);
  for (const key of schemaKeys) {
    const it = sch.properties[key];
    it.title = keyNameToNiceName(key);
    it.default = current[key];
  }
  return JSON.stringify(sch, null, 4);
}

function keyNameToNiceName(key: string) {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, function (str: string) {
    return str.toUpperCase();
  });
}

export function getConfig() {
  const cfg = Object.assign({}, defaults);
  try {
    const file = fs.readFileSync("data/medialist_config.json", "utf8");

    const loaded_cfg = JSON.parse(file) as ConfigType;
    Object.assign(cfg, loaded_cfg);
  } catch {
    throw "Configuration JSON file has some errors.";
  }

  return cfg;
}

export function saveConfig(cfg: ConfigType) {
  fs.writeFileSync(
    "data/medialist_config.json",
    JSON.stringify(cfg, null, 4)
  );
}
