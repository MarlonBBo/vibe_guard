import express, { type Express } from 'express';
import type { Logger } from 'pino';

import { createHealthRouter } from './health.js';
import { createReadinessRouter, type ReadinessDependencies } from './readiness.js';

export function createApp(logger: Logger, readiness?: ReadinessDependencies): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use((request, response, next) => {
    response.on('finish', () => {
      logger.info({ method: request.method, path: request.path, statusCode: response.statusCode }, 'HTTP request completed');
    });
    next();
  });
  app.use(createHealthRouter());
  if (readiness) {
    app.use(createReadinessRouter(readiness));
  }

  return app;
}
