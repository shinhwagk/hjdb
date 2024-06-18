export enum HJDBErrorMsg {
    HJDB001 = "table not exist.",
    HJDB002 = "database not exists.",
    HJDB003 = "invalid database name.",
    HJDB004 = "invalid table name.",
}

export enum HJDBErrorCode {
    HJDB001 = "HJDB-001",
    HJDB002 = "HJDB-002",
    HJDB003 = "HJDB-003",
    HJDB004 = "HJDB-004",
}

const ErrorCodeToMessageMap: { [key in HJDBErrorCode]: HJDBErrorMsg } = {
    [HJDBErrorCode.HJDB001]: HJDBErrorMsg.HJDB001,
    [HJDBErrorCode.HJDB002]: HJDBErrorMsg.HJDB002,
    [HJDBErrorCode.HJDB003]: HJDBErrorMsg.HJDB003,
    [HJDBErrorCode.HJDB004]: HJDBErrorMsg.HJDB004,
};

export class HJDBError extends Error {
    errorCode: HJDBErrorCode;

    constructor(errorCode: HJDBErrorCode, message?: string) {
        super(message);
        this.name = "HJDBError";
        this.errorCode = errorCode;
        this.message = message || ErrorCodeToMessageMap[errorCode];
    }

    static new(errorCode: HJDBErrorCode, message?: string) {
        return new HJDBError(errorCode, message)
    }
}
