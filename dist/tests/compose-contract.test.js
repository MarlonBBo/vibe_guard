import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
const root = path.resolve(import.meta.dirname, '..');
test('@spec:AC-007 Compose defines the API, worker, PostgreSQL and Redis topology', async () => {
    const compose = await readFile(path.join(root, 'docker-compose.yml'), 'utf8');
    for (const service of ['postgres:', 'redis:', 'api:', 'worker:']) {
        assert.match(compose, new RegExp(`^  ${service}`, 'm'));
    }
    assert.match(compose, /postgres:17-alpine/);
    assert.match(compose, /redis:7-alpine/);
    assert.equal((compose.match(/^    healthcheck:/gm) ?? []).length, 4);
    assert.equal((compose.match(/condition: service_healthy/g) ?? []).length, 4);
});
