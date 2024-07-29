import type { Writable } from "node:stream";
import {
  BinaryOperatorToCommandMap,
  ClassVariableKind,
  Expression,
  MemorySegment,
  SubroutineKind,
  TokenType,
  UnaryOperatorToCommandMap,
  VMCommand,
} from "./spec.js";
import type {
  SymbolTable,
  IdentifierNode,
  BooleanLiteralNode,
  NumericLiteralNode,
  ClassDeclarationNode,
  SubroutineDeclarationNode,
  LetStatementNode,
  StatementNode,
  ExpressionNode,
  BinaryExpressionNode,
  UnaryExpressonNode,
  SubroutineCallExpressionNode,
  StringLiteralNode,
  ArrayMemberExpressionNode,
  DoStatementNode,
  IfStatementNode,
  WhileStatementNode,
  ReturnStatementNode,
} from "./types.js";
import { createWriteStream } from "node:fs";

export default class BytecodeEmitter {
  private classSymbolTable: SymbolTable = new Map();
  private subroutineSymbolTable: SymbolTable = new Map();
  private writeStream: Writable;
  private classNode: ClassDeclarationNode;
  private ifLabelIndex = 0;
  private loopLabelIndex = 0;

  constructor(classNode: ClassDeclarationNode, outputPath: string) {
    this.classNode = classNode;
    this.writeStream = createWriteStream(outputPath);
  }

  emit() {
    this.populateClassSymbolTable();
    return this.classNode.body.subroutineList.map(this.SubroutineDeclaration);
  }

  private write(line: string | number | Array<string | number>) {
    this.writeStream.write(Array.isArray(line) ? line.join(" ") : line.toString() + "\n");
  }

  private SubroutineDeclaration(node: SubroutineDeclarationNode) {
    this.subroutineSymbolTable = new Map();
    this.populateSubroutineSymbolTable(node);

    const commands = [`function ${this.classNode.name.value}.${node.name.value} ${this.getFunctionNVar(node)}`];

    if (node.kind == SubroutineKind.Method) {
      commands.concat([`${VMCommand.Push} ${MemorySegment.Argument} 0`, `${VMCommand.Pop} ${MemorySegment.Pointer} 0`]);
    }
  }

  private StatementList(statements: StatementNode[]) {
    for (const statement of statements) {
      this[statement.type](statement as any);
    }
  }

  private ReturnStatement(node: ReturnStatementNode) {
    if (node.argument) {
      this.Expression(node.argument);
    } else {
      this.Push(MemorySegment.Constant, 0);
    }
    this.write(VMCommand.Return);
  }

  private LetStatement(node: LetStatementNode) {
    this.Expression(node.right);
    if (node.left.type === Expression.ArrayMember) {
      this.PopArrayMember(node.left);
    } else {
      this.PopIdentifier(node.left);
    }
  }

  private DoStatement(node: DoStatementNode) {
    this.SubroutineCallExpression(node.call);
    this.Pop(MemorySegment.Temp, 0);
  }

  private IfStatement(node: IfStatementNode) {
    const ifLabel = `IF_${this.ifLabelIndex++}`;
    const afterIfLabel = `AFTER_IF_${this.ifLabelIndex}`;

    this.Expression(node.test);
    this.write(VMCommand.Not);
    this.write([VMCommand.IfGoto, ifLabel]);
    if (node.alternate) {
      this.StatementList(node.alternate);
    }
    this.write([VMCommand.Goto, afterIfLabel]);
    this.write([VMCommand.Label, ifLabel]);
    this.StatementList(node.consequent);
    this.write([VMCommand.Label, afterIfLabel]);
  }

  private WhileStatement(node: WhileStatementNode) {
    const loopLabel = `LOOP_${this.loopLabelIndex++}`;
    const afterLoopLabel = `AFTER_LOOP_${this.loopLabelIndex}`;
    this.write([VMCommand.Label, loopLabel]);
    this.Expression(node.test);
    this.write(VMCommand.Not);
    this.write([VMCommand.IfGoto, afterLoopLabel]);
    this.StatementList(node.body);
    this.write([VMCommand.Goto, loopLabel]);
    this.write([VMCommand.Label, afterLoopLabel]);
  }

  private Expression(node: ExpressionNode): void {
    switch (node.type) {
      case TokenType.This:
        return this.PushThisPointer();
      case TokenType.IDENTIFIER:
        return this.PushIdentifier(node);
      case Expression.ArrayMember:
        return this.PushArrayMember(node);
      default:
        return this[node.type](node as any);
    }
  }

  private PopArrayMember(node: ArrayMemberExpressionNode) {
    this._arrayMemberExpression(node);
    this.Pop(MemorySegment.That, 0);
  }

  private PushArrayMember(node: ArrayMemberExpressionNode) {
    this._arrayMemberExpression(node);
    this.Push(MemorySegment.That, 0);
  }

  private _arrayMemberExpression(node: ArrayMemberExpressionNode) {
    this.PushIdentifier(node.identifier);
    this.Expression(node.member);
    this.write(VMCommand.Add);
    this.PopThatPointer();
  }

