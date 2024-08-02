import type { Readable } from "stream";
import Tokenizer from "./tokenizer.js";
import { Declaration, Expression, Statement, TokenType, tokenSpec } from "./spec.js";
import type {
  ClassVariableDeclarationNode,
  SubroutineCallExpressionNode,
  SubroutineDeclarationNode,
  ArrayMemberExpressionNode,
  VariableDeclarationNode,
  ClassDeclarationNode,
  ReturnStatementNode,
  UnaryExpressonNode,
  WhileStatementNode,
  LetStatementNode,
  DoStatementNode,
  IfStatementNode,
  ExpressionNode,
  TokenTypeUnion,
  IdentifierNode,
  ParameterNode,
  StatementNode,
  LiteralNode,
  TokenUnion,
  Token,
} from "./types.js";

export default class Parser {
  private lookahead: TokenUnion | null = null;
  private tokenizer: Tokenizer;

  constructor(readStream: Readable) {
    this.tokenizer = new Tokenizer(readStream, tokenSpec);
  }

  async parse() {
    this.lookahead = await this.tokenizer.getNextToken();
    return this.ClassDeclaration();
  }

  private async ClassDeclaration(): Promise<ClassDeclarationNode> {
    await this.eat("class");
    const name = await this.Identifier();
    await this.eat("{");
    const classVariableList = await this.ClassVariableDeclarationList();
    const subroutineList = await this.SubroutineDeclarationList();
    await this.eat("}");

    return {
      type: Declaration.Class,
      name,
      body: {
        classVariableList,
        subroutineList,
      },
    };
  }

  private async ClassVariableDeclarationList() {
    const declarations = [];

    while (this.lookahead?.type === TokenType.CLASS_VARIABLE) {
      declarations.push(await this.ClassVariableDeclaration());
    }

    return declarations;
  }

  private async ClassVariableDeclaration(): Promise<ClassVariableDeclarationNode> {
    const kind = (await this.eat(TokenType.CLASS_VARIABLE)).value;
    const varType = await this.Type();
    const identifiers = await this.VariableIdentifierList();
    await this.eat(";");

    return {
      type: Declaration.ClassVar,
      kind,
      varType,
      identifiers,
    };
  }

  private async SubroutineDeclarationList() {
    const declarations = [];

    while (this.lookahead?.type === TokenType.SUBROUTINE) {
      declarations.push(await this.SubroutineDeclaration());
    }

    return declarations;
  }

  private async SubroutineDeclaration(): Promise<SubroutineDeclarationNode> {
    const kind = (await this.eat(TokenType.SUBROUTINE)).value;
    const returnType = await this.Type();
    const name = await this.Identifier();
    await this.eat("(");
    const parameters = this.lookahead?.type !== ")" ? await this.ParameterList() : [];
    await this.eat(")");
    await this.eat("{");
    const varDeclarations = await this.VariableDeclarationList();
    const statements = await this.StatementList();
    await this.eat("}");

    return {
      type: Declaration.Subroutine,
      kind,
      returnType,
      name,
      parameters,
      body: {
        varDeclarations,
        statements,
      },
    };
  }

  private async StatementList() {
    const statementList = [];

    while (this.lookahead && this.isStatement(this.lookahead.type)) {
      statementList.push(await this.Statement());
    }

    return statementList;
  }

  private Statement(): Promise<StatementNode> {
    switch (this.lookahead?.type) {
      case "let":
        return this.LetStatement();
      case "if":
        return this.IfStatement();
      case "while":
        return this.WhileStatement();
      case "return":
        return this.ReturnStatement();
      case "do":
        return this.DoStatement();
      default:
        throw new SyntaxError("Statement: unexpected statement production");
    }
  }

  private isStatement(tokenType: TokenTypeUnion) {
    return (
      tokenType === "let" || tokenType === "if" || tokenType === "while" || tokenType === "return" || tokenType === "do"
    );
  }

  private async DoStatement(): Promise<DoStatementNode> {
    await this.eat("do");
    const call = await this.SubroutineCallExpression();
    await this.eat(";");
    return {
      type: Statement.Do,
      call,
    };
  }

  private async ParameterList(): Promise<ParameterNode[]> {
    const parameters = [];

    do {
      parameters.push({
        varType: await this.Type(),
        identifier: await this.Identifier(),
      });
    } while (this.lookahead?.type === "," && (await this.eat(",")));

    return parameters;
  }

