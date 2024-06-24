export const COMMENT_SYMBOL = "//";
export const TEMP_SEGMENT_START = 5;
export const SYS_FILENAME = "Sys.vm";
export const MAIN_FILENAME = "Main.vm";
export var CommandType;
(function (CommandType) {
    CommandType["C_ARITHMETIC"] = "C_ARITHMETIC";
    CommandType["C_PUSH"] = "C_PUSH";
    CommandType["C_POP"] = "C_POP";
    CommandType["C_LABEL"] = "C_LABEL";
    CommandType["C_GOTO"] = "C_GOTO";
    CommandType["C_IF"] = "C_IF";
    CommandType["C_FUNCTION"] = "C_FUNCTION";
    CommandType["C_RETURN"] = "C_RETURN";
    CommandType["C_CALL"] = "C_CALL";
})(CommandType || (CommandType = {}));
export var ArithmeticCommandEnum;
(function (ArithmeticCommandEnum) {
    ArithmeticCommandEnum["Add"] = "add";
    ArithmeticCommandEnum["Sub"] = "sub";
    ArithmeticCommandEnum["Neg"] = "neg";
    ArithmeticCommandEnum["Eq"] = "eq";
    ArithmeticCommandEnum["Gt"] = "gt";
    ArithmeticCommandEnum["Lt"] = "lt";
    ArithmeticCommandEnum["And"] = "and";
    ArithmeticCommandEnum["Or"] = "or";
    ArithmeticCommandEnum["Not"] = "not";
})(ArithmeticCommandEnum || (ArithmeticCommandEnum = {}));
export var StackCommand;
(function (StackCommand) {
    StackCommand["Push"] = "push";
    StackCommand["Pop"] = "pop";
})(StackCommand || (StackCommand = {}));
export var MemorySegment;
(function (MemorySegment) {
    MemorySegment["Argument"] = "argument";
    MemorySegment["Local"] = "local";
    MemorySegment["Static"] = "static";
    MemorySegment["Constant"] = "constant";
    MemorySegment["This"] = "this";
    MemorySegment["That"] = "that";
    MemorySegment["Pointer"] = "pointer";
    MemorySegment["Temp"] = "temp";
})(MemorySegment || (MemorySegment = {}));
export var ASSEMBLY_BUILT_IN_SYMBOLS;
(function (ASSEMBLY_BUILT_IN_SYMBOLS) {
    ASSEMBLY_BUILT_IN_SYMBOLS["SP"] = "SP";
    ASSEMBLY_BUILT_IN_SYMBOLS["ARG"] = "ARG";
    ASSEMBLY_BUILT_IN_SYMBOLS["LCL"] = "LCL";
    ASSEMBLY_BUILT_IN_SYMBOLS["THIS"] = "THIS";
    ASSEMBLY_BUILT_IN_SYMBOLS["THAT"] = "THAT";
})(ASSEMBLY_BUILT_IN_SYMBOLS || (ASSEMBLY_BUILT_IN_SYMBOLS = {}));
export const functionFrameRegisters = [
    ASSEMBLY_BUILT_IN_SYMBOLS.LCL,
    ASSEMBLY_BUILT_IN_SYMBOLS.ARG,
    ASSEMBLY_BUILT_IN_SYMBOLS.THIS,
    ASSEMBLY_BUILT_IN_SYMBOLS.THAT,
];
export const arithmeticMap = {
    [ArithmeticCommandEnum.Eq]: "JEQ",
    [ArithmeticCommandEnum.Gt]: "JGT",
    [ArithmeticCommandEnum.Lt]: "JLT",
};
export const memorySegmentMap = {
    [MemorySegment.Argument]: ASSEMBLY_BUILT_IN_SYMBOLS.ARG,
    [MemorySegment.Local]: ASSEMBLY_BUILT_IN_SYMBOLS.LCL,
    [MemorySegment.This]: ASSEMBLY_BUILT_IN_SYMBOLS.THIS,
    [MemorySegment.That]: ASSEMBLY_BUILT_IN_SYMBOLS.THAT,
};
