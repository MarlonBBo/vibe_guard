import assert from 'node:assert/strict';
import test from 'node:test';

import pino from 'pino';

import { createApp } from '../src/app/create-app.js';
import {
  GitHubRepositoryRemoteError,
  GitHubRepositoryValidationError,
  type GitHubRepository,
} from '../src/modules/repositories/github-repository.js';
import { RepositoryAlreadyExistsError, type Repository } from '../src/modules/repositories/repository.js';

const repositoryId = '5a81dc5e-a4e8-4e16-a4f8-d95a9c3c4f13';

function repository(overrides: Partial<Repository> = {}): Repository {
  return {
    id: repositoryId,
    name: 'repository',
    url: 'https://github.com/owner/repository',
    provider: 'github',
    externalId: 'owner/repository',
    defaultBranch: 'main',
    createdAt: new Date('2026-01-02T03:04:05.000Z'),
    updatedAt: new Date('2026-01-02T03:04:06.000Z'),
    ...overrides,
  };
}

class FakeRepositoryStore {
  readonly persisted: Repository[] = [];

  async create(input: GitHubRepository): Promise<Repository> {
    if (this.persisted.some((item) => item.url === input.url)) {
      throw new RepositoryAlreadyExistsError(input.url);
    }
    const created = repository({ ...input, id: `${repositoryId.slice(0, -1)}${this.persisted.length}` });
    this.persisted.push(created);
    return created;
  }

  async list(): Promise<Repository[]> {
    return [...this.persisted].sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime() || right.id.localeCompare(left.id));
  }

  async findById(id: string): Promise<Repository | undefined> {
    return this.persisted.find((item) => item.id === id);
  }
}

async function request(
  store: FakeRepositoryStore,
  path: string,
  options: RequestInit = {},
  inspect: (input: unknown) => Promise<GitHubRepository> = async () => ({
    url: 'https://github.com/owner/repository', name: 'repository', provider: 'github', externalId: 'owner/repository', defaultBranch: 'main',
  }),
): Promise<Response> {
  const server = createApp(pino({ enabled: false }), undefined, { store, inspect }).listen(0);
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  try {
    return await fetch(`http://127.0.0.1:${address.port}${path}`, options);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
}

test('@spec:AC-010 POST /repositories persists inspected metadata and returns public camelCase fields', async () => {
  const store = new FakeRepositoryStore();
  const response = await request(store, '/repositories', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url: 'https://github.com/OWNER/Repository.git' }),
  }, async () => ({ url: 'https://github.com/owner/repository', name: 'repository', provider: 'github', externalId: 'owner/repository', defaultBranch: 'main' }));

  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), {
    id: `${repositoryId.slice(0, -1)}0`, name: 'repository', url: 'https://github.com/owner/repository', provider: 'github', externalId: 'owner/repository', defaultBranch: 'main', createdAt: '2026-01-02T03:04:05.000Z', updatedAt: '2026-01-02T03:04:06.000Z',
  });
  assert.equal(store.persisted.length, 1);
});

test('@spec:AC-011 POST /repositories returns a structured 400 without persisting invalid input', async () => {
  const store = new FakeRepositoryStore();
  const response = await request(store, '/repositories', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url: 'http://github.com/owner/repository' }),
  }, async () => { throw new GitHubRepositoryValidationError(); });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: { code: 'VALIDATION_ERROR', message: 'Request validation failed.' } });
  assert.equal(store.persisted.length, 0);
});

test('@spec:AC-012 POST /repositories returns a structured 422 without persisting inaccessible repositories', async () => {
  const store = new FakeRepositoryStore();
  const response = await request(store, '/repositories', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url: 'https://github.com/owner/missing' }),
  }, async () => { throw new GitHubRepositoryRemoteError(); });

  assert.equal(response.status, 422);
  assert.deepEqual(await response.json(), { error: { code: 'REPOSITORY_UNREACHABLE', message: 'Repository is inaccessible or has no resolvable default branch.' } });
  assert.equal(store.persisted.length, 0);
});

test('@spec:AC-013 POST /repositories rejects duplicate canonical URLs and preserves one record', async () => {
  const store = new FakeRepositoryStore();
  const create = () => request(store, '/repositories', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url: 'https://github.com/owner/repository' }),
  });
  assert.equal((await create()).status, 201);
  const response = await create();

  assert.equal(response.status, 409);
  assert.deepEqual(await response.json(), { error: { code: 'REPOSITORY_ALREADY_EXISTS', message: 'Repository already exists.' } });
  assert.equal(store.persisted.length, 1);
});

test('@spec:AC-014 GET /repositories lists the complete catalog in newest-first deterministic order', async () => {
  const store = new FakeRepositoryStore();
  store.persisted.push(repository({ id: '1a81dc5e-a4e8-4e16-a4f8-d95a9c3c4f13', name: 'older', createdAt: new Date('2026-01-01T00:00:00.000Z') }));
  store.persisted.push(repository({ id: '9a81dc5e-a4e8-4e16-a4f8-d95a9c3c4f13', name: 'newer', createdAt: new Date('2026-01-02T00:00:00.000Z') }));
  const response = await request(store, '/repositories');

  assert.equal(response.status, 200);
  const body = await response.json() as Repository[];
  assert.deepEqual(body.map((item) => item.name), ['newer', 'older']);
  assert.equal('external_id' in body[0], false);
});

test('@spec:AC-015 GET /repositories/:id returns the requested public repository', async () => {
  const store = new FakeRepositoryStore();
  store.persisted.push(repository());
  const response = await request(store, `/repositories/${repositoryId}`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    id: repositoryId, name: 'repository', url: 'https://github.com/owner/repository', provider: 'github', externalId: 'owner/repository', defaultBranch: 'main', createdAt: '2026-01-02T03:04:05.000Z', updatedAt: '2026-01-02T03:04:06.000Z',
  });
});

test('@spec:AC-016 GET /repositories/:id reports a missing valid UUID with a structured 404', async () => {
  const store = new FakeRepositoryStore();
  const response = await request(store, '/repositories/7c86a995-7bbb-4e7e-943d-eafdbfa3ecf9');

  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: { code: 'REPOSITORY_NOT_FOUND', message: 'Repository was not found.' } });
});
