import { Logger, type LogLevel } from '@flexent/logger';
import { config } from 'mesh-config';

export class TestLogger extends Logger {

    @config() LOG_LEVEL!: LogLevel;

    override level = this.LOG_LEVEL;

}
