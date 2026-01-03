export enum LogLevel {
    DEBUG = 'debug',
    INFO = 'info',
    WARN = 'warn',
    ERROR = 'error',
    MUTE = 'mute',
}

export type LogPayload = {
    level: LogLevel;
    message: string;
    data?: LogData;
};

export type LogData = Record<string, any>;

export const LOG_LEVELS: LogLevel[] = [
    LogLevel.DEBUG,
    LogLevel.INFO,
    LogLevel.WARN,
    LogLevel.ERROR,
    LogLevel.MUTE,
];

export interface LoggerLike {
    info(message: string, data?: LogData): void;
    warn(message: string, data?: LogData): void;
    error(message: string, data?: LogData): void;
    debug(message: string, data?: LogData): void;
}

export interface LogFormatter {
    format(payload: LogPayload): LogPayload;
}