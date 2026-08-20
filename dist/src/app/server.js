import { createApp } from './create-app.js';
import { loadEnv } from '../config/env.js';
import { createPostgresConnection } from '../infrastructure/postgres.js';
import { createRedisConnection } from '../infrastructure/redis.js';
import { RepositoryStore } from '../modules/repositories/repository-store.js';
import { createLogger } from '../shared/logger.js';
export function startServer() {
    const config = loadEnv();
    const logger = createLogger(config, 'api');
    const postgres = createPostgresConnection(config.DATABASE_URL);
    const redis = createRedisConnection(config.REDIS_URL);
    const app = createApp(logger, { postgres, redis }, { store: new RepositoryStore(postgres) });
    const server = app.listen(config.PORT, () => {
        logger.info({ port: config.PORT }, 'API server started');
    });
    server.on('close', () => {
        void Promise.allSettled([postgres.close(), redis.close()]);
    });
    server.on('error', (error) => {
        logger.error({ err: error }, 'API server failed');
    });
    return server;
}
if (import.meta.url === `file://${process.argv[1]}`) {
    startServer();
}
