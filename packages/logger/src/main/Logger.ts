import { DefaultLogFormatter } from './formatters/DefaultLogFormatter.js';
import { LOG_LEVELS, LogData, LogFormatter, LoggerLike, LogLevel, LogPayload } from './types.js';

/**
 * Standard logger supports conditional log suppressing based on logger level.
 *
 * Implementation must specify `write`.
 */
export abstract class Logger implements LoggerLike {

    level: LogLevel = LogLevel.INFO;
    formatter: LogFormatter = new DefaultLogFormatter();

    abstract write(payload: LogPayload): void;

    log(level: LogLevel, message: string, data?: LogData) {
        if (level === 'mute' || LOG_LEVELS.indexOf(level) < LOG_LEVELS.indexOf(this.level)) {
            return;
        }
        const formatted = this.formatter.format({ level, message, data });
        return this.write(formatted);
    }

    info(message: string, data?: LogData) {
        this.log(LogLevel.INFO, message, data);
    }

    warn(message: string, data?: LogData) {
        this.log(LogLevel.WARN, message, data);
    }

    error(message: string, data?: LogData) {
        this.log(LogLevel.ERROR, message, data);
    }

    debug(message: string, data?: LogData) {
        this.log(LogLevel.DEBUG, message, data);
    }

    setLevel(level: string) {
        if (Object.values(LogLevel).includes(level as any)) {
            this.level = level as LogLevel;
        }
    }

}
