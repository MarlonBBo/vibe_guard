import assert from 'node:assert/strict';
import { PassThrough } from 'node:stream';
import test from 'node:test';

import pino from 'pino';

import { createApp } from '../src/app/create-app.js';
import { EnvironmentValidationError } from '../src/config/env.js';
import { startWorker } from '../src/workers/index.js';

const validEnvironment = {
  DATABASE_URL: 'postgres://vibeguard:password@localhost:5432/vibeguard',
  REDIS_URL: 'redis://localhost:6379',
};

async function requestReady(postgresFails = false, redisFails = false): Promise<Response> {
  const app = createApp(pino({ enabled: false }), {
    postgres: { ping: async () => { if (postgresFails) throw new Error('postgres unavailable'); } },
    redis: { ping: async () => { if (redisFails) throw new Error('redis unavailable'); } },
  });
  const server = app.listen(0);

  try {
    await new Promise<void>((resolve) => server.once('listening', resolve));
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    return await fetch(`http://127.0.0.1:${address.port}/ready`);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
}

test('@spec:AC-003 worker validates invalid configuration without disclosing a secret', async () => {
  const secretUrl = 'postgres://vibeguard:super-secret@localhost:5432/vibeguard';

  await assert.rejects(
    startWorker({ environment: { ...validEnvironment, DATABASE_URL: secretUrl, REDIS_URL: 'invalid' } }),
    (error: unknown) => {
      assert.ok(error instanceof EnvironmentValidationError);
      assert.deepEqual(error.fields, ['REDIS_URL']);
      assert.doesNotMatch(error.message, /super-secret/);
      return true;
    },
  );
});

test('@spec:AC-004 worker emits a structured service log and closes both connections', async () => {
  const output = new PassThrough();
  let line = '';
  output.on('data', (chunk: Buffer) => { line += chunk.toString(); });
  const calls: string[] = [];
  const connection = (name: string) => ({
    connect: async () => { calls.push(`${name}:connect`); },
    ping: async () => undefined,
    close: async () => { calls.push(`${name}:close`); },
  });

  const worker = await startWorker({
    environment: validEnvironment,
    createLogger: () => pino({ base: { service: 'worker' } }, output),
    createPostgres: () => connection('postgres'),
    createRedis: () => connection('redis'),
  });
  await worker.close();

  const entry = JSON.parse(line.trim().split('\n')[0]) as Record<string, unknown>;
  assert.equal(entry.service, 'worker');
  assert.equal(entry.msg, 'Worker started');
  assert.equal(typeof entry.level, 'number');
  assert.equal(typeof entry.time, 'number');
  assert.deepEqual(calls.sort(), ['postgres:close', 'postgres:connect', 'redis:close', 'redis:connect']);
});

test('@spec:AC-006 returns 200 only when PostgreSQL and Redis are both ready', async () => {
  const ready = await requestReady();
  assert.equal(ready.status, 200);
  assert.deepEqual(await ready.json(), { status: 'ready' });

  const postgresUnavailable = await requestReady(true);
  assert.equal(postgresUnavailable.status, 503);
  assert.deepEqual(await postgresUnavailable.json(), {
    status: 'not_ready',
    dependencies: { postgres: false, redis: true },
  });

  const redisUnavailable = await requestReady(false, true);
  assert.equal(redisUnavailable.status, 503);
  assert.deepEqual(await redisUnavailable.json(), {
    status: 'not_ready',
    dependencies: { postgres: true, redis: false },
  });
});
