import { InstructionType } from "./instruction-set";

export type SymbolicInstruction = {
  value: string;
  type: InstructionType.A_INSTRUCTION | InstructionType.L_INSTRUCTION;
  symbol: string;
};

export type CInstructionElements = {
  comp: string;
  dest?: string;
  jump?: string;
};

export type CInstruction = {
  value: string;
  type: InstructionType.C_INSTRUCTION;
} & CInstructionElements;

export type Instruction = SymbolicInstruction | CInstruction;
