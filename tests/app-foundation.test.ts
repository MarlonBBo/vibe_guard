import assert from 'node:assert/strict';
import { PassThrough } from 'node:stream';
import test from 'node:test';

import pino from 'pino';

import { createApp } from '../src/app/create-app.js';
import { EnvironmentValidationError, loadEnv } from '../src/config/env.js';
import { createLogger } from '../src/shared/logger.js';

const validEnvironment = {
  DATABASE_URL: 'postgres://vibeguard:password@localhost:5432/vibeguard',
  REDIS_URL: 'redis://localhost:6379',
};

test('@spec:AC-003 rejects invalid environment without exposing its secret value', () => {
  const secretUrl = 'postgres://vibeguard:super-secret@localhost:5432/vibeguard';

  assert.throws(
    () => loadEnv({ ...validEnvironment, DATABASE_URL: secretUrl, REDIS_URL: 'not-a-url' }),
    (error: unknown) => {
      assert.ok(error instanceof EnvironmentValidationError);
      assert.deepEqual(error.fields, ['REDIS_URL']);
      assert.doesNotMatch(error.message, /super-secret/);
      return true;
    },
  );
});

test('@spec:AC-004 writes structured logs with service identity and no secrets', () => {
  const output = new PassThrough();
  let line = '';
  output.on('data', (chunk: Buffer) => {
    line += chunk.toString();
  });
  const logger = createLogger({ LOG_LEVEL: 'info' }, 'api', output);

  logger.info({ DATABASE_URL: validEnvironment.DATABASE_URL }, 'service is ready');

  const entry = JSON.parse(line) as Record<string, unknown>;
  assert.equal(entry.service, 'api');
  assert.equal(entry.msg, 'service is ready');
  assert.equal(typeof entry.level, 'number');
  assert.equal(typeof entry.time, 'number');
  assert.notEqual(entry.DATABASE_URL, 'postgres://vibeguard:password@localhost:5432/vibeguard');
});

test('@spec:AC-005 responds to health checks without infrastructure configuration', async () => {
  const logger = pino({ enabled: false });
  const app = createApp(logger);
  const server = app.listen(0);

  try {
    await new Promise<void>((resolve) => server.once('listening', resolve));
    const address = server.address();
    assert.ok(address && typeof address !== 'string');

    const response = await fetch(`http://127.0.0.1:${address.port}/health`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: 'ok' });
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});
