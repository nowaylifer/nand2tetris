import { createReadStream } from "fs";
import { createInterface } from "readline";
import { COMP, JUMP, DEST } from "./instruction-set";

enum InstructionType {
  A_INSTRUCTION,
  C_INSTRUCTION,
  L_INSTRUCTION,
}

const escapeRegExp = (pattern: string) =>
  pattern.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

const getSymbolPattern = (obj: Record<string, string>) =>
  Object.keys(obj).map(escapeRegExp).join("|");

const cInstructionRegExp = new RegExp(
  `^((?<dest>${getSymbolPattern(DEST)})=)?(?<comp>${getSymbolPattern(COMP)})(;(?<jump>${getSymbolPattern(JUMP)}))?$`,
);

type SymbolicInstruction = {
  value: string;
  type: InstructionType.A_INSTRUCTION | InstructionType.L_INSTRUCTION;
  symbol: string;
};

type CInstruction = {
  value: string;
  type: InstructionType.C_INSTRUCTION;
  comp: string;
  dest?: string;
  jump?: string;
};

type Instruction = SymbolicInstruction | CInstruction;

export default class Parser {
  private currentInstruction: Instruction | null = null;
  private lineCount = 0;
  private _hasMoreLines = true;
  private nextLine: () => Promise<string | void>;

  constructor(src: string) {
    const rs = createReadStream(src);
    const reader = createInterface({
      input: rs,
      crlfDelay: Infinity,
    });

    async function* buildGenerator() {
      for await (const line of reader) {
        yield line;
      }
    }

    const generator = buildGenerator();
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

  get instructionType() {
    return this.currentInstruction?.type;
  }

  private parseInstruction(instruction: string): Instruction {
    if (instruction.startsWith("@")) {
      return {
        value: instruction,
        type: InstructionType.A_INSTRUCTION,
        symbol: instruction.slice(1),
      };
    }

    if (instruction.at(0) === "(" && instruction.at(-1) === ")") {
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
  }

  get hasMoreLines() {
    return this._hasMoreLines;
  }
}

const parser = new Parser("file.txt");
console.log(cInstructionRegExp);

await parser.advance();
await parser.advance();
