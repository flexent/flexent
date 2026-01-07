import { Logger } from '@luminable/logger';
import { dep } from 'mesh-ioc';
import { Event } from 'nanoevent';

export class ProcessSignals {

    @dep() protected logger!: Logger;

    onStopRequested = new Event<void>();

    installSignalHandlers() {
        process.on('uncaughtException', this.onUnhandledException);
        process.on('unhandledRejection', this.onUnhandledRejection);
        process.on('SIGTERM', this.onSIGTERM);
        process.on('SIGINT', this.onSIGINT);
    }

    uninstallSignalHandlers() {
        process.removeListener('uncaughtException', this.onUnhandledException);
        process.removeListener('unhandledRejection', this.onUnhandledRejection);
        process.removeListener('SIGTERM', this.onSIGTERM);
        process.removeListener('SIGINT', this.onSIGINT);
    }

    protected onUnhandledException = (error: unknown) => {
        this.logger.error('uncaughtException', { error });
    };

    protected onUnhandledRejection = (error: unknown) => {
        this.logger.error('unhandledRejection', { error });
    };

    protected onSIGTERM = () => {
        this.logger.info('Received SIGTERM');
        this.onStopRequested.emit();
    };

    protected onSIGINT = () => {
        this.logger.info('Received SIGINT');
        this.onStopRequested.emit();
    };

}
