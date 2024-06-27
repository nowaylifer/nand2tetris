import { Transform, type TransformCallback, type TransformOptions } from "stream";
import { CommentSymbol, Keyword, STRING_QUOTE, TokenType, Symbol } from "./grammar.js";
import type { Token } from "./types.js";

const escapeRegExp = (pattern: string) => pattern.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
const regExpFromArray = (arr: string[]) => arr.map(escapeRegExp).join("|");

const keywordPattern = `(?<keyword>(?:${regExpFromArray(Object.values(Keyword))})\\b)`;
const symbolPattern = `(?<symbol>${regExpFromArray(Object.values(Symbol))})`;
const identifierPattern = "(?<identifier>[a-zA-Z_][a-zA-Z0-9_]*)";
const integerPattern = "(?<integer>\\d+)";
const stringPattern = `(?<string>${STRING_QUOTE}(?<innerString>[^${STRING_QUOTE}\\n]*?)${STRING_QUOTE})`;
const inlineCommentPattern = `(?<inlineComment>${escapeRegExp(CommentSymbol.INLINE)}(?<innerInlineComment>.*?)$)`;
const multilineCommentPattern = `(?<multilineComment>${escapeRegExp(CommentSymbol.MULTILINE_OPEN)}(?<innerMultilineComment>[\\s\\S]*?)${escapeRegExp(CommentSymbol.MULTILINE_CLOSE)})`;
const tokenRegExp = new RegExp(
  `^(?:${inlineCommentPattern}|${multilineCommentPattern}|${keywordPattern}|${symbolPattern}|${identifierPattern}|${integerPattern}|${stringPattern})`,
  "m",
);

export default class Tokenizer extends Transform {
  private tail = "";

  constructor(options?: TransformOptions) {
    super({ ...options, objectMode: true });
  }

  override _transform(data: Buffer | string, _encoding: BufferEncoding, done: TransformCallback) {
    let chunk = this.tail + data.toString().trim();
    this.tail = "";
    this.process(chunk);
    done();
  }

  override _flush(done: TransformCallback) {
    this.process(this.tail);
    done();
  }

  private process(input: string) {
    let chunk = input;
    while (chunk) {
      const token = this.parseToken(chunk);

      if (token) {
        this.push(token);
        chunk = chunk.slice(token.value.length).trim();
      } else {
        this.tail = chunk;
        break;
      }
    }
  }

  private parseToken(chunk: string): Token | null {
    const groups = chunk.match(tokenRegExp)?.groups as any;

    if (groups?.keyword) {
      return {
        value: groups.keyword,
        type: TokenType.KEYWORD,
      };
    }

    if (groups?.symbol) {
      return {
        value: groups.symbol,
        type: TokenType.SYMBOL,
      };
    }

    if (groups?.identifier) {
      return {
        value: groups.identifier,
        type: TokenType.IDENTIFIER,
      };
    }

    if (groups?.integer) {
      return {
        value: groups.integer,
        type: TokenType.INTEGER_LITERAL,
      };
    }

    if (groups?.string) {
      return {
        value: groups.string,
        type: TokenType.STRING_LITERAL,
        innerValue: groups.innerString,
      };
    }

    if (groups?.inlineComment) {
      return {
        value: groups.inlineComment,
        type: TokenType.INLINE_COMMENT,
        innerValue: groups.innerInlineComment,
      };
    }

    if (groups?.multilineComment) {
      return {
        value: groups.multilineComment,
        type: TokenType.MULTILINE_COMMENT,
        innerValue: groups.innerMultilineComment,
      };
    }

    return null;
  }
}
