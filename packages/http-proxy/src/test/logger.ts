import { Logger } from '../main/types.js';

export const testLogger: Logger = process.env.DEBUG ?
    console :
    {
        info() {},
        warn() {},
        error() {},
        debug() {},
    };
