import { LogFormatter, LogLevel, LogPayload } from '../types.js';

export interface StructuredLogEntry {
    severity: StructuredLogSeverity;
    message: string;
    time: string;
    httpRequest?: StructuredLogHttpRequest;
    [key: string]: any;
}

export type StructuredLogSeverity = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR';

export type StructuredLogHttpRequest = {
    requestMethod: string;
    requestUrl: string;
    status: number;
    userAgent?: string;
    referer?: string;
    latency?: string;
};

/**
 * Formats logs in JSON format understood by Cloud Logging.
 *
 * See https://cloud.google.com/logging/docs/structured-logging
 */
export class StructuredLogFormatter implements LogFormatter {

    maxDepth = 4;
    maxArrayItems = 10;
    maxStringSize = 1000;
    includeStack = false;

    format(payload: LogPayload) {
        const { level, message, data } = payload;
        const entry: StructuredLogEntry = {
            severity: this.levelToSeverity(level),
            message,
            time: new Date().toISOString(),
            ...this.convertObject(data ?? {}),
        };
        return {
            level,
            message: JSON.stringify(entry),
        };
    }

    private levelToSeverity(level: LogLevel): StructuredLogSeverity {
        switch (level) {
            case LogLevel.DEBUG:
                return 'DEBUG';
            case LogLevel.WARN:
                return 'WARNING';
            case LogLevel.ERROR:
                return 'ERROR';
            case LogLevel.INFO:
            case LogLevel.MUTE:
            default:
                return 'INFO';
        }
    }

    private convertData(value: any, depth = 0): any {
        if (depth > this.maxDepth) {
            return '…';
        }
        if (value == null) {
            return null;
        }
        if (value instanceof Error) {
            return this.convertData({
                name: value.name,
                message: value.message,
                code: (value as any).code,
                details: (value as any).details,
                status: (value as any).status,
                stack: this.includeStack ? (value as any).stack : undefined,
            }, depth);
        }
        if (value instanceof Date) {
            return value.toISOString();
        }
        if (Array.isArray(value)) {
            return value.slice(0, this.maxArrayItems).map(v => this.convertData(v, depth + 1));
        }
        if (typeof value === 'string') {
            return value.length > this.maxStringSize ? value.substring(0, this.maxStringSize) + '…' : value;
        }
        return value;
    }

    private convertObject(data: object, depth = 0) {
        const result: Record<string, any> = {};
        for (const [key, value] of Object.entries(data)) {
            if (value == null) {
                continue;
            }
            result[key] = this.convertData(value, depth + 1);
        }
        return result;
    }

}

