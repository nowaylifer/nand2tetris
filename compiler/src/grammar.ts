export enum TokenType {
  KEYWORD = "keyword",
  SYMBOL = "symbol",
  INLINE_COMMENT = "inlineComment",
  MULTILINE_COMMENT = "multilineComment",
  STRING_LITERAL = "stringConstant",
  INTEGER_LITERAL = "integerConstant",
  IDENTIFIER = "identifier",
}

export enum Keyword {
  CLASS = "class",
  CONSTRUCTOR = "constructor",
  FUNCTION = "function",
  METHOD = "method",
  FIELD = "field",
  STATIC = "static",
  VAR = "var",
  INT = "int",
  CHAR = "char",
  BOOLEAN = "boolean",
  VOID = "void",
  TRUE = "true",
  FALSE = "false",
  NULL = "null",
  THIS = "this",
  LET = "let",
  DO = "do",
  IF = "if",
  ELSE = "else",
  WHILE = "while",
  RETURN = "return",
}

export enum Symbol {
  BRACE_OPEN = "{",
  BRACE_CLOSE = "}",
  PAREN_OPEN = "(",
  PAREN_CLOSE = ")",
  BRACK_OPEN = "[",
  BRACK_CLOSE = "]",
  DOT = ".",
  COMMA = ",",
  SEMI_COLON = ";",
  PLUS = "+",
  MINUS = "-",
  ASTERISK = "*",
  SLASH = "/",
  AMPERSAND = "&",
  VERT_BAR = "|",
  ANGLE_LEFT = "<",
  ANGLE_RIGHT = ">",
  EQUALS = "=",
  TILDA = "~",
}

export enum CommentSymbol {
  INLINE = "//",
  MULTILINE_OPEN = "/*",
  MULTILINE_CLOSE = "*/",
}

export const STRING_QUOTE = '"';

export const MAX_INT = 32767;
export const MIN_INT = 0;
