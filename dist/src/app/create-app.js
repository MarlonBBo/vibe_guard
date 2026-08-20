import express from 'express';
import { createHealthRouter } from './health.js';
import { createReadinessRouter } from './readiness.js';
import { createJsonBodyErrorHandler, createRepositoriesRouter } from '../modules/repositories/repositories-router.js';
export function createApp(logger, readiness, repositories) {
    const app = express();
    app.disable('x-powered-by');
    app.use(express.json());
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
    if (repositories) {
        app.use('/repositories', createRepositoriesRouter({ ...repositories, logger }));
    }
    app.use(createJsonBodyErrorHandler(logger));
    return app;
}
