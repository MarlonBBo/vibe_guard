import pino from 'pino';
export function createLogger(config, service, destination) {
    return pino({
        level: config.LOG_LEVEL,
        base: { service },
        redact: {
            paths: ['DATABASE_URL', 'REDIS_URL', '*.DATABASE_URL', '*.REDIS_URL'],
            censor: '[REDACTED]',
        },
    }, destination);
}
