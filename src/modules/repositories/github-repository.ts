import { execFile } from 'node:child_process';

import { z } from 'zod';

const GIT_TIMEOUT_MS = 10_000;
const GIT_MAX_BUFFER_BYTES = 1024 * 1024;

const createRepositorySchema = z.object({
  url: z.string().min(1),
}).strict();

export interface GitHubRepository {
  url: string;
  name: string;
  provider: 'github';
  externalId: string;
  defaultBranch: string;
}

export interface GitHubRepositoryInspectorDependencies {
  lsRemote?: (url: string) => Promise<string>;
}

export class GitHubRepositoryValidationError extends Error {
  public constructor() {
    super('Repository URL must be a valid GitHub HTTPS URL.');
    this.name = 'GitHubRepositoryValidationError';
  }
}

export class GitHubRepositoryRemoteError extends Error {
  public constructor() {
    super('GitHub repository is inaccessible or has no resolvable default branch.');
    this.name = 'GitHubRepositoryRemoteError';
  }
}

export function canonicalizeGitHubRepositoryUrl(input: unknown): Omit<GitHubRepository, 'defaultBranch'> {
  const parsed = createRepositorySchema.safeParse(input);
  if (!parsed.success) {
    throw new GitHubRepositoryValidationError();
  }

  let candidate: URL;
  try {
    candidate = new URL(parsed.data.url);
  } catch {
    throw new GitHubRepositoryValidationError();
  }

  if (
    candidate.protocol !== 'https:'
    || candidate.host !== 'github.com'
    || candidate.username !== ''
    || candidate.password !== ''
    || candidate.search !== ''
    || candidate.hash !== ''
  ) {
    throw new GitHubRepositoryValidationError();
  }

  const pathSegments = candidate.pathname.split('/').filter(Boolean);
  if (pathSegments.length !== 2 || pathSegments.some((segment) => segment.includes('%'))) {
    throw new GitHubRepositoryValidationError();
  }

  const [owner, rawName] = pathSegments;
  const name = rawName.endsWith('.git') ? rawName.slice(0, -4) : rawName;
  if (!owner || !name) {
    throw new GitHubRepositoryValidationError();
  }

  const externalId = `${owner}/${name}`;
  return {
    url: `https://github.com/${externalId}`,
    name,
    provider: 'github',
    externalId,
  };
}

export async function inspectGitHubRepository(
  input: unknown,
  dependencies: GitHubRepositoryInspectorDependencies = {},
): Promise<GitHubRepository> {
  const repository = canonicalizeGitHubRepositoryUrl(input);

  let output: string;
  try {
    output = await (dependencies.lsRemote ?? gitLsRemote)(repository.url);
  } catch {
    throw new GitHubRepositoryRemoteError();
  }

  const defaultBranch = parseDefaultBranch(output);
  if (!defaultBranch) {
    throw new GitHubRepositoryRemoteError();
  }

  return { ...repository, defaultBranch };
}

export function parseDefaultBranch(lsRemoteOutput: string): string | undefined {
  const match = /^ref: refs\/heads\/(.+)\tHEAD$/m.exec(lsRemoteOutput);
  return match?.[1] || undefined;
}

function gitLsRemote(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(
      'git',
      ['ls-remote', '--symref', url, 'HEAD'],
      {
        shell: false,
        timeout: GIT_TIMEOUT_MS,
        maxBuffer: GIT_MAX_BUFFER_BYTES,
        windowsHide: true,
        encoding: 'utf8',
      },
      (error, stdout) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(stdout);
      },
    );
  });
}
