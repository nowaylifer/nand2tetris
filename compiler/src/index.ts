import path from "path";
import { createReadStream } from "node:fs";
import Parser from "./parser.js";
import BytecodeEmitter from "./bytecode-emmitter.js";
import fs from "node:fs/promises";

const filename = (srcPath: string) => path.basename(srcPath, path.extname(srcPath));

const srcPath = process.argv[2];
if (typeof srcPath !== "string") {
  throw new Error("You must provide source path via first argument");
}

const compile = async (srcFile: string) => {
  const parser = new Parser(createReadStream(srcFile));
  const ast = await parser.parse();
  const outPath = path.resolve(path.dirname(srcFile), filename(srcFile) + ".vm");
  new BytecodeEmitter(ast, outPath).emit();
};

const srcStats = await fs.stat(srcPath);

if (srcStats.isDirectory()) {
  const files = await fs
    .readdir(srcPath, { withFileTypes: true })
    .then((dirents) =>
      dirents
        .filter((dirent) => dirent.isFile() && path.extname(dirent.name) === ".jack")
        .map((dirent) => path.join(dirent.parentPath, dirent.name)),
    );

  for (const file of files) {
    compile(file);
  }
} else {
  compile(srcPath);
}
