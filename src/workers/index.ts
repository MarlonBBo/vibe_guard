import pino, { type Logger } from 'pino';

import { type AppConfig, loadEnv } from '../config/env.js';
import { createPostgresConnection, type PostgresConnection } from '../infrastructure/postgres.js';
import { createRedisConnection, type RedisConnection } from '../infrastructure/redis.js';
import { createLogger } from '../shared/logger.js';

export interface WorkerRuntime {
  close(): Promise<void>;
}

export interface WorkerOptions {
  environment?: NodeJS.ProcessEnv;
  createLogger?: (config: Pick<AppConfig, 'LOG_LEVEL'>, service: string) => Logger;
  createPostgres?: (connectionString: string) => PostgresConnection;
  createRedis?: (connectionUrl: string) => RedisConnection;
}

export async function startWorker(options: WorkerOptions = {}): Promise<WorkerRuntime> {
  const config = loadEnv(options.environment);
  const logger = (options.createLogger ?? createLogger)(config, 'worker');
  const postgres = (options.createPostgres ?? createPostgresConnection)(config.DATABASE_URL);
  const redis = (options.createRedis ?? createRedisConnection)(config.REDIS_URL);

  try {
    await Promise.all([postgres.connect(), redis.connect()]);
  } catch (error) {
    await Promise.allSettled([postgres.close(), redis.close()]);
    logger.error({ err: error }, 'Worker failed to connect to infrastructure');
    throw error;
  }

  logger.info('Worker started');

  return {
    async close(): Promise<void> {
      await Promise.all([postgres.close(), redis.close()]);
      logger.info('Worker stopped');
    },
  };
}

async function main(): Promise<void> {
  try {
    const worker = await startWorker();
    const shutdown = async (): Promise<void> => {
      await worker.close();
      process.exit(0);
    };
    process.once('SIGINT', shutdown);
    process.once('SIGTERM', shutdown);
  } catch (error) {
    pino().error({ err: error }, 'Worker failed to start');
    process.exitCode = 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  void main();
}
