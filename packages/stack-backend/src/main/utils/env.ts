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

export function loadEnvFile(path: string) {
    try {
        process.loadEnvFile(path);
    } catch (error: any) {
        if (error?.code === 'ENOENT') {
            return;
        }
        throw error;
    }
}

export function configureEnv(env: EnvName) {
    loadEnvFile('.env');
    if (env === 'development') {
        loadEnvFile('.env.dev');
    }
    if (env === 'test') {
        loadEnvFile('.env.test');
        loadEnvFile('.env.dev');
    }
}
