import {
  InstructionType,
  CInstructionMnemonic,
  A_INSTRUCTION_OPCODE,
  C_INSTRUCTION_OPCODE,
  INSTRUCTION_BIT_LENGTH,
} from "./instruction-set";
import { CInstructionElements, Instruction } from "./types";

export default class Translator {
  translate(instruction: Instruction) {
    switch (instruction.type) {
      case InstructionType.A_INSTRUCTION:
        return this.a_instruction(instruction.symbol);
      case InstructionType.C_INSTRUCTION:
        return this.c_instruction(instruction);
      case InstructionType.L_INSTRUCTION:
        return "";
      default:
        throw new Error("Unknown isntruction type");
    }
  }

  private a_instruction(symbol: string) {
    return (
      A_INSTRUCTION_OPCODE +
      Number(symbol)
        .toString(2)
        .padStart(INSTRUCTION_BIT_LENGTH - 1, "0")
    );
  }

  private c_instruction({ dest = "", comp, jump = "" }: CInstructionElements) {
    return (
      C_INSTRUCTION_OPCODE +
      (comp.includes("M") ? "1" : "0") +
      this.comp(comp) +
      this.dest(dest) +
      this.jump(jump)
    );
  }

  private dest(mnemonic: string) {
    if (mnemonic in CInstructionMnemonic.DEST) {
      return CInstructionMnemonic.DEST[
        mnemonic as keyof typeof CInstructionMnemonic.DEST
      ];
    }

    throw new Error("Unknown dest mnemonic");
  }

  private comp(mnemonic: string) {
    if (mnemonic in CInstructionMnemonic.COMP) {
      return CInstructionMnemonic.COMP[
        mnemonic as keyof typeof CInstructionMnemonic.COMP
      ];
    }

    throw new Error("Unknown comp mnemonic");
  }

  private jump(mnemonic: string) {
    if (mnemonic in CInstructionMnemonic.JUMP) {
      return CInstructionMnemonic.JUMP[
        mnemonic as keyof typeof CInstructionMnemonic.JUMP
      ];
    }

    throw new Error("Unknown jump mnemonic");
  }
}
