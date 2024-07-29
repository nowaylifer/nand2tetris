import path from "path";
import { createReadStream } from "fs";
import Parser from "./parser.js";

const filename = (srcPath: string) => path.basename(srcPath, path.extname(srcPath));

const srcPath = process.argv[2];
if (typeof srcPath !== "string") {
  throw new Error("You must provide source path via first argument");
}

const parse = async (srcPath: string) => {
  const parser = new Parser(createReadStream(srcPath));
  return await parser.parse();
};

const ast = await parse(srcPath);
console.dir(ast, { depth: null });
