import Parser from "./parser";
import Translator from "./translator";
import { appendFile, access, rm } from "fs/promises";
import { basename, extname, dirname, resolve } from "path";

const srcArg = process.argv[2];
const outArg = process.argv[3];
const srcFilename = basename(srcArg, extname(srcArg));
const srcDirname = dirname(srcArg);
const outPath = outArg ?? resolve(srcDirname, srcFilename + ".hack");

try {
  await access(outPath);
  await rm(outPath);
} catch { }

const parser = new Parser(srcArg);
const translator = new Translator();

do {
  const instruction = await parser.advance();

  if (instruction) {
    const code = translator.translate(instruction);
    await appendFile(outPath, code + "\n");
  }
} while (parser.hasMoreLines);
