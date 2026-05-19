import { LogFormatter, LogLevel, LogPayload } from '../types.js';

export class PrettyLogFormatter implements LogFormatter {

    useColors = true;

    format(payload: LogPayload): LogPayload {
        const [open, close] = this.getLevelColor(payload.level);
        let message = payload.message;
        if (this.useColors) {
            message = `${open}${message}${close}`;
        }
        return {
            ...payload,
            message,
        };
    }

    getLevelColor(level: LogLevel): [string, string] {
        switch (level) {
            case LogLevel.INFO:
                return ['\x1b[34m', '\x1b[0m'];
            case LogLevel.WARN:
                return ['\x1b[33m', '\x1b[0m'];
            case LogLevel.ERROR:
                return ['\x1b[31m', '\x1b[0m'];
            case LogLevel.DEBUG:
            default:
                return ['\x1b[90m', '\x1b[0m'];
        }
    }

}
