import type { TokenSpec } from "./types.js";

export enum VMCommand {
  Return = "return",
  IfGoto = "if-goto",
  Goto = "goto",
  Label = "label",
  Function = "function",
  Call = "call",
  Push = "push",
  Pop = "pop",
  Add = "add",
  Sub = "sub",
  Neg = "neg",
  Eq = "eq",
  Gt = "gt",
  Lt = "lt",
  And = "and",
  Or = "or",
  Not = "not",
}

export const BinaryOperatorToCommandMap = {
  "+": VMCommand.Add,
  "-": VMCommand.Sub,
  "=": VMCommand.Eq,
  ">": VMCommand.Gt,
  "<": VMCommand.Lt,
  "&": VMCommand.And,
  "|": VMCommand.Or,
  "*": `${VMCommand.Call} Math.multiply 2`,
  "/": `${VMCommand.Call} Math.divide 2`,
};

export const UnaryOperatorToCommandMap = {
  "-": VMCommand.Neg,
  "~": VMCommand.Not,
};

export enum MemorySegment {
  Argument = "argument",
  Local = "local",
  Static = "static",
  Constant = "constant",
  This = "this",
  That = "that",
  Pointer = "pointer",
  Temp = "temp",
}

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
  This = "This",
  Null = "Null",
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

export enum SubroutineKind {
  Function = "Function",
  Method = "Method",
  Constructor = "Constructor",
}

export enum ClassVariableKind {
  Static = "Static",
  Field = "Field",
}

export enum TypeLiteral {
  Int = "Int",
  Char = "Char",
  Void = "Void",
  Boolean = "Boolean",
}

const capitalize = (s: string) => s[0]?.toUpperCase() ?? "" + s.slice(1);

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
  [/else\b/, "else"],
  [/while\b/, "while"],
  [/class\b/, "class"],
  [/return\b/, "return"],
  [/this\b/, TokenType.This],
  [/null\b/, TokenType.Null, () => null],
  [/(?:int|char|boolean|void)\b/, TokenType.TYPE_LITERAL, (value) => TypeLiteral[capitalize(value) as TypeLiteral]],
  [/(?:true|false)\b/, TokenType.BOOLEAN_LITERAL, (value) => (value === "true" ? true : false)],
  [
    /(?:static|field)\b/,
    TokenType.CLASS_VARIABLE,
    (value) => ClassVariableKind[capitalize(value) as ClassVariableKind],
  ],
  [
    /(?:function|method|constructor)\b/,
    TokenType.SUBROUTINE,
    (value) => SubroutineKind[capitalize(value) as SubroutineKind],
  ],

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
  [/[><]/, TokenType.RELATIONAL_OPERATOR],
  [/[*\/]/, TokenType.MULTIPLICATIVE_OPERATOR],

  [/[a-zA-Z_][a-zA-Z0-9_]*/, TokenType.IDENTIFIER],
  [/"(?<value>[^"\n]*?)"/, TokenType.STRING_LITERAL],
  [/\d+/, TokenType.NUMERIC_LITERAL, (value: string) => Number(value)],
] as const satisfies TokenSpec;
