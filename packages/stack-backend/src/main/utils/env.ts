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
    process.loadEnvFile('.env');
    if (env === 'development') {
        process.loadEnvFile('.env.dev');
    }
    if (env === 'test') {
        process.loadEnvFile('.env.test');
        process.loadEnvFile('.env.dev');
    }
}
