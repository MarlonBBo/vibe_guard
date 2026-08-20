import assert from 'node:assert/strict';
import test from 'node:test';

import {
  GitHubRepositoryRemoteError,
  GitHubRepositoryValidationError,
  inspectGitHubRepository,
} from '../src/modules/repositories/github-repository.js';

test('@spec:AC-010 canonicalizes a public GitHub URL and derives repository metadata without cloning', async () => {
  const inspectedUrls: string[] = [];
  const repository = await inspectGitHubRepository(
    { url: 'https://github.com/octo-org/vibe-guard.git/' },
    {
      lsRemote: async (url) => {
        inspectedUrls.push(url);
        return 'ref: refs/heads/main\tHEAD\n012345\tHEAD\n';
      },
    },
  );

  assert.deepEqual(repository, {
    url: 'https://github.com/octo-org/vibe-guard',
    name: 'vibe-guard',
    provider: 'github',
    externalId: 'octo-org/vibe-guard',
    defaultBranch: 'main',
  });
  assert.deepEqual(inspectedUrls, ['https://github.com/octo-org/vibe-guard']);
});

test('@spec:AC-011 rejects malformed bodies and non-canonical GitHub URLs before remote inspection', async () => {
  const cases: unknown[] = [
    undefined,
    {},
    { url: 'http://github.com/owner/repository' },
    { url: 'https://gitlab.com/owner/repository' },
    { url: 'https://github.com/owner/repository?ref=main' },
    { url: 'https://github.com/owner/repository/extra' },
    { url: 'https://user@github.com/owner/repository' },
  ];
  let remoteCalls = 0;

  for (const input of cases) {
    await assert.rejects(
      inspectGitHubRepository(input, { lsRemote: async () => { remoteCalls += 1; return ''; } }),
      GitHubRepositoryValidationError,
    );
  }

  assert.equal(remoteCalls, 0);
});

test('@spec:AC-012 reports an inaccessible repository when git cannot resolve its default branch', async () => {
  await assert.rejects(
    inspectGitHubRepository(
      { url: 'https://github.com/owner/missing' },
      { lsRemote: async () => { throw new Error('repository not found'); } },
    ),
    GitHubRepositoryRemoteError,
  );

  await assert.rejects(
    inspectGitHubRepository(
      { url: 'https://github.com/owner/empty' },
      { lsRemote: async () => 'deadbeef\tHEAD\n' },
    ),
    GitHubRepositoryRemoteError,
  );
});
