import { DefaultLogFormatter } from './formatters/DefaultLogFormatter.js';
import { ConsoleLogTransport } from './transports/ConsoleLogTransport.js';
import { LOG_LEVELS, LogData, LogFormatter, LoggerLike, LogLevel, LogPayload, LogTransport } from './types.js';

/**
 * Standard logger supports conditional log suppressing based on logger level.
 *
 * Implementation must specify `write`.
 */
export class Logger implements LoggerLike {

    level: LogLevel = LogLevel.INFO;
    formatter: LogFormatter = new DefaultLogFormatter();
    transport: LogTransport = new ConsoleLogTransport();

    write(payload: LogPayload) {
        this.transport.write(payload);
    }

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
