import { Transform } from "stream";
import { InstructionType, CInstructionMnemonic, CompRegisterIndicator, C_INSTRUCTION_OPCODE, INSTRUCTION_BIT_LENGTH, INITIAL_VARIABLE_ADDRESS, A_INSTRUCTION_OPCODE, } from "./instruction-set.js";
class DecimalToBinaryConvertError extends Error {
    constructor(value) {
        const message = `Cannot convert ${value} to binary number`;
        super(message);
    }
}
export default class Translator extends Transform {
    variableAddress = INITIAL_VARIABLE_ADDRESS;
    symbolMap;
    constructor(symbolMap, options) {
        super({ ...options, objectMode: true });
        this.symbolMap = symbolMap;
    }
    _transform(instruction, _encoding, done) {
        const code = this.translate(instruction);
        if (code != null)
            this.push(code);
        done();
    }
    translate(instruction) {
        switch (instruction.type) {
            case InstructionType.A_INSTRUCTION:
                return this.translateAInstruction(instruction);
            case InstructionType.C_INSTRUCTION:
                return this.translateCInstruction(instruction);
            case InstructionType.L_INSTRUCTION:
                return null;
        }
    }
    translateAInstruction({ symbol }) {
        if (this.symbolMap.has(symbol)) {
            return A_INSTRUCTION_OPCODE + this.decimalToBinary(this.symbolMap.get(symbol));
        }
        try {
            return A_INSTRUCTION_OPCODE + this.decimalToBinary(symbol);
        }
        catch (error) {
            if (error instanceof DecimalToBinaryConvertError) {
                this.symbolMap.set(symbol, this.variableAddress.toString());
                this.variableAddress++;
                return A_INSTRUCTION_OPCODE + this.decimalToBinary(this.symbolMap.get(symbol));
            }
            throw error;
        }
    }
    translateCInstruction({ comp, dest, jump }) {
        return (C_INSTRUCTION_OPCODE +
            (comp.includes("M") ? CompRegisterIndicator.M : CompRegisterIndicator.A) +
            this.comp(comp) +
            this.dest(dest) +
            this.jump(jump));
    }
    decimalToBinary(value) {
        const num = Number(value);
        if (Number.isFinite(num) && Number.isInteger(num)) {
            return num.toString(2).padStart(INSTRUCTION_BIT_LENGTH - 1, "0");
        }
        throw new DecimalToBinaryConvertError(value);
    }
    dest(mnemonic) {
        if (mnemonic === undefined) {
            return CInstructionMnemonic.DEST.default;
        }
        return CInstructionMnemonic.DEST[mnemonic];
    }
    comp(mnemonic) {
        return CInstructionMnemonic.COMP[mnemonic];
    }
    jump(mnemonic) {
        if (mnemonic === undefined) {
            return CInstructionMnemonic.JUMP.default;
        }
        return CInstructionMnemonic.JUMP[mnemonic];
    }
}
