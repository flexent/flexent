import { LogPayload, LogTransport } from '../types.js';

export class ConsoleLogTransport implements LogTransport {

    write(payload: LogPayload) {
        const { level, message, data } = payload;
        const log = (console as any)[level];
        if (typeof log === 'function') {
            const args = data ? [message, data] : [message];
            log.apply(log, args);
        }
    }

}
