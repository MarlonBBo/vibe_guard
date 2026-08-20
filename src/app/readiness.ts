import { Router } from 'express';

export interface ReadinessDependency {
  ping(): Promise<void>;
}

export interface ReadinessDependencies {
  postgres: ReadinessDependency;
  redis: ReadinessDependency;
}

export function createReadinessRouter(dependencies: ReadinessDependencies): Router {
  const router = Router();

  router.get('/ready', async (_request, response) => {
    const checks = await Promise.allSettled([
      dependencies.postgres.ping(),
      dependencies.redis.ping(),
    ]);
    const postgresReady = checks[0].status === 'fulfilled';
    const redisReady = checks[1].status === 'fulfilled';

    if (postgresReady && redisReady) {
      response.status(200).json({ status: 'ready' });
      return;
    }

    response.status(503).json({
      status: 'not_ready',
      dependencies: { postgres: postgresReady, redis: redisReady },
    });
  });

  return router;
}
