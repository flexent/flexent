import { Logger } from './Logger.js';
import { LogPayload } from './types.js';

const console = globalThis.console;

/**
 * Simple logger using natively available `console` API.
 */
export class ConsoleLogger extends Logger {

    override write(payload: LogPayload): void {
        const { level, message, data } = payload;
        const log = (console as any)[level];
        if (typeof log === 'function') {
            const args = data ? [message, data] : [message];
            log.apply(log, args);
        }
    }

}
