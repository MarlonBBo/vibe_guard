import { Router } from 'express';
export function createHealthRouter() {
    const router = Router();
    router.get('/health', (_request, response) => {
        response.status(200).json({ status: 'ok' });
    });
    return router;
}
