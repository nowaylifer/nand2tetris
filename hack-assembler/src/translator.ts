import { Transform, type TransformCallback, type TransformOptions } from "stream";
import type { AInstruction, CInstruction, Instruction, SymbolMap } from "./types.js";
import {
  InstructionType,
  CInstructionMnemonic,
  CompRegisterIndicator,
  C_INSTRUCTION_OPCODE,
  INSTRUCTION_BIT_LENGTH,
  INITIAL_VARIABLE_ADDRESS,
  A_INSTRUCTION_OPCODE,
} from "./instruction-set.js";

class DecimalToBinaryConvertError extends Error {
  constructor(value: unknown, options?: ErrorOptions | undefined) {
    const message = `Cannot convert ${value} to binary number`;
    super(message, options);
  }
}

export default class Translator extends Transform {
  private variableAddress = INITIAL_VARIABLE_ADDRESS;
  private symbolMap: SymbolMap;

  constructor(symbolMap: SymbolMap, options?: TransformOptions) {
    super({ ...options, objectMode: true });
    this.symbolMap = symbolMap;
  }

  override _transform(instruction: Instruction, _encoding: BufferEncoding, done: TransformCallback) {
    const code = this.translate(instruction);
    if (code != null) this.push(code);
    done();
  }

  private translate(instruction: Instruction) {
    switch (instruction.type) {
      case InstructionType.A_INSTRUCTION:
        return this.translateAInstruction(instruction);
      case InstructionType.C_INSTRUCTION:
        return this.translateCInstruction(instruction);
      case InstructionType.L_INSTRUCTION:
        return null;
    }
  }

  private translateAInstruction({ symbol }: AInstruction) {
    if (this.symbolMap.has(symbol)) {
      return A_INSTRUCTION_OPCODE + this.decimalToBinary(this.symbolMap.get(symbol)!);
    }

    try {
      return A_INSTRUCTION_OPCODE + this.decimalToBinary(symbol);
    } catch (error) {
      if (error instanceof DecimalToBinaryConvertError) {
        this.symbolMap.set(symbol, this.variableAddress.toString());
        this.variableAddress++;
        return A_INSTRUCTION_OPCODE + this.decimalToBinary(this.symbolMap.get(symbol)!);
      }
      throw error;
    }
  }

  private translateCInstruction({ comp, dest, jump }: CInstruction) {
    return (
      C_INSTRUCTION_OPCODE +
      (comp.includes("M") ? CompRegisterIndicator.M : CompRegisterIndicator.A) +
      this.comp(comp) +
      this.dest(dest) +
      this.jump(jump)
    );
  }

  private decimalToBinary(value: string) {
    const num = Number(value);

    if (Number.isFinite(num) && Number.isInteger(num)) {
      return num.toString(2).padStart(INSTRUCTION_BIT_LENGTH - 1, "0");
    }

    throw new DecimalToBinaryConvertError(value);
  }

  private dest(mnemonic: keyof typeof CInstructionMnemonic.DEST | undefined) {
    if (mnemonic === undefined) {
      return CInstructionMnemonic.DEST.default;
    }

    return CInstructionMnemonic.DEST[mnemonic];
  }

  private comp(mnemonic: keyof typeof CInstructionMnemonic.COMP) {
    return CInstructionMnemonic.COMP[mnemonic];
  }

  private jump(mnemonic: keyof typeof CInstructionMnemonic.JUMP | undefined) {
    if (mnemonic === undefined) {
      return CInstructionMnemonic.JUMP.default;
    }

    return CInstructionMnemonic.JUMP[mnemonic];
  }
}
