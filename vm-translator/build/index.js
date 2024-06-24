import { createReadStream, createWriteStream, promises as fs } from "fs";
import { pipeline } from "stream/promises";
import Multistream from "multistream";
import Pumpify from "pumpify";
import split from "split2";
import path from "path";
import Parser from "./parser.js";
import Translator from "./translator.js";
const filename = (srcPath) => path.basename(srcPath, path.extname(srcPath));
const createVMTranslatorStream = (srcPath) => new Pumpify(createReadStream(srcPath), split(), new Parser(), new Translator(filename(srcPath)));
const writeBootstrapCode = async (destPath) => {
    await fs.writeFile(destPath, [`// Bootstrap ${path.basename(destPath)}`, "@261", "D=A", "@SP", "M=D", "@Sys.init", "0;JMP"].join("\n") + "\n");
};
const srcPath = process.argv[2];
if (typeof srcPath !== "string") {
    throw new Error("You must provide source path via first argument");
}
const outPath = path.resolve(path.dirname(srcPath), filename(srcPath) + ".asm");
const srcStats = await fs.stat(srcPath);
let translateStream;
if (srcStats.isDirectory()) {
    const paths = await fs
        .readdir(srcPath, { withFileTypes: true })
        .then((dirents) => dirents
        .filter((dirent) => dirent.isFile() && path.extname(dirent.name) === ".vm")
        .map((dirent) => path.join(dirent.parentPath, dirent.name)));
    translateStream = new Multistream(paths.map(createVMTranslatorStream));
}
else {
    translateStream = createVMTranslatorStream(outPath);
}
await writeBootstrapCode(outPath);
await pipeline(translateStream, createWriteStream(outPath, { flags: "a" }));
