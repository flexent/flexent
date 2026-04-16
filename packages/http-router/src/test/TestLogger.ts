import { Logger, type LogLevel } from '@luminable/logger';
import { config } from 'mesh-config';

export class TestLogger extends Logger {

    @config() LOG_LEVEL!: LogLevel;

    override level = this.LOG_LEVEL;

}
