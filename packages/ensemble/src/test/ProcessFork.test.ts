import assert from 'node:assert';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { ProcessFork } from '../main/ProcessFork.js';

describe('ProcessFork', () => {

    it('stops a running child', async () => {
        const { dir, entrypoint } = await createFixtureDir(`
import fs from 'node:fs';

fs.writeFileSync('pid.txt', String(process.pid));
setInterval(() => {}, 99999);
`);
        const marker = path.join(dir, 'pid.txt');
        const fork = new ProcessFork(dir, entrypoint);
        fork.stopGracePeriodMs = 1000;
        await fork.start();
        const text = await waitForFile(marker);
        const pid = Number(text.trim());
        await fork.stop();
        assert.equal(isProcessRunning(pid), false);
    });

    const describeUnix = process.platform === 'win32' ? describe.skip : describe;

    describeUnix('process group', () => {

        it('stops a child and its grandchild', async () => {
            const { dir, entrypoint } = await createFixtureDir(`
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const grandchild = spawn(process.execPath, ['-e', 'setInterval(() => {}, 99999)'], {
    stdio: 'ignore',
});
fs.writeFileSync('pids.txt', process.pid + '\\n' + grandchild.pid + '\\n');
setInterval(() => {}, 99999);
`);
            const marker = path.join(dir, 'pids.txt');
            const fork = new ProcessFork(dir, entrypoint);
            fork.stopGracePeriodMs = 1000;
            await fork.start();
            const text = await waitForFile(marker);
            const [childPid, grandchildPid] = text.trim().split('\n').map(Number);
            await fork.stop();
            assert.equal(isProcessRunning(childPid), false);
            assert.equal(isProcessRunning(grandchildPid), false);
        });

        it('escalates to SIGKILL after the grace period', async () => {
            const { dir, entrypoint } = await createFixtureDir(`
import fs from 'node:fs';

process.on('SIGTERM', () => {});
fs.writeFileSync('pid.txt', String(process.pid));
setInterval(() => {}, 99999);
`);
            const marker = path.join(dir, 'pid.txt');
            const fork = new ProcessFork(dir, entrypoint);
            fork.stopGracePeriodMs = 200;
            await fork.start();
            const text = await waitForFile(marker);
            const pid = Number(text.trim());
            await fork.stop();
            assert.equal(isProcessRunning(pid), false);
        });

        it('accepts SIGKILL while a graceful stop is in progress', async () => {
            const { dir, entrypoint } = await createFixtureDir(`
import fs from 'node:fs';

process.on('SIGTERM', () => {});
fs.writeFileSync('pid.txt', String(process.pid));
setInterval(() => {}, 99999);
`);
            const marker = path.join(dir, 'pid.txt');
            const fork = new ProcessFork(dir, entrypoint);
            fork.stopGracePeriodMs = 5000;
            await fork.start();
            const text = await waitForFile(marker);
            const pid = Number(text.trim());
            const gracefulStop = fork.stop();
            await new Promise(resolve => setTimeout(resolve, 100));
            await fork.stop('SIGKILL');
            await gracefulStop;
            assert.equal(isProcessRunning(pid), false);
        });

    });

});

function isProcessRunning(pid: number) {
    try {
        process.kill(pid, 0);
        return true;
    } catch {
        return false;
    }
}

async function waitForFile(file: string, timeoutMs = 5000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        try {
            return await readFile(file, 'utf-8');
        } catch {
            await new Promise(resolve => setTimeout(resolve, 50));
        }
    }
    throw new Error(`Timeout waiting for ${file}`);
}

async function createFixtureDir(script: string) {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'ensemble-fork-'));
    const entrypoint = path.join(dir, 'app.mjs');
    await writeFile(entrypoint, script);
    return { dir, entrypoint };
}
