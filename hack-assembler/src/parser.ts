import { Transform, type TransformCallback, type TransformOptions } from "stream";
import { InstructionType, cInstructionRegExp } from "./instruction-set.js";
import type { Instruction, CInstruction } from "./types.js";

export default class Parser extends Transform {
  private insctructionNum = -1;

  constructor(options?: TransformOptions) {
    super({ ...options, objectMode: true });
  }

  override _transform(data: Buffer | string, _encoding: BufferEncoding, done: TransformCallback) {
    const line = data.toString().trim();

    // skip comments and empty lines
    if (line && !line.startsWith("//")) {
      let instruction = this.parseInstruction(line) as Instruction;

      if (instruction.type === InstructionType.L_INSTRUCTION) {
        instruction.number = this.insctructionNum + 1;
      } else {
        instruction.number = ++this.insctructionNum;
      }

      this.push(instruction);
    }
    done();
  }

  private parseInstruction(source: string) {
    if (source.startsWith("@")) {
      return {
        value: source,
        type: InstructionType.A_INSTRUCTION,
        symbol: source.slice(1),
      };
    }

    if (source.startsWith("(") && source.endsWith(")")) {
      return {
        value: source,
        type: InstructionType.L_INSTRUCTION,
        symbol: source.slice(1, -1),
      };
    }

    const groups = source.match(cInstructionRegExp)?.groups as Pick<CInstruction, "dest" | "comp" | "jump"> | null;
    if (groups) {
      return {
        value: source,
        type: InstructionType.C_INSTRUCTION,
        ...groups,
      };
    }

    throw new Error(`Invalid instruction: "${source}"`);
  }
}
