import { type LogFormatter, type LogPayload } from '../types.js';

export class DefaultLogFormatter implements LogFormatter {

    format(payload: LogPayload): LogPayload {
        return payload;
    }

}
