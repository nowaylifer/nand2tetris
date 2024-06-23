import { type } from "os";
import { CommandType, type ArithmeticCommandEnum, type MemorySegment, type StackCommand } from "./command-set.js";

export type MemoryCommandTokens = {
  stackCommand: StackCommand;
  memorySegment: MemorySegment;
  index: number;
};

export type PopCommand = {
  value: string;
  type: CommandType.C_POP;
} & MemoryCommandTokens;

export type PushCommand = {
  value: string;
  type: CommandType.C_PUSH;
} & MemoryCommandTokens;

export type ArithmeticCommand = {
  value: ArithmeticCommandEnum;
  type: CommandType.C_ARITHMETIC;
};

export type LabelCommand = {
  value: string;
  type: CommandType.C_LABEL;
  labelValue: string;
};

export type GotoCommand = {
  value: string;
  type: CommandType.C_GOTO;
  targetLabel: string;
};

export type IfCommand = {
  value: string;
  type: CommandType.C_IF;
  targetLabel: string;
};

export type FunctionCommand = {
  value: string;
  type: CommandType.C_FUNCTION;
  funcName: string;
  nVars: number;
};

export type CallCommand = {
  value: string;
  type: CommandType.C_CALL;
  funcName: string;
  nArgs: number;
};

export type ReturnCommand = {
  value: "return";
  type: CommandType.C_RETURN;
};

export type Command =
  | PopCommand
  | PushCommand
  | ArithmeticCommand
  | LabelCommand
  | GotoCommand
  | IfCommand
  | FunctionCommand
  | CallCommand
  | ReturnCommand;

export type MemorySegmentCommon =
  | MemorySegment.Local
  | MemorySegment.Argument
  | MemorySegment.This
  | MemorySegment.That;