  private async ReturnStatement(): Promise<ReturnStatementNode> {
    await this.eat("return");
    const argument = this.lookahead?.type !== ";" ? await this.Expression() : null;
    await this.eat(";");
    return {
      type: Statement.Return,
      argument,
    };
  }

  private async WhileStatement(): Promise<WhileStatementNode> {
    await this.eat("while");
    await this.eat("(");
    const test = await this.Expression();
    await this.eat(")");
    await this.eat("{");
    const body = await this.StatementList();
    await this.eat("}");

    return {
      type: Statement.While,
      test,
      body,
    };
  }

  private async IfStatement(): Promise<IfStatementNode> {
    await this.eat("if");
    await this.eat("(");
    const test = await this.Expression();
    await this.eat(")");
    await this.eat("{");
    const consequent = await this.StatementList();
    await this.eat("}");

    let alternate = null;

    if (this.lookahead?.type === "else") {
      await this.eat("else");
      await this.eat("{");
      alternate = await this.StatementList();
      await this.eat("}");
    }

    return {
      type: Statement.If,
      test,
      consequent,
      alternate,
    };
  }

  private async VariableDeclarationList() {
    const declarations = [];

    while (this.lookahead && this.lookahead?.type === "var") {
      declarations.push(await this.VariableDeclaration());
    }

    return declarations;
  }

  private async VariableDeclaration(): Promise<VariableDeclarationNode> {
    await this.eat("var");
    const varType = await this.Type();
    const identifiers = await this.VariableIdentifierList();
    await this.eat(";");

    return {
      type: Declaration.Var,
      varType,
      identifiers,
    };
  }

  private async VariableIdentifierList() {
    const identifiers = [];

    do {
      identifiers.push(await this.Identifier());
    } while (this.lookahead?.type === "," && (await this.eat(",")));

    return identifiers;
  }

  private Type() {
    if (this.lookahead?.type === TokenType.TYPE_LITERAL) {
      return this.eat(TokenType.TYPE_LITERAL);
    }
    return this.eat(TokenType.IDENTIFIER);
  }

  private async LetStatement(): Promise<LetStatementNode> {
    await this.eat("let");
    const left = await this.LeftHandSideExpression();
    await this.eat("=");
    const right = await this.Expression();
    await this.eat(";");

    return {
      type: Statement.Let,
      left,
      right,
    };
  }

  private async LeftHandSideExpression(identifier?: IdentifierNode) {
    if (!identifier) {
      identifier = await this.Identifier();
    }

    if (this.lookahead?.type === "[") {
      return this.ArrayMemberExpression(identifier);
    }

    return identifier;
  }

  private async ArrayMemberExpression(identifier: IdentifierNode): Promise<ArrayMemberExpressionNode> {
    await this.eat("[");
    const member = await this.Expression();
    await this.eat("]");
    return {
      type: Expression.ArrayMember,
      identifier,
      member,
    };
  }

  private async ArgumentList() {
    const expressionList = [];

    do {
      expressionList.push(await this.Expression());
    } while (this.lookahead?.type === "," && (await this.eat(",")));

    return expressionList;
  }

  private Expression(): Promise<ExpressionNode> {
    return this.LogicalORExpression();
  }

  private LogicalORExpression() {
    return this.BinaryExpression(Expression.LogicalAND, TokenType.LOGICAL_OR);
  }

  private LogicalANDExpression() {
    return this.BinaryExpression(Expression.Equality, TokenType.LOGICAL_AND);
  }

  private EqualityExpression() {
    return this.BinaryExpression(Expression.Relational, "=");
  }

  private RelationalExpression() {
    return this.BinaryExpression(Expression.Additive, TokenType.RELATIONAL_OPERATOR);
  }

  private AdditiveExpression() {
    return this.BinaryExpression(Expression.Multiplicative, TokenType.ADDITVE_OPERATOR);
  }

  private MultiplicativeExpression() {
    return this.BinaryExpression(Expression.Primary, TokenType.MULTIPLICATIVE_OPERATOR);
  }

  private async BinaryExpression(
    builderName:
      | Expression.Primary
      | Expression.Multiplicative
      | Expression.Additive
      | Expression.Relational
      | Expression.Equality
      | Expression.LogicalAND,
    operatorTokenType:
      | TokenType.ADDITVE_OPERATOR
      | TokenType.MULTIPLICATIVE_OPERATOR
      | TokenType.RELATIONAL_OPERATOR
      | TokenType.LOGICAL_AND
      | TokenType.LOGICAL_OR
      | "=",
  ): Promise<ExpressionNode> {
    let left = await this[builderName]();

    while (this.lookahead?.type === operatorTokenType) {
      const operator = (await this.eat(operatorTokenType)).value;
      const right = await this[builderName]();

      left = {
        type: Expression.Binary,
        operator,
        left,
        right,
      };
    }

    return left;
  }

