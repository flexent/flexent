import { ChildProcess, fork } from 'node:child_process';
import { connect } from 'node:net';

import { InitializationError } from '@flexent/errors';

const parentProcess = global.process;

export class ProcessFork {

    process: ChildProcess | null = null;
    env: Record<string, string | undefined> = {};
    nodeFlags: string[] = [];
    waitForPorts: number[] = [];

    constructor(
        readonly cwd: string,
        readonly modulePath: string,
    ) {}

    isRunning() {
        return !!this.process;
    }

    async start() {
        if (this.process) {
            return;
        }
        this.process = fork(this.modulePath, {
            cwd: this.cwd,
            env: {
                ...process.env,
                ...this.env,
            },
            execArgv: this.nodeFlags,
            stdio: 'inherit',
        });
        if (this.waitForPorts.length > 0) {
            await Promise.all(this.waitForPorts.map(port => this.waitForPort(port)));
        }
        parentProcess.once('exit', () => {
            if (this.process) {
                this.process.kill('SIGTERM');
            }
        });
    }

    async stop(signal: NodeJS.Signals = 'SIGTERM') {
        await new Promise(resolve => {
            if (this.process) {
                this.process.once('exit', resolve);
                this.process.kill(signal);
                this.process = null;
            } else {
                resolve(undefined);
            }
        });
    }

    private async waitForPort(port: number, timeout = 10_000) {
        const timeoutAt = Date.now() + timeout;
        while (Date.now() < timeoutAt) {
            try {
                await new Promise<void>((resolve, reject) => {
                    connect(port, '127.0.0.1', () => resolve()).once('error', reject);
                });
                return;
            } catch (_err) {
                await new Promise(resolve => setTimeout(resolve, 10));
            }
        }
        throw new InitializationError(`Port ${port} not ready`);
    }

}
