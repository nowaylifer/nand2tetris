import { createReadStream } from "fs";
import { createInterface } from "readline";
import { Instruction, CInstruction } from "./types";
import { CInstructionMnemonic, InstructionType } from "./instruction-set";

const escapeRegExp = (pattern: string) =>
  pattern.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

const getSymbolPattern = (obj: Record<string, string>) =>
  Object.keys(obj).map(escapeRegExp).join("|");

const cInstructionRegExp = new RegExp(
  `^((?<dest>${getSymbolPattern(CInstructionMnemonic.DEST)})=)?(?<comp>${getSymbolPattern(CInstructionMnemonic.COMP)})(;(?<jump>${getSymbolPattern(CInstructionMnemonic.JUMP)}))?$`,
);

export default class Parser {
  private currentInstruction: Instruction | null = null;
  private lineCount = 0;
  private _hasMoreLines = true;
  private nextLine: () => Promise<string | void>;

  constructor(src: string) {
    async function* buildLineGenerator() {
      const lineReader = createInterface({
        input: createReadStream(src),
        crlfDelay: Infinity,
      });

      for await (const line of lineReader) {
        yield line;
      }
    }

    const generator = buildLineGenerator();
    let prev: string | void;

    this.nextLine = async () => {
      if (!prev) {
        prev = (await generator.next()).value;
      }
      const next = await generator.next();
      this._hasMoreLines = !next.done as boolean;
      const line = prev;
      prev = next.value;
      return line;
    };
  }

  async advance() {
    let line;
    // skip comments and empty lines
    do {
      line = await this.nextLine();
      line = line?.trim();
    } while ((line === "" || line?.startsWith("//")) && this.hasMoreLines);

    if (typeof line !== "string") return;

    if (this.currentInstruction) {
      this.lineCount++;
    }

    // remove inline comment
    line = line.replace(/\/\/.*/g, "");

    this.currentInstruction = this.parseInstruction(line);
    return this.currentInstruction;
  }

  get hasMoreLines() {
    return this._hasMoreLines;
  }

  private parseInstruction(instruction: string): Instruction {
    if (instruction.startsWith("@")) {
      return {
        value: instruction,
        type: InstructionType.A_INSTRUCTION,
        symbol: instruction.slice(1),
      };
    }

    if (instruction.startsWith("(") && instruction.endsWith(")")) {
      return {
        value: instruction,
        type: InstructionType.L_INSTRUCTION,
        symbol: instruction.slice(1, -1),
      };
    }

    const groups = instruction.match(cInstructionRegExp)?.groups;
    if (groups) {
      return {
        value: instruction,
        type: InstructionType.C_INSTRUCTION,
        ...groups,
      } as CInstruction;
    }

    throw new Error(`Invalid instruction: "${instruction}"`);
  }
}
