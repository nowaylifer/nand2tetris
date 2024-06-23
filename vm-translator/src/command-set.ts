export const COMMENT_SYMBOL = "//";
export const TEMP_SEGMENT_START = 5;

export enum CommandType {
  C_ARITHMETIC = "C_ARITHMETIC",
  C_PUSH = "C_PUSH",
  C_POP = "C_POP",
  C_LABEL = "C_LABEL",
  C_GOTO = "C_GOTO",
  C_IF = "C_IF",
  C_FUNCTION = "C_FUNCTION",
  C_RETURN = "C_RETURN",
  C_CALL = "C_CALL",
}

export enum ArithmeticCommandEnum {
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

export enum StackCommand {
  Push = "push",
  Pop = "pop",
}

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

export enum ASSEMBLY_BUILT_IN_SYMBOLS {
  SP = "SP",
  ARG = "ARG",
  LCL = "LCL",
  THIS = "THIS",
  THAT = "THAT",
}

export const functionFrameRegisters = [
  ASSEMBLY_BUILT_IN_SYMBOLS.LCL,
  ASSEMBLY_BUILT_IN_SYMBOLS.ARG,
  ASSEMBLY_BUILT_IN_SYMBOLS.THIS,
  ASSEMBLY_BUILT_IN_SYMBOLS.THAT,
];

export const arithmeticMap = {
  [ArithmeticCommandEnum.Eq]: "JEQ",
  [ArithmeticCommandEnum.Gt]: "JGT",
  [ArithmeticCommandEnum.Lt]: "JLT",
};

export const memorySegmentMap = {
  [MemorySegment.Argument]: ASSEMBLY_BUILT_IN_SYMBOLS.ARG,
  [MemorySegment.Local]: ASSEMBLY_BUILT_IN_SYMBOLS.LCL,
  [MemorySegment.This]: ASSEMBLY_BUILT_IN_SYMBOLS.THIS,
  [MemorySegment.That]: ASSEMBLY_BUILT_IN_SYMBOLS.THAT,
};
