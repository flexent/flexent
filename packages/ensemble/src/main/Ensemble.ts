import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

import { InitializationError } from '@flexent/errors';
import * as Yaml from 'yaml';

import { ProcessFork } from './ProcessFork.js';
import { EnsembleAppConfig } from './schema/EnsembleAppConfig.js';
import { EnsembleConfig, EnsembleConfigSchema } from './schema/EnsembleConfig.js';

export class Ensemble {

    private forksMap = new Map<string, ProcessFork>();

    rootDir: string = process.cwd();
    config: EnsembleConfig = {
        apps: [],
        sharedEnv: {},
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
        fork.waitForPorts = this.resolveWaitForPorts(config.waitForPorts ?? [], env);
        await fork.start();
    }

    async stop(id: string, signal: NodeJS.Signals = 'SIGTERM') {
        const existing = this.forksMap.get(id);
        if (existing) {
            await existing.stop(signal);
        }
    }

    async startAll() {
        await Promise.all(this.config.apps.map(cfg => this.start(cfg.id)));
    }

    async stopAll() {
        await Promise.all(this.config.apps.map(cfg => this.stop(cfg.id)));
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
