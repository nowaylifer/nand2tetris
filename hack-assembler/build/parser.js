import { Transform } from "stream";
import { InstructionType, cInstructionRegExp } from "./instruction-set.js";
export default class Parser extends Transform {
    insctructionNum = -1;
    constructor(options) {
        super({ ...options, objectMode: true });
    }
    _transform(data, _encoding, done) {
        const line = data.toString().trim();
        // skip comments and empty lines
        if (line && !line.startsWith("//")) {
            let instruction = this.parseInstruction(line);
            if (instruction.type === InstructionType.L_INSTRUCTION) {
                instruction.number = this.insctructionNum + 1;
            }
            else {
                instruction.number = ++this.insctructionNum;
            }
            this.push(instruction);
        }
        done();
    }
    parseInstruction(source) {
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
        const groups = source.match(cInstructionRegExp)?.groups;
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
