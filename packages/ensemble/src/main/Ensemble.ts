import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

import { InitializationError } from '@flexent/errors';
import * as Yaml from 'yaml';

import { ProcessFork } from './ProcessFork.js';
import { EnsembleAppConfig } from './schema/EnsembleAppConfig.js';
import {
    DEFAULT_STOP_GRACE_PERIOD_MS,
    EnsembleConfig,
    EnsembleConfigSchema,
} from './schema/EnsembleConfig.js';

export class Ensemble {

    private forksMap = new Map<string, ProcessFork>();

    rootDir: string = process.cwd();
    config: EnsembleConfig = {
        apps: [],
        sharedEnv: {},
        stopGracePeriodMs: DEFAULT_STOP_GRACE_PERIOD_MS,
    };

    async resolve(filename = 'ensemble.yaml') {
        const file = path.resolve(process.cwd(), filename);
        const isFile = await stat(file).then(s => s.isFile(), () => false);
        if (!isFile) {
            throw new InitializationError(`Config file not found: ${file}`);
        }
        await this.load(file);
    }

    async load(file: string) {
        const text = await readFile(file, 'utf-8');
        const yaml = Yaml.parse(text);
        const decoded = EnsembleConfigSchema.decode(yaml);
        this.config = {
            apps: decoded.apps,
            sharedEnv: decoded.sharedEnv ?? {},
            stopGracePeriodMs: decoded.stopGracePeriodMs,
        };
        this.rootDir = path.dirname(file);
    }

    getConfig(id: string): EnsembleAppConfig {
        const config = this.config.apps.find(app => app.id === id);
        if (!config) {
            throw new Error(`App ${id} not found`);
        }
        return config;
    }

    async start(id: string) {
        const existing = this.forksMap.get(id);
        if (existing) {
            return await existing.start();
        }
        const config = this.getConfig(id);
        const cwd = path.join(this.rootDir, config.dir);
        const fork = new ProcessFork(cwd, config.entrypoint);
        this.forksMap.set(id, fork);
        const env = this.buildAppEnv(config);
        fork.env = env;
        fork.nodeFlags = config.nodeFlags ?? [];
        fork.args = config.args ?? [];
        fork.waitForPorts = this.resolveWaitForPorts(config.waitForPorts ?? [], env);
        fork.stopGracePeriodMs = this.config.stopGracePeriodMs;
        await fork.start();
    }

    async stop(id: string, signal: NodeJS.Signals = 'SIGTERM') {
        const existing = this.forksMap.get(id);
        if (existing) {
            await existing.stop(signal);
        }
    }

    async startAll() {
        for (const id of this.resolveStartOrder()) {
            await this.start(id);
        }
    }

    async stopAll() {
        const order = this.resolveStartOrder();
        for (let i = order.length - 1; i >= 0; i--) {
            await this.stop(order[i]!);
        }
    }

    private resolveStartOrder(): string[] {
        const ids = new Set(this.config.apps.map(app => app.id));
        const order: string[] = [];
        const visited = new Set<string>();
        const visiting = new Set<string>();
        const visit = (id: string) => {
            if (visited.has(id)) {
                return;
            }
            if (visiting.has(id)) {
                throw new InitializationError(`Circular dependency detected involving ${id}`);
            }
            visiting.add(id);
            const config = this.getConfig(id);
            for (const dep of config.dependsOn ?? []) {
                if (!ids.has(dep)) {
                    throw new InitializationError(`dependsOn: app ${dep} not found`);
                }
                visit(dep);
            }
            visiting.delete(id);
            visited.add(id);
            order.push(id);
        };
        for (const app of this.config.apps) {
            visit(app.id);
        }
        return order;
    }

    private buildAppEnv(config: EnsembleAppConfig): Record<string, string | undefined> {
        const env: Record<string, string | undefined> = {};
        for (const [k, v] of Object.entries(this.config.sharedEnv)) {
            env[k] = String(v);
        }
        env.NODE_ENV = process.env.NODE_ENV;
        if (config.env) {
            for (const [k, v] of Object.entries(config.env)) {
                env[k] = v;
            }
        }
        return env;
    }

    private resolveWaitForPorts(
        ports: unknown[],
        resolvedEnv: Record<string, string | undefined>,
    ): number[] {
        const resolved: number[] = [];
        for (const item of ports) {
            if (typeof item === 'number') {
                resolved.push(item);
                continue;
            }
            if (typeof item !== 'string') {
                throw new InitializationError(`waitForPorts[] should contain strings or numbers`);
            }
            const value = resolvedEnv[item];
            if (value == null) {
                throw new InitializationError(`waitForPorts: env ${item} is not set`);
            }
            const port = Number(value);
            if (!Number.isFinite(port)) {
                throw new InitializationError(`waitForPorts: env ${item} is not a valid port`);
            }
            resolved.push(port);
        }
        return resolved;
    }

}
