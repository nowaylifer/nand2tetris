import Pumpify from "pumpify";
import { createReadStream } from "fs";
import type { Token } from "./types.js";
import Tokenizer from "./tokenizer.js";

export default class Parser {
  private tokenStream: Pumpify;
  private tokenGenerator: AsyncGenerator<Token>;

  constructor(srcPath: string) {
    this.tokenStream = new Pumpify.obj(createReadStream(srcPath), new Tokenizer());
    this.tokenGenerator = this.createTokenGenerator();
  }

  private async *createTokenGenerator() {
    for await (const token of this.tokenStream) {
      yield token as Token;
    }
  }

  private async getNextToken() {
    const token = await this.tokenGenerator.next();
    return token.value as Token | undefined;
  }
}
