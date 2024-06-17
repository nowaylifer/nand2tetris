import { InstructionType, CInstructionMnemonic } from "./instruction-set.js";

export type AInstruction = {
  value: string;
  type: InstructionType.A_INSTRUCTION;
  number: number;
  symbol: string;
};

export type LInstruction = {
  value: string;
  type: InstructionType.L_INSTRUCTION;
  number: number;
  symbol: string;
};

export type CInstruction = {
  value: string;
  type: InstructionType.C_INSTRUCTION;
  number: number;
  comp: keyof typeof CInstructionMnemonic.COMP;
  dest?: keyof typeof CInstructionMnemonic.DEST;
  jump?: keyof typeof CInstructionMnemonic.JUMP;
};

export type Instruction = AInstruction | LInstruction | CInstruction;

export type SymbolMap = Map<string, string>;
