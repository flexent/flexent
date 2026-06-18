import { ChildProcess, fork } from 'node:child_process';
import { connect } from 'node:net';

import { InitializationError } from '@flexent/errors';

import { DEFAULT_STOP_GRACE_PERIOD_MS } from './schema/EnsembleConfig.js';

const parentProcess = global.process;

export class ProcessFork {

    process: ChildProcess | null = null;
    env: Record<string, string | undefined> = {};
    nodeFlags: string[] = [];
    waitForPorts: number[] = [];
    stopGracePeriodMs = DEFAULT_STOP_GRACE_PERIOD_MS;

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
            detached: true,
        });
        if (this.waitForPorts.length > 0) {
            await Promise.all(this.waitForPorts.map(port => this.waitForPort(port)));
        }
        parentProcess.once('exit', () => {
            if (this.process?.pid != null) {
                this.sendGroupSignal(this.process.pid, 'SIGTERM', this.process);
            }
        });
    }

    async stop(signal: NodeJS.Signals = 'SIGTERM') {
        const child = this.process;
        if (!child) {
            return;
        }
        const pid = child.pid;
        if (pid == null) {
            this.process = null;
            return;
        }
        this.process = null;
        this.sendGroupSignal(pid, signal, child);
        const exited = await this.waitForChildExit(child, this.stopGracePeriodMs);
        if (!exited) {
            this.sendGroupSignal(pid, 'SIGKILL', child);
            await this.waitForChildExit(child, this.stopGracePeriodMs);
        }
    }

    private sendGroupSignal(pid: number, signal: NodeJS.Signals, child: ChildProcess) {
        if (process.platform === 'win32') {
            child.kill(signal);
            return;
        }
        try {
            process.kill(-pid, signal);
        } catch (err: unknown) {
            const code = err instanceof Error && 'code' in err ? err.code : undefined;
            if (code !== 'ESRCH') {
                throw err;
            }
        }
    }

    private waitForChildExit(child: ChildProcess, timeoutMs: number): Promise<boolean> {
        if (child.exitCode != null || child.signalCode != null) {
            return Promise.resolve(true);
        }
        return new Promise(resolve => {
            const timer = setTimeout(() => resolve(false), timeoutMs);
            child.once('exit', () => {
                clearTimeout(timer);
                resolve(true);
            });
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
