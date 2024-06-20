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

export type Command = PopCommand | PushCommand | ArithmeticCommand;

export type MemorySegmentCommon =
  | MemorySegment.Local
  | MemorySegment.Argument
  | MemorySegment.This
  | MemorySegment.That;
