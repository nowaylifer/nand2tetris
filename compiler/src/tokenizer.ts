import { Readable } from "stream";
import type { TokenSpecEntryTransform, TokenSpec, TokenUnion } from "./types.js";

export default class Tokenizer {
  private chunkGenerator: AsyncGenerator<string, null, void>;
  private readStream: Readable;
  private spec: TokenSpec;
  private tail = "";

  constructor(readStream: Readable, spec: TokenSpec) {
    this.readStream = readStream;
    this.spec = spec.map(([regexp, ...rest]) => [new RegExp(`^${regexp.source}`), ...rest]);
    this.chunkGenerator = this.createChunkGenerator();
  }

  async getNextToken(): Promise<TokenUnion | null> {
    const chunk = this.tail || (await this.read());
    if (!chunk) {
      return null;
    }

    const token = this.parseToken(chunk);
    if (token) {
      return token;
    }

    const newChunk = await this.read();
    if (newChunk === null) {
      if (this.tail) {
        throw new SyntaxError(`Unexpected token: ${chunk}`);
      }
      return null;
    }

    this.tail += newChunk;
    return await this.getNextToken();
  }

  private parseToken(chunk: string): TokenUnion | null {
    if (!chunk) {
      return null;
    }

    for (const [regexp, type, transform] of this.spec) {
      const match = chunk.match(regexp);

      if (match) {
        this.tail = chunk.slice(match[0].length);
        if (type === null) {
          return this.parseToken(this.tail);
        }
        return {
          type,
          value: this.getTokenValue(match, transform),
          raw: match[0],
        } as TokenUnion;
      }
    }

    return null;
  }

  private getTokenValue(match: RegExpMatchArray, transform?: TokenSpecEntryTransform) {
    const value = match.groups?.value ?? match[0];
    return transform ? transform(value) : value;
  }

  private async read() {
    return (await this.chunkGenerator.next()).value;
  }

  private async *createChunkGenerator(): AsyncGenerator<string, null, void> {
    for await (const chunk of this.readStream) {
      yield chunk.toString();
    }
    return null;
  }
}
