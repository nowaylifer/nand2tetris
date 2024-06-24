import { Transform } from "stream";
import { TEMP_SEGMENT_START, memorySegmentMap, MemorySegment, CommandType, ArithmeticCommandEnum, arithmeticMap, functionFrameRegisters, } from "./command-set.js";
export default class Translator extends Transform {
    isFirstChunk = true;
    filename;
    callCount = -1;
    compareCount = -1;
    currentFunc;
    constructor(filename, options) {
        super({ ...options, objectMode: true });
        this.filename = filename;
    }
    _transform(command, _encoding, done) {
        if (command.type === CommandType.C_FUNCTION) {
            this.currentFunc = command.funcName;
        }
        const code = `// ${command.value}\n` + this.translate(command).join("\n") + "\n";
        if (this.isFirstChunk) {
            this.isFirstChunk = false;
            this.push(`// File: ${this.filename}.vm\n` + code);
        }
        else {
            this.push(code);
        }
        done();
    }
    translate(command) {
        switch (command.type) {
            case CommandType.C_ARITHMETIC:
                return this.translateArithmeticCommand(command);
            case CommandType.C_PUSH:
                return this.translatePushCommand(command);
            case CommandType.C_POP:
                return this.translatePopCommand(command);
            case CommandType.C_LABEL:
                return this.translateLabelCommand(command);
            case CommandType.C_GOTO:
                return this.translateGotoCommand(command);
            case CommandType.C_IF:
                return this.translateIfCommand(command);
            case CommandType.C_FUNCTION:
                return this.translateFunctionCommand(command);
            case CommandType.C_CALL:
                return this.translateCallCommand(command);
            case CommandType.C_RETURN:
                return this.translateReturnCommand();
        }
    }
    /**
     * Return
     */
    translateReturnCommand() {
        return [
            // frame = LCL --> R13
            "@LCL",
            "D=M",
            "@R13",
            "M=D",
            // retAddr = *(frame - 5) --> R14
            "@5",
            "D=A",
            "@R13",
            "A=M-D",
            "D=M",
            "@R14",
            "M=D",
            // *ARG = pop()
            ...this.popSnippet(),
            "@ARG",
            "A=M",
            "M=D",
            // SP = ARG + 1
            "D=A",
            "@SP",
            "M=D+1",
            ...this.restoreFunctionFrame(),
            // goto retAddr
            "@R14",
            "A=M",
            "0;JMP",
        ];
    }
    restoreFunctionFrame() {
        const commands = [];
        const len = functionFrameRegisters.length;
        for (let i = 1; i <= len; i++) {
            commands.push("@R13", "A=M", ...new Array(i).fill("A=A-1"), "D=M", `@${functionFrameRegisters[len - i]}`, "M=D");
        }
        return commands;
    }
    /**
     * Call
     */
    translateCallCommand(command) {
        this.callCount++;
        const returnAddress = this.createReturnLabelName(this.currentFunc);
        return [
            `@${returnAddress}`,
            "D=A",
            ...this.pushSnippet(),
            ...this.createFunctionFrame(),
            ...this.repositionARG(command.nArgs),
            ...this.repositionLCL(),
            `@${command.funcName}`,
            "0;JMP",
            `(${returnAddress})`,
        ];
    }
    createFunctionFrame() {
        const frame = [];
        for (const register of functionFrameRegisters) {
            frame.push(`@${register}`, "D=M", ...this.pushSnippet());
        }
        return frame;
    }
    repositionARG(nArgs) {
        return ["@5", "D=A", `@${nArgs}`, "D=D+A", "@SP", "D=M-D", "@ARG", "M=D"];
    }
    repositionLCL() {
        return ["@SP", "D=M", "@LCL", "M=D"];
    }
    createReturnLabelName(funcName) {
        return `${this.filename}.${funcName}$ret.${this.callCount}`;
    }
    /**
     * Function
     */
    translateFunctionCommand(command) {
        return [`(${command.funcName})`, ...this.initFunctionLocalVars(command.nVars)];
    }
    initFunctionLocalVars(nVars) {
        let varInitCommands = [];
        for (let i = 0; i < nVars; i++) {
            varInitCommands.push("M=0", "A=A+1");
        }
        return ["@SP", "A=M", ...varInitCommands, "D=A", "@SP", "M=D"];
    }
    /**
     * Branching
     */
    translateLabelCommand(command) {
        return [`(${this.createLabelName(command.labelValue)})`];
    }
    translateGotoCommand(command) {
        return [`@${this.createLabelName(command.targetLabel)}`, "0;JMP"];
    }
    translateIfCommand(command) {
        return [...this.popSnippet(), `@${this.createLabelName(command.targetLabel)}`, "D;JNE"];
    }
    createLabelName(labelValue) {
        return `${this.currentFunc}$${labelValue}`;
    }
    /**
     * Arithmetic
     */
    translateArithmeticCommand(command) {
        switch (command.value) {
            case ArithmeticCommandEnum.Eq:
            case ArithmeticCommandEnum.Gt:
            case ArithmeticCommandEnum.Lt:
                return this.compare(command.value);
            case ArithmeticCommandEnum.Add:
                return this.add();
            case ArithmeticCommandEnum.Sub:
                return this.sub();
            case ArithmeticCommandEnum.Neg:
                return this.neg();
            case ArithmeticCommandEnum.Not:
                return this.not();
            case ArithmeticCommandEnum.And:
                return this.and();
            case ArithmeticCommandEnum.Or:
                return this.or();
            default:
                throw new Error(`Invalid arithmetic command: "${command.value}"`);
        }
    }
    add() {
        return [...this.popSnippet(), ...this.popSnippet().slice(0, -1), "D=D+M", ...this.pushSnippet()];
    }
    sub() {
        return [...this.popSnippet(), ...this.popSnippet().slice(0, -1), "D=M-D", ...this.pushSnippet()];
    }
    neg() {
        return [...this.popSnippet().slice(0, -1), "D=-M", ...this.pushSnippet()];
    }
    not() {
        return [...this.popSnippet().slice(0, -1), "D=!M", ...this.pushSnippet()];
    }
    and() {
        return [...this.popSnippet(), ...this.popSnippet().slice(0, -1), "D=D&M", ...this.pushSnippet()];
    }
    or() {
        return [...this.popSnippet(), ...this.popSnippet().slice(0, -1), "D=D|M", ...this.pushSnippet()];
    }
    compare(operation) {
        this.compareCount++;
        const ifTrue = `${this.filename}.if_${operation}$${this.compareCount}`;
        const afterIf = `${this.filename}.after_${operation}$${this.compareCount}`;
        return [
            ...this.popSnippet(),
            ...this.popSnippet().slice(0, -1),
            "D=M-D",
            `@${ifTrue}`,
            `D;${arithmeticMap[operation]}`,
            "D=0",
            `@${afterIf}`,
            "0;JMP",
            `(${ifTrue})`,
            "D=-1",
            `(${afterIf})`,
            ...this.pushSnippet(),
        ];
    }
    /**
     * Pop
     */
    translatePopCommand(command) {
        switch (command.memorySegment) {
            case MemorySegment.Local:
            case MemorySegment.Argument:
            case MemorySegment.This:
            case MemorySegment.That:
                return this.popCommon(command.memorySegment, command.index);
            case MemorySegment.Temp:
                return this.popTemp(command.index);
            case MemorySegment.Static:
                return this.popStatic(command.index);
            case MemorySegment.Pointer:
                return this.popPointer(command.index);
            default:
                throw new Error(`Cannot pop to segment "${command.memorySegment}" index ${command.index}`);
        }
    }
    popCommon(memorySegment, index) {
        return [
            `@${index}`,
            "D=A",
            `@${memorySegmentMap[memorySegment]}`,
            "D=D+M",
            "@R13",
            "M=D",
            ...this.popSnippet(),
            "@R13",
            "A=M",
            "M=D",
        ];
    }
    popStatic(index) {
        return [...this.popSnippet(), `@${this.filename}.${index}`, "M=D"];
    }
    popPointer(index) {
        return [...this.popSnippet(), `@${index === 0 ? "THIS" : "THAT"}`, "M=D"];
    }
    popTemp(index) {
        return [...this.popSnippet(), `@${TEMP_SEGMENT_START + index}`, "M=D"];
    }
    popSnippet() {
        return ["@SP", "AM=M-1", "D=M"];
    }
    /**
     * Push
     */
    translatePushCommand(command) {
        switch (command.memorySegment) {
            case MemorySegment.Local:
            case MemorySegment.Argument:
            case MemorySegment.This:
            case MemorySegment.That:
                return this.pushCommon(command.memorySegment, command.index);
            case MemorySegment.Constant:
                return this.pushConstant(command.index);
            case MemorySegment.Temp:
                return this.pushTemp(command.index);
            case MemorySegment.Static:
                return this.pushStatic(command.index);
            case MemorySegment.Pointer:
                return this.pushPointer(command.index);
            default:
                throw new Error(`Cannot push segment "${command.memorySegment}" index ${command.index}`);
        }
    }
    pushCommon(memorySegment, index) {
        return [`@${index}`, "D=A", `@${memorySegmentMap[memorySegment]}`, "A=D+M", "D=M", ...this.pushSnippet()];
    }
    pushConstant(index) {
        return [`@${index}`, "D=A", ...this.pushSnippet()];
    }
    pushTemp(index) {
        return [`@${TEMP_SEGMENT_START + index}`, "D=M", ...this.pushSnippet()];
    }
    pushStatic(index) {
        return [`@${this.filename}.${index}`, "D=M", ...this.pushSnippet()];
    }
    pushPointer(index) {
        return [`@${index === 0 ? "THIS" : "THAT"}`, "D=M", ...this.pushSnippet()];
    }
    pushSnippet() {
        return ["@SP", "A=M", "M=D", "@SP", "M=M+1"];
    }
}
