import { Transform, type TransformCallback, type TransformOptions } from "stream";
import type { Command, MemoryCommandTokens } from "./types.js";
import { ArithmeticCommandEnum, COMMENT_SYMBOL, CommandType, MemorySegment, StackCommand } from "./command-set.js";

const regExpFromArray = (arr: Array<string | number>) => arr.join("|");
const arithmeticRegExp = regExpFromArray(Object.values(ArithmeticCommandEnum));
const stackCommandRegExp = regExpFromArray(Object.values(StackCommand));
const memorySegmentRegExp = regExpFromArray(Object.values(MemorySegment));

export const commandRegExp = new RegExp(
  `^(?<arithmetic>${arithmeticRegExp})$|^((?<stackCommand>${stackCommandRegExp}) (?<memorySegment>${memorySegmentRegExp}) (?<index>\\d+))$`,
);
export default class Parser extends Transform {
  constructor(options?: TransformOptions) {
    super({ ...options, objectMode: true });
  }

  override _transform(data: Buffer | string, _encoding: BufferEncoding, done: TransformCallback) {
    const line = data
      .toString()
      .trim()
      .replace(new RegExp(`${COMMENT_SYMBOL}.*`), "");

    if (line) {
      this.push(this.parseCommand(line));
    }
    done();
  }

  private parseCommand(src: string): Command {
    const groups = src.match(commandRegExp)?.groups as
      | { arithmetic: ArithmeticCommandEnum }
      | ({ arithmetic: undefined } & MemoryCommandTokens)
      | undefined;

    if (!groups) {
      throw new Error("Invalid command");
    }

    if (groups.arithmetic != undefined) {
      return {
        value: groups.arithmetic,
        type: CommandType.C_ARITHMETIC,
      };
    }

    return {
      value: src,
      type: groups.stackCommand === StackCommand.Pop ? CommandType.C_POP : CommandType.C_PUSH,
      stackCommand: groups.stackCommand,
      memorySegment: groups.memorySegment,
      index: Number(groups.index),
    };
  }
}
