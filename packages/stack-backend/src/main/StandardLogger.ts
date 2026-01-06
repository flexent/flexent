import { ConsoleLogger, DefaultLogFormatter, StructuredLogFormatter } from '@luminable/logger';
import { config } from 'mesh-config';

export class StandardLogger extends ConsoleLogger {

    @config({ default: 'info' }) LOG_LEVEL!: string;
    @config({ default: false }) LOG_PRETTY!: boolean;
    @config({ default: false }) LOG_STACK!: boolean;

    constructor() {
        super();
        this.formatter = this.createFormatter();
        this.setLevel(this.LOG_LEVEL);
    }

    private createFormatter() {
        if (this.LOG_PRETTY) {
            return new DefaultLogFormatter();
        }
        const fmt = new StructuredLogFormatter();
        fmt.includeStack = this.LOG_STACK;
        return fmt;
    }

}
