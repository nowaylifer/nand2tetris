import path from "path";
import split from "split2";
import Pumpify from "pumpify";
import { Transform } from "stream";
import { pipeline } from "stream/promises";
import { createReadStream, createWriteStream } from "fs";
import Parser from "./parser.js";
import Translator from "./translator.js";
import type { Instruction, SymbolMap } from "./types.js";
import { InstructionType, defaultSymbolMap } from "./instruction-set.js";

const srcPath = process.argv[2];

if (typeof srcPath !== "string") {
  throw new Error("You must provide source file via first argument");
}

const createParseStream = () => new Pumpify.obj(createReadStream(srcPath), split(), new Parser());

const firstPass = async (): Promise<SymbolMap> => {
  const symbolMap = new Map(Object.entries(defaultSymbolMap));

  await pipeline(
    createParseStream(),
    new Transform({
      objectMode: true,
      transform(instruction: Instruction, _encoding, done) {
        if (instruction.type === InstructionType.L_INSTRUCTION) {
          symbolMap.set(instruction.symbol, instruction.number.toString());
        }
        done();
      },
    }),
  );

  return symbolMap;
};

const secondPass = async (symbolMap: SymbolMap) => {
  const outputPath = path.resolve(path.dirname(srcPath), path.basename(srcPath, path.extname(srcPath)) + ".hack");
  await pipeline(
    createParseStream(),
    new Translator(symbolMap),
    new Transform({
      objectMode: true,
      transform(code: string, _encoding, done) {
        this.push(code + "\n");
        done();
      },
    }),
    createWriteStream(outputPath),
  );
};

firstPass().then(secondPass);
