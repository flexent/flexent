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

    it('passes args to the forked process', async () => {
        const { dir, entrypoint } = await createFixtureDir(`
import fs from 'node:fs';

fs.writeFileSync('args.txt', JSON.stringify(process.argv.slice(2)));
`);
        const marker = path.join(dir, 'args.txt');
        const fork = new ProcessFork(dir, entrypoint);
        fork.args = ['--watch', 'extra'];
        fork.stopGracePeriodMs = 1000;
        await fork.start();
        const text = await waitForFile(marker);
        await fork.stop();
        assert.deepEqual(JSON.parse(text), ['--watch', 'extra']);
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
