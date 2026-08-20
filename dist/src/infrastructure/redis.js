import { Redis } from 'ioredis';
export function createRedisConnection(connectionUrl) {
    const client = new Redis(connectionUrl, { lazyConnect: true });
    return {
        async connect() {
            await client.connect();
            await client.ping();
        },
        async ping() {
            await client.ping();
        },
        async close() {
            if (client.status === 'wait') {
                client.disconnect();
                return;
            }
            await client.quit();
        },
    };
}
