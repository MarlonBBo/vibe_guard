export interface Repository {
  id: string;
  name: string;
  url: string;
  provider: string;
  externalId: string;
  defaultBranch: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRepositoryInput {
  name: string;
  url: string;
  provider: string;
  externalId: string;
  defaultBranch: string;
}

export class RepositoryAlreadyExistsError extends Error {
  readonly code = 'REPOSITORY_ALREADY_EXISTS';

  constructor(readonly url: string) {
    super('Repository already exists');
    this.name = 'RepositoryAlreadyExistsError';
  }
}
