import path from "path";
import { Transform } from "stream";
import { pipeline } from "stream/promises";
import { createReadStream, createWriteStream } from "fs";
import Tokenizer from "./tokenizer.js";
import type { Token } from "./types.js";
import { TokenType } from "./grammar.js";
import XMLTransform from "./xmlTransform.js";

const filename = (srcPath: string) => path.basename(srcPath, path.extname(srcPath));

const excludedTokenTypes = [TokenType.MULTILINE_COMMENT, TokenType.INLINE_COMMENT];

const srcPath = process.argv[2];
if (typeof srcPath !== "string") {
  throw new Error("You must provide source path via first argument");
}

await pipeline(
  createReadStream(srcPath),
  new Tokenizer(),
  new Transform({
    objectMode: true,
    transform(token: Token, _, done) {
      if (!excludedTokenTypes.includes(token.type)) {
        this.push({ [token.type]: ` ${"innerValue" in token ? token.innerValue : token.value} ` });
      }
      done();
    },
  }),
  new XMLTransform({ root: "tokens" }),
  createWriteStream("OutT.xml"),
);
