import type {
  tokenSpec,
  TokenType,
  Declaration,
  Statement,
  Expression,
  ClassVariableKind,
  SubroutineKind,
  MemorySegment,
} from "./spec.js";

export type TokenSpecEntryTransform = (value: string) => any;
export type TokenSpecEntry = [RegExp, string | null, TokenSpecEntryTransform?];
export type TokenSpec = Array<TokenSpecEntry>;

export type TokenUnion = {
  [K in (typeof tokenSpec)[number] as K[1] extends string ? K[1] : ""]: K[1] extends string
    ? {
        type: K[1];
        value: K[2] extends (value: string) => infer T ? T : string;
        raw: string;
      }
    : never;
}[(typeof tokenSpec)[number][1] & string];

export type TokenTypeUnion = TokenUnion["type"];
export type Token<T extends TokenTypeUnion> = Extract<TokenUnion, { type: T }>;

export type TypeNode = Token<TokenType.TYPE_LITERAL | TokenType.IDENTIFIER>;
export type IdentifierNode = Token<TokenType.IDENTIFIER>;
export type NumericLiteralNode = Token<TokenType.NUMERIC_LITERAL>;
export type StringLiteralNode = Token<TokenType.STRING_LITERAL>;
export type BooleanLiteralNode = Token<TokenType.BOOLEAN_LITERAL>;
export type ThisNode = Token<TokenType.This>;
export type NullNode = Token<TokenType.Null>;
export type LiteralNode = NumericLiteralNode | StringLiteralNode | BooleanLiteralNode | ThisNode | NullNode;

export type ClassDeclarationNode = {
  type: Declaration.Class;
  name: IdentifierNode;
  body: {
    classVariableList: ClassVariableDeclarationNode[];
    subroutineList: SubroutineDeclarationNode[];
  };
};

export type ClassVariableDeclarationNode = {
  type: Declaration.ClassVar;
  kind: ClassVariableKind;
  varType: TypeNode;
  identifiers: IdentifierNode[];
};

export type SubroutineDeclarationNode = {
  type: Declaration.Subroutine;
  kind: SubroutineKind;
  returnType: TypeNode;
  name: IdentifierNode;
  parameters: ParameterNode[];
  body: {
    varDeclarations: VariableDeclarationNode[];
    statements: StatementNode[];
  };
};

export type ParameterNode = {
  varType: TypeNode;
  identifier: IdentifierNode;
};

export type VariableDeclarationNode = {
  type: Declaration.Var;
  varType: TypeNode;
  identifiers: IdentifierNode[];
};

export type StatementNode =
  | LetStatementNode
  | IfStatementNode
  | WhileStatementNode
  | DoStatementNode
  | ReturnStatementNode;

export type LetStatementNode = {
  type: Statement.Let;
  left: IdentifierNode | ArrayMemberExpressionNode;
  right: ExpressionNode;
};

export type IfStatementNode = {
  type: Statement.If;
  test: ExpressionNode;
  consequent: StatementNode[];
  alternate: StatementNode[] | null;
};

export type WhileStatementNode = {
  type: Statement.While;
  test: ExpressionNode;
  body: StatementNode[];
};

export type DoStatementNode = {
  type: Statement.Do;
  call: SubroutineCallExpressionNode;
};

export type ReturnStatementNode = {
  type: Statement.Return;
  argument: ExpressionNode | null;
};

export type ExpressionNode =
  | LiteralNode
  | IdentifierNode
  | UnaryExpressonNode
  | BinaryExpressionNode
  | ArrayMemberExpressionNode
  | SubroutineCallExpressionNode;

export type BinaryExpressionNode = {
  type: Expression.Binary;
  operator: string;
  left: ExpressionNode;
  right: ExpressionNode;
};

export type LogicalExpressionNode = {
  type: Expression.Logical;
  operator: string;
  left: ExpressionNode;
  right: ExpressionNode;
};

export type UnaryExpressonNode = {
  type: Expression.Unary;
  operator: string;
  argument: ExpressionNode;
};

export type ArrayMemberExpressionNode = {
  type: Expression.ArrayMember;
  identifier: IdentifierNode;
  member: ExpressionNode;
};

export type SubroutineCallExpressionNode = {
  type: Expression.SubroutineCall;
  name: IdentifierNode;
  arguments: ExpressionNode[];
} & ({ isMemberCall: false } | { isMemberCall: true; ownerName: IdentifierNode });

export type SymbolTable = Map<
  string,
  {
    kind: ClassVariableKind | "parameter" | "local";
    memorySegment: MemorySegment;
    varType: TypeNode;
    index: number;
  }
>;
