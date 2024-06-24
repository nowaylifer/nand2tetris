import { Transform } from "stream";
import { ArithmeticCommandEnum, COMMENT_SYMBOL, CommandType, MemorySegment, StackCommand } from "./command-set.js";
const regExpFromArray = (arr) => arr.join("|");
const indentificatorRegExp = "[a-zA-Z_.:][a-zA-Z0-9_.:]*";
const stackRegExp = `(?<stack>(?<stackCommand>${regExpFromArray(Object.values(StackCommand))}) (?<memorySegment>${regExpFromArray(Object.values(MemorySegment))}) (?<index>\\d+))`;
const arithmeticRegExp = `(?<arithmetic>${regExpFromArray(Object.values(ArithmeticCommandEnum))})`;
const labelRegExp = `(?<label>label (?<labelValue>${indentificatorRegExp}))`;
const gotoRegExp = `(?<goto>goto (?<gotoLabel>${indentificatorRegExp}))`;
const ifRegExp = `(?<if>if-goto (?<ifLabel>${indentificatorRegExp}))`;
const funcRegExp = `(?<function>function (?<funcName>${indentificatorRegExp}) (?<nVars>\\d+))`;
const callRegExp = `(?<call>call (?<callName>${indentificatorRegExp}) (?<nArgs>\\d+))`;
const returnRegExp = "(?<return>return)";
const commandRegExp = `^(?:${stackRegExp}|${arithmeticRegExp}|${labelRegExp}|${gotoRegExp}|${ifRegExp}|${funcRegExp}|${callRegExp}|${returnRegExp})$`;
export default class Parser extends Transform {
    constructor(options) {
        super({ ...options, objectMode: true });
    }
    _transform(data, _encoding, done) {
        const line = data
            .toString()
            .trim()
            .replace(new RegExp(`\\s*${COMMENT_SYMBOL}.*`), "");
        if (line) {
            this.push(this.parseCommand(line));
        }
        done();
    }
    parseCommand(src) {
        const groups = src.match(commandRegExp)?.groups;
        if (!groups) {
            throw new Error("Invalid command");
        }
        if (groups.stack) {
            return {
                value: groups.stack,
                type: groups.stackCommand === StackCommand.Pop ? CommandType.C_POP : CommandType.C_PUSH,
                stackCommand: groups.stackCommand,
                memorySegment: groups.memorySegment,
                index: Number(groups.index),
            };
        }
        if (groups.arithmetic) {
            return {
                value: groups.arithmetic,
                type: CommandType.C_ARITHMETIC,
            };
        }
        if (groups.label) {
            return {
                value: groups.label,
                type: CommandType.C_LABEL,
                labelValue: groups.labelValue,
            };
        }
        if (groups.goto) {
            return {
                value: groups.goto,
                type: CommandType.C_GOTO,
                targetLabel: groups.gotoLabel,
            };
        }
        if (groups.if) {
            return {
                value: groups.if,
                type: CommandType.C_IF,
                targetLabel: groups.ifLabel,
            };
        }
        if (groups.function) {
            return {
                value: groups.function,
                type: CommandType.C_FUNCTION,
                funcName: groups.funcName,
                nVars: groups.nVars,
            };
        }
        if (groups.call) {
            return {
                value: groups.call,
                type: CommandType.C_CALL,
                funcName: groups.callName,
                nArgs: groups.nArgs,
            };
        }
        if (groups.return) {
            return {
                value: groups.return,
                type: CommandType.C_RETURN,
            };
        }
        throw new Error("Invalid command");
    }
}
