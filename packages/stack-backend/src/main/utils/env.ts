import { configDotenv } from 'dotenv';

export type EnvName = 'development' | 'test' | 'production';

export function getEnvName() {
    if (process.env.NODE_ENV === 'development') {
        return 'development';
    }
    if (process.env.NODE_ENV === 'test') {
        return 'test';
    }
    return 'production';
}

export function configureEnv(env: EnvName) {
    configDotenv({ path: '.env' });
    if (env === 'development') {
        configDotenv({ path: '.env.dev' });
    }
    if (env === 'test') {
        configDotenv({ path: '.env.test' });
        configDotenv({ path: '.env.dev' });
    }
}
