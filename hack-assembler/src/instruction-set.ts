export enum InstructionType {
  A_INSTRUCTION = "A_INSTRUCTION",
  C_INSTRUCTION = "C_INSTRUCTION",
  L_INSTRUCTION = "L_INSTRUCTION",
}

export enum CompRegisterIndicator {
  M = "1",
  A = "0",
}

export const INITIAL_VARIABLE_ADDRESS = 16;
export const INSTRUCTION_BIT_LENGTH = 16;
export const A_INSTRUCTION_OPCODE = "0";
export const C_INSTRUCTION_OPCODE = "111";

export const CInstructionMnemonic = {
  DEST: {
    default: "000",
    M: "001",
    D: "010",
    DM: "011",
    MD: "011",
    A: "100",
    AM: "101",
    MA: "101",
    AD: "110",
    DA: "110",
    ADM: "111",
    AMD: "111",
    DAM: "111",
    DMA: "111",
    MDA: "111",
    MAD: "111",
  },
  COMP: {
    "0": "101010",
    "1": "111111",
    "-1": "111010",
    D: "001100",
    A: "110000",
    M: "110000",
    "!D": "001101",
    "!A": "110001",
    "!M": "110001",
    "-D": "001111",
    "-A": "110011",
    "-M": "110011",
    "D+1": "011111",
    "A+1": "110111",
    "M+1": "110111",
    "D-1": "001110",
    "A-1": "110010",
    "M-1": "110010",
    "D+A": "000010",
    "D+M": "000010",
    "D-A": "010011",
    "D-M": "010011",
    "A-D": "000111",
    "M-D": "000111",
    "D&A": "000000",
    "D&M": "000000",
    "D|A": "010101",
    "D|M": "010101",
  },
  JUMP: {
    default: "000",
    JGT: "001",
    JEQ: "010",
    JGE: "011",
    JLT: "100",
    JNE: "101",
    JLE: "110",
    JMP: "111",
  },
} as const;

export const defaultSymbolMap: Record<string, string> = {
  SP: "0",
  LCL: "1",
  ARG: "2",
  THIS: "3",
  THAT: "4",
  SCREEN: "16384",
  KBD: "24576",
};

for (let i = 0; i < 16; i++) {
  defaultSymbolMap[`R${i}`] = i.toString();
}

const escapeRegExp = (pattern: string) => pattern.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

const createMnemonicPattern = (obj: Record<string, string>) => Object.keys(obj).map(escapeRegExp).join("|");

export const cInstructionRegExp = new RegExp(
  `^((?<dest>${createMnemonicPattern(CInstructionMnemonic.DEST)})=)?(?<comp>${createMnemonicPattern(CInstructionMnemonic.COMP)})(;(?<jump>${createMnemonicPattern(CInstructionMnemonic.JUMP)}))?$`,
);