  private async UnaryExpression(): Promise<UnaryExpressonNode> {
    let operator;

    switch (this.lookahead?.type) {
      case TokenType.ADDITVE_OPERATOR:
        operator = (await this.eat(TokenType.ADDITVE_OPERATOR)).value;
        break;
      case TokenType.LOGICAL_NOT:
        operator = (await this.eat(TokenType.LOGICAL_NOT)).value;
        break;
      default:
        throw new SyntaxError("UnaryExpression: unexpected expression production");
    }

    return {
      type: Expression.Unary,
      operator,
      argument: await this.PrimaryExpression(),
    };
  }

  private async SubroutineCallExpression(identifier?: IdentifierNode): Promise<SubroutineCallExpressionNode> {
    if (!identifier) {
      identifier = await this.Identifier();
    }

    let method;

    if (this.lookahead?.type === ".") {
      await this.eat(".");
      method = await this.Identifier();
    }

    await this.eat("(");
    const args = this.lookahead?.type !== ")" ? await this.ArgumentList() : [];
    await this.eat(")");

    return {
      type: Expression.SubroutineCall,
      ...(method ? { isMemberCall: true, ownerName: identifier } : { isMemberCall: false }),
      name: method ?? identifier,
      arguments: args,
    };
  }

  private async PrimaryExpression(): Promise<ExpressionNode> {
    if (this.isLiteral(this.lookahead?.type!)) {
      return this.Literal();
    }

    switch (this.lookahead?.type) {
      case TokenType.ADDITVE_OPERATOR:
      case TokenType.LOGICAL_NOT:
        return this.UnaryExpression();
      case "(":
        return this.ParenthesizedExpression();
      default:
        const identifier = await this.Identifier();

        if (this.lookahead?.type === ("(" as TokenTypeUnion) || this.lookahead?.type === ".") {
          return this.SubroutineCallExpression(identifier);
        }

        return this.LeftHandSideExpression(identifier);
    }
  }

  private isLiteral(tokenType: TokenTypeUnion): tokenType is LiteralNode["type"] {
    return (
      tokenType === TokenType.NUMERIC_LITERAL ||
      tokenType === TokenType.STRING_LITERAL ||
      tokenType === TokenType.BOOLEAN_LITERAL ||
      tokenType === TokenType.Null ||
      tokenType === TokenType.This
    );
  }

  private async ParenthesizedExpression() {
    await this.eat("(");
    const expression = await this.Expression();
    await this.eat(")");
    return expression;
  }

  private Identifier() {
    return this.eat(TokenType.IDENTIFIER);
  }

  private Literal() {
    switch (this.lookahead?.type) {
      case TokenType.NUMERIC_LITERAL:
        return this.NumericLiteral();
      case TokenType.STRING_LITERAL:
        return this.StringLiteral();
      case TokenType.BOOLEAN_LITERAL:
        return this.BooleanLiteral();
      case TokenType.Null:
        return this.Null();
      case TokenType.This:
        return this.This();
      default:
        throw new SyntaxError("Literal: unexpected literal production");
    }
  }

  private BooleanLiteral() {
    return this.eat(TokenType.BOOLEAN_LITERAL);
  }

  private Null() {
    return this.eat(TokenType.Null);
  }

  private This() {
    return this.eat(TokenType.This);
  }

  private NumericLiteral() {
    return this.eat(TokenType.NUMERIC_LITERAL);
  }

  private StringLiteral() {
    return this.eat(TokenType.STRING_LITERAL);
  }

  private async eat<T extends TokenTypeUnion>(tokenType: T): Promise<Token<T>> {
    const token = this.lookahead ?? (await this.tokenizer.getNextToken());

    if (token === null) {
      throw new SyntaxError(`Unexpected end of input, expected: "${tokenType}"`);
    }

    if (token.type !== tokenType) {
      throw new SyntaxError(`Unexpected token: "${token.value}", expected: ${tokenType}`);
    }

    this.lookahead = await this.tokenizer.getNextToken();
    return token as Token<T>;
  }
}
