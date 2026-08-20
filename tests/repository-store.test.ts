import assert from 'node:assert/strict';
import test from 'node:test';

import { RepositoryAlreadyExistsError } from '../src/modules/repositories/repository.js';
import { RepositoryStore, type Queryable } from '../src/modules/repositories/repository-store.js';

interface RecordedQuery {
  text: string;
  values: unknown[] | undefined;
}

class FakeQueryable implements Queryable {
  readonly queries: RecordedQuery[] = [];

  constructor(private readonly rows: object[] = [], private readonly error?: unknown) {}

  async query<Row extends object>(text: string, values?: unknown[]): Promise<{ rows: Row[] }> {
    this.queries.push({ text, values });
    if (this.error !== undefined) throw this.error;
    return { rows: this.rows as Row[] };
  }
}

const row = {
  id: '5a81dc5e-a4e8-4e16-a4f8-d95a9c3c4f13',
  name: 'repository',
  url: 'https://github.com/owner/repository',
  provider: 'github',
  external_id: 'owner/repository',
  default_branch: 'main',
  created_at: new Date('2026-01-02T03:04:05.000Z'),
  updated_at: new Date('2026-01-02T03:04:06.000Z'),
};

test('@spec:AC-010 persists a repository and maps database fields to the public model', async () => {
  const database = new FakeQueryable([row]);
  const store = new RepositoryStore(database);

  const repository = await store.create({
    name: 'repository',
    url: 'https://github.com/owner/repository',
    provider: 'github',
    externalId: 'owner/repository',
    defaultBranch: 'main',
  });

  assert.deepEqual(repository, {
    id: row.id,
    name: row.name,
    url: row.url,
    provider: row.provider,
    externalId: row.external_id,
    defaultBranch: row.default_branch,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
  assert.match(database.queries[0].text, /^INSERT INTO repositories/m);
  assert.match(database.queries[0].text, /VALUES \(\$1, \$2, \$3, \$4, \$5\)/);
  assert.deepEqual(database.queries[0].values, [
    'repository',
    'https://github.com/owner/repository',
    'github',
    'owner/repository',
    'main',
  ]);
});

test('@spec:AC-013 translates the canonical URL unique constraint into a typed conflict error', async () => {
  const database = new FakeQueryable([], { code: '23505', constraint: 'repositories_url_key' });
  const store = new RepositoryStore(database);

  await assert.rejects(
    store.create({
      name: 'repository',
      url: 'https://github.com/owner/repository',
      provider: 'github',
      externalId: 'owner/repository',
      defaultBranch: 'main',
    }),
    (error: unknown) => {
      assert.ok(error instanceof RepositoryAlreadyExistsError);
      assert.equal(error.code, 'REPOSITORY_ALREADY_EXISTS');
      assert.equal(error.url, 'https://github.com/owner/repository');
      return true;
    },
  );
});

test('@spec:AC-014 lists every repository in deterministic newest-first order without database field names', async () => {
  const newer = { ...row, id: '7a81dc5e-a4e8-4e16-a4f8-d95a9c3c4f13', name: 'newer' };
  const older = { ...row, id: '1a81dc5e-a4e8-4e16-a4f8-d95a9c3c4f13', name: 'older' };
  const database = new FakeQueryable([newer, older]);
  const repositories = await new RepositoryStore(database).list();

  assert.deepEqual(repositories.map((repository) => repository.name), ['newer', 'older']);
  assert.equal('external_id' in repositories[0], false);
  assert.equal('created_at' in repositories[0], false);
  assert.match(database.queries[0].text, /ORDER BY created_at DESC, id DESC/);
  assert.equal(database.queries[0].values, undefined);
});

test('@spec:AC-015 finds a repository by its UUID using a parameterized query', async () => {
  const database = new FakeQueryable([row]);
  const repository = await new RepositoryStore(database).findById(row.id);

  assert.equal(repository?.id, row.id);
  assert.equal(repository?.externalId, 'owner/repository');
  assert.match(database.queries[0].text, /WHERE id = \$1/);
  assert.deepEqual(database.queries[0].values, [row.id]);
});

test('@spec:AC-016 returns undefined when no repository has the requested UUID', async () => {
  const database = new FakeQueryable();
  const repository = await new RepositoryStore(database).findById('7c86a995-7bbb-4e7e-943d-eafdbfa3ecf9');

  assert.equal(repository, undefined);
});
