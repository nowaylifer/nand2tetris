import { TokenType } from "./grammar.js";

type BaseToken = {
  value: string;
  type: Exclude<TokenType, TokenType.STRING_LITERAL | TokenType.INLINE_COMMENT | TokenType.MULTILINE_COMMENT>;
};

type TokenWithInnerValue = {
  value: string;
  innerValue: string;
  type: TokenType.STRING_LITERAL | TokenType.MULTILINE_COMMENT | TokenType.INLINE_COMMENT;
};

export type Token = BaseToken | TokenWithInnerValue;