  private SubroutineCallExpression(node: SubroutineCallExpressionNode) {
    let fnName = node.name.value;
    let argLen = node.arguments.length + 1;

    if (node.isMemberCall) {
      fnName = `${node.ownerName.value}.${fnName}`;

      if (this.resolveIdentifier(node.ownerName)) {
        this.PushIdentifier(node.ownerName);
      } else {
        argLen--;
      }
    } else {
      fnName = `${this.classNode.name.value}.${fnName}`;
      this.PushThisPointer();
    }

    for (const argNode of node.arguments) {
      this.Expression(argNode);
    }

    this.Call(fnName, argLen);
  }

  private BinaryExpression(node: BinaryExpressionNode) {
    this.Expression(node.left);
    this.Expression(node.right);
    this.write(BinaryOperatorToCommandMap[node.operator as keyof typeof BinaryOperatorToCommandMap]);
  }

  private UnaryExpression(node: UnaryExpressonNode) {
    this.Expression(node);
    this.write(UnaryOperatorToCommandMap[node.operator as keyof typeof UnaryOperatorToCommandMap]);
  }

  private getFunctionNVar(node: SubroutineDeclarationNode) {
    return node.body.varDeclarations.reduce((n, declaration) => n + declaration.identifiers.length, 0);
  }

  private PopThatPointer() {
    this.Pop(...this._thatPointer());
  }

  private PushThatPointer() {
    this.Push(...this._thatPointer());
  }

  private PopThisPointer() {
    this.Pop(...this._thisPointer());
  }

  private PushThisPointer() {
    this.Push(...this._thisPointer());
  }

  private PushIdentifier(node: IdentifierNode) {
    this.Push(...this._identifier(node));
  }

  private PopIdentifier(node: IdentifierNode) {
    this.Pop(...this._identifier(node));
  }

  private Pop(memorySegment: MemorySegment, index: number) {
    this.write([VMCommand.Pop, memorySegment, index]);
  }

  private Push(memorySegment: MemorySegment, index: number) {
    this.write([VMCommand.Push, memorySegment, index]);
  }

  private Call(func: string, nVar: number) {
    this.write([VMCommand.Call, func, nVar]);
  }

  private StringLiteral(node: StringLiteralNode) {
    this.Push(MemorySegment.Constant, node.value.length);
    this.Call("String.new", 1);

    for (const char of node.value) {
      this.Push(MemorySegment.Constant, char.charCodeAt(0));
      this.Call("String.appendChar", 2);
    }
  }

  private BooleanLiteral(node: BooleanLiteralNode) {
    this.Push(MemorySegment.Constant, node.value ? 1 : 0);
    if (node.value) {
      this.write(VMCommand.Neg);
    }
  }

  private NumericLiteral(node: NumericLiteralNode) {
    this.Push(MemorySegment.Constant, node.value);
  }

  private Null() {
    this.Push(MemorySegment.Constant, 0);
  }

  private _thisPointer() {
    return [MemorySegment.Pointer, 0] as const;
  }

  private _thatPointer() {
    return [MemorySegment.Pointer, 1] as const;
  }

  private _identifier(node: IdentifierNode) {
    const entry = this.resolveIdentifierOrThrow(node);
    return [entry.memorySegment, entry.index] as const;
  }

  private resolveIdentifierOrThrow(node: IdentifierNode) {
    const resolved = this.resolveIdentifier(node);
    if (!resolved) {
      throw new SyntaxError(`Cannot find name '${node.value}'`);
    }
    return resolved;
  }

  private resolveIdentifier(node: IdentifierNode | "this") {
    if (node === "this") {
      return this.subroutineSymbolTable.get("this");
    }

    if (this.subroutineSymbolTable.has(node.value)) {
      return this.subroutineSymbolTable.get(node.value)!;
    }

    if (this.classSymbolTable.has(node.value)) {
      return this.classSymbolTable.get(node.value)!;
    }

    return null;
  }

  private populateSubroutineSymbolTable(node: SubroutineDeclarationNode) {
    let argumentIndex = 0;
    let localIndex = 0;

    const params =
      node.kind === SubroutineKind.Method
        ? [{ identifier: { value: "this" }, varType: this.classNode.name }, ...node.parameters]
        : node.parameters;

    for (const param of params) {
      this.subroutineSymbolTable.set(param.identifier.value, {
        kind: "parameter",
        memorySegment: MemorySegment.Argument,
        varType: param.varType,
        index: argumentIndex++,
      });
    }

    for (const varNode of node.body.varDeclarations) {
      for (const identifer of varNode.identifiers) {
        this.subroutineSymbolTable.set(identifer.value, {
          kind: "local",
          memorySegment: MemorySegment.Local,
          varType: varNode.varType,
          index: localIndex++,
        });
      }
    }
  }

  private populateClassSymbolTable() {
    let staticIndex = 0;
    let fieldIndex = 0;

    for (const varNode of this.classNode.body.classVariableList) {
      for (const identifer of varNode.identifiers) {
        this.classSymbolTable.set(identifer.value, {
          kind: varNode.kind,
          memorySegment: varNode.kind === ClassVariableKind.Field ? MemorySegment.This : MemorySegment.Static,
          varType: varNode.varType,
          index: varNode.kind === ClassVariableKind.Field ? fieldIndex++ : staticIndex++,
        });
      }
    }
  }
}
