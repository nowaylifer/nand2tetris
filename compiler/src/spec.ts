import type { TokenSpec } from "./types.js";

export enum TokenType {
  STRING_LITERAL = "StringLiteral",
  NUMERIC_LITERAL = "NumericLiteral",
  BOOLEAN_LITERAL = "BooleanLiteral",
  TYPE_LITERAL = "TypeLiteral",
  IDENTIFIER = "Identifier",
  ADDITVE_OPERATOR = "AdditiveOperator",
  MULTIPLICATIVE_OPERATOR = "MultiplicativeOperator",
  RELATIONAL_OPERATOR = "RelationalOperator",
  SUBROUTINE = "Subroutine",
  CLASS_VARIABLE = "ClassVariable",
  LOGICAL_AND = "LogicalAND",
  LOGICAL_OR = "LogicalOR",
  LOGICAL_NOT = "LogicalNOT",
}

export enum Expression {
  Unary = "UnaryExpression",
  Binary = "BinaryExpression",
  Logical = "LogicalExpression",
  Primary = "PrimaryExpression",
  Additive = "AdditiveExpression",
  Equality = "EqualityExpression",
  LogicalOR = "LogicalORExpression",
  Relational = "RelationalExpression",
  LogicalAND = "LogicalANDExpression",
  ArrayMember = "ArrayMemberExpression",
  LeftHandSide = "LeftHandSideExpression",
  Multiplicative = "MultiplicativeExpression",
  SubroutineCall = "SubroutineCallExpression",
}

export enum Statement {
  If = "IfStatement",
  Do = "DoStatement",
  Let = "LetStatement",
  While = "WhileStatement",
  Return = "ReturnStatement",
}

export enum Declaration {
  Class = "ClassDeclaration",
  Var = "VariableDeclaration",
  Subroutine = "SubroutineDeclaration",
  ClassVar = "ClassVariableDeclaration",
}

export const tokenSpec = [
  // Whitespace
  [/\s+/, null],
  // Comment Inline
  [/\/\/(?<value>.*)/, null],
  // Multiline Comment
  [/\/\*(?<value>[\s\S]*?)\*\//, null],

  // Keywords
  [/if\b/, "if"],
  [/do\b/, "do"],
  [/let\b/, "let"],
  [/var\b/, "var"],
  [/this\b/, "this"],
  [/else\b/, "else"],
  [/while\b/, "while"],
  [/class\b/, "class"],
  [/return\b/, "return"],
  [/null\b/, "null", () => null],
  [/(?:static|field)\b/, TokenType.CLASS_VARIABLE],
  [/(?:int|char|boolean|void)\b/, TokenType.TYPE_LITERAL],
  [/(?:function|method|constructor)\b/, TokenType.SUBROUTINE],
  [/(?:true|false)\b/, TokenType.BOOLEAN_LITERAL, (value: string) => (value === "true" ? true : false)],

  // Symbols, operators:
  [/,/, ","],
  [/=/, "="],
  [/;/, ";"],
  [/\./, "."],
  [/\{/, "{"],
  [/\}/, "}"],
  [/\(/, "("],
  [/\)/, ")"],
  [/\[/, "["],
  [/\]/, "]"],
  [/~/, TokenType.LOGICAL_NOT],
  [/\|/, TokenType.LOGICAL_OR],
  [/\&/, TokenType.LOGICAL_AND],
  [/[+\-]/, TokenType.ADDITVE_OPERATOR],
  [/[><]=?/, TokenType.RELATIONAL_OPERATOR],
  [/[*\/]/, TokenType.MULTIPLICATIVE_OPERATOR],

  [/[a-zA-Z_][a-zA-Z0-9_]*/, TokenType.IDENTIFIER],
  [/"(?<value>[^"\n]*?)"/, TokenType.STRING_LITERAL],
  [/\d+/, TokenType.NUMERIC_LITERAL, (value: string) => Number(value)],
] as const satisfies TokenSpec;
