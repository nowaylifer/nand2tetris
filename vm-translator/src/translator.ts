import { Transform, type TransformCallback, type TransformOptions } from "stream";
import type { ArithmeticCommand, Command, MemorySegmentCommon, PopCommand, PushCommand } from "./types.js";
import {
  TEMP_SEGMENT_START,
  memorySegmentMap,
  MemorySegment,
  CommandType,
  ArithmeticCommandEnum,
  arithmeticMap,
} from "./command-set.js";

export default class Translator extends Transform {
  private filename: string;
  private ifCount = -1;

  constructor(filename: string, options?: TransformOptions) {
    super({ ...options, objectMode: true });
    this.filename = filename;
  }

  override _transform(command: Command, _encoding: BufferEncoding, done: TransformCallback) {
    const code = `// ${command.value}\n` + this.translate(command).join("\n") + "\n";
    this.push(code);
    done();
  }

  private translate(command: Command) {
    switch (command.type) {
      case CommandType.C_ARITHMETIC:
        return this.translateArithmeticCommand(command);
      case CommandType.C_PUSH:
        return this.translatePushCommand(command);
      case CommandType.C_POP:
        return this.translatePopCommand(command);
    }
  }

  private translateArithmeticCommand(command: ArithmeticCommand) {
    switch (command.value) {
      case ArithmeticCommandEnum.Eq:
      case ArithmeticCommandEnum.Gt:
      case ArithmeticCommandEnum.Lt:
        return this.compare(command.value);
      case ArithmeticCommandEnum.Add:
        return this.add();
      case ArithmeticCommandEnum.Sub:
        return this.sub();
      case ArithmeticCommandEnum.Neg:
        return this.neg();
      case ArithmeticCommandEnum.Not:
        return this.not();
      case ArithmeticCommandEnum.And:
        return this.and();
      case ArithmeticCommandEnum.Or:
        return this.or();
      default:
        throw new Error(`Invalid arithmetic command: "${command.value}"`);
    }
  }

  private translatePopCommand(command: PopCommand) {
    switch (command.memorySegment) {
      case MemorySegment.Local:
      case MemorySegment.Argument:
      case MemorySegment.This:
      case MemorySegment.That:
        return this.popCommon(command.memorySegment, command.index);
      case MemorySegment.Temp:
        return this.popTemp(command.index);
      case MemorySegment.Static:
        return this.popStatic(command.index);
      case MemorySegment.Pointer:
        return this.popPointer(command.index);
      default:
        throw new Error(`Cannot pop to segment "${command.memorySegment}" index ${command.index}`);
    }
  }

  private translatePushCommand(command: PushCommand) {
    switch (command.memorySegment) {
      case MemorySegment.Local:
      case MemorySegment.Argument:
      case MemorySegment.This:
      case MemorySegment.That:
        return this.pushCommon(command.memorySegment, command.index);
      case MemorySegment.Constant:
        return this.pushConstant(command.index);
      case MemorySegment.Temp:
        return this.pushTemp(command.index);
      case MemorySegment.Static:
        return this.pushStatic(command.index);
      case MemorySegment.Pointer:
        return this.pushPointer(command.index);
      default:
        throw new Error(`Cannot push segment "${command.memorySegment}" index ${command.index}`);
    }
  }

  private add() {
    return [...this.popSnippet(), ...this.popSnippet().slice(0, -1), "D=D+M", ...this.pushSnippet()];
  }

  private sub() {
    return [...this.popSnippet(), ...this.popSnippet().slice(0, -1), "D=M-D", ...this.pushSnippet()];
  }

  private neg() {
    return [...this.popSnippet().slice(0, -1), "D=-M", ...this.pushSnippet()];
  }

  private not() {
    return [...this.popSnippet().slice(0, -1), "D=!M", ...this.popSnippet()];
  }

  private and() {
    return [...this.popSnippet(), ...this.popSnippet().slice(0, -1), "D=D&M", ...this.pushSnippet()];
  }

  private or() {
    return [...this.popSnippet(), ...this.popSnippet().slice(0, -1), "D=D|M", ...this.pushSnippet()];
  }

  private compare(operation: ArithmeticCommandEnum.Eq | ArithmeticCommandEnum.Gt | ArithmeticCommandEnum.Lt) {
    this.ifCount++;
    const ifTrue = `IF_${this.ifCount}_${this.filename}`;
    const afterIf = `AFTER_IF_${this.ifCount}_${this.filename}`;

    return [
      ...this.popSnippet(),
      ...this.popSnippet().slice(0, -1),
      "D=M-D",
      `@${ifTrue}`,
      `D;${arithmeticMap[operation]}`,
      "D=0",
      `@${afterIf}`,
      "0;JMP",
      `(${ifTrue})`,
      "D=-1",
      `(${afterIf})`,
      ...this.pushSnippet(),
    ];
  }

  private popCommon(memorySegment: MemorySegmentCommon, index: number) {
    return [
      `@${index}`,
      "D=A",
      `@${memorySegmentMap[memorySegment]}`,
      "D=D+M",
      "@R0",
      "M=D",
      ...this.popSnippet(),
      "@R0",
      "A=M",
      "M=D",
    ];
  }

  private popStatic(index: number) {
    return [...this.popSnippet(), `@${this.filename}.${index}`, "M=D"];
  }

  private popPointer(index: number) {
    return [...this.popSnippet(), `@${index === 0 ? "THIS" : "THAT"}`, "M=D"];
  }

  private popTemp(index: number) {
    return [...this.popSnippet(), `@${TEMP_SEGMENT_START + index}`, "M=D"];
  }

  private popSnippet() {
    return ["@SP", "AM=M-1", "D=M"];
  }

  private pushCommon(memorySegment: MemorySegmentCommon, index: number) {
    return [`@${index}`, "D=A", `@${memorySegmentMap[memorySegment]}`, "A=D+M", "D=M", ...this.pushSnippet()];
  }

  private pushConstant(index: number) {
    return [`@${index}`, "D=A", ...this.pushSnippet()];
  }

  private pushTemp(index: number) {
    return [`@${TEMP_SEGMENT_START + index}`, "D=M", ...this.pushSnippet()];
  }

  private pushStatic(index: number) {
    return [`@${this.filename}.${index}`, "D=M", ...this.pushSnippet()];
  }

  private pushPointer(index: number) {
    return [`@${index === 0 ? "THIS" : "THAT"}`, "D=M", ...this.pushSnippet()];
  }

  private pushSnippet() {
    return ["@SP", "A=M", "M=D", "@SP", "M=M+1"];
  }
}
