import { Redis } from 'ioredis';

export interface RedisConnection {
  connect(): Promise<void>;
  ping(): Promise<void>;
  close(): Promise<void>;
}

export function createRedisConnection(connectionUrl: string): RedisConnection {
  const client = new Redis(connectionUrl, { lazyConnect: true });

  return {
    async connect(): Promise<void> {
      await client.connect();
      await client.ping();
    },
    async ping(): Promise<void> {
      await client.ping();
    },
    async close(): Promise<void> {
      if (client.status === 'wait') {
        client.disconnect();
        return;
      }

      await client.quit();
    },
  };
}
