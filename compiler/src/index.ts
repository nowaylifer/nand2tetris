import path from "path";
import Parser from "./parser.js";
import type { Token } from "./types.js";

const filename = (srcPath: string) => path.basename(srcPath, path.extname(srcPath));

const srcPath = process.argv[2];
if (typeof srcPath !== "string") {
  throw new Error("You must provide source path via first argument");
}
