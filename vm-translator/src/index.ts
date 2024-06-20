import split from "split2";
import { createReadStream, createWriteStream } from "fs";
import { pipeline } from "stream/promises";
import Parser from "./parser.js";
import path from "path";
import Translator from "./translator.js";

const srcPath = process.argv[2];

if (typeof srcPath !== "string") {
  throw new Error("You must provide source file via first argument");
}

const filename = path.basename(srcPath, path.extname(srcPath));
const outPath = path.resolve(path.dirname(srcPath), filename + ".asm");

await pipeline(createReadStream(srcPath), split(), new Parser(), new Translator(filename), createWriteStream(outPath));
