import { Router, type Request, type Response } from 'express';
import type { Logger } from 'pino';

import {
  GitHubRepositoryRemoteError,
  GitHubRepositoryValidationError,
  inspectGitHubRepository,
  type GitHubRepository,
} from './github-repository.js';
import { RepositoryAlreadyExistsError, type Repository } from './repository.js';
import { type RepositoryStore } from './repository-store.js';
import { createRepositoryRequestSchema, repositoryIdParamSchema } from './repository-schemas.js';

interface RepositoryStorePort {
  create(input: GitHubRepository): Promise<Repository>;
  list(): Promise<Repository[]>;
  findById(id: string): Promise<Repository | undefined>;
}

export interface RepositoriesRouterDependencies {
  store: RepositoryStore | RepositoryStorePort;
  inspect?: (input: unknown) => Promise<GitHubRepository>;
  logger: Logger;
}

const errors = {
  validation: { code: 'VALIDATION_ERROR', message: 'Request validation failed.' },
  remote: { code: 'REPOSITORY_UNREACHABLE', message: 'Repository is inaccessible or has no resolvable default branch.' },
  duplicate: { code: 'REPOSITORY_ALREADY_EXISTS', message: 'Repository already exists.' },
  notFound: { code: 'REPOSITORY_NOT_FOUND', message: 'Repository was not found.' },
  internal: { code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error.' },
} as const;

function publicRepository(repository: Repository): Repository {
  return repository;
}

function respondError(response: Response, status: number, error: { code: string; message: string }): void {
  response.status(status).json({ error });
}

function logAndRespondInternal(response: Response, logger: Logger, error: unknown): void {
  logger.error({ err: error }, 'Repository API request failed');
  respondError(response, 500, errors.internal);
}

export function createRepositoriesRouter(dependencies: RepositoriesRouterDependencies): Router {
  const router = Router();
  const inspect = dependencies.inspect ?? inspectGitHubRepository;

  router.post('/', async (request: Request, response: Response) => {
    const parsed = createRepositoryRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      respondError(response, 400, errors.validation);
      return;
    }

    try {
      const inspected = await inspect(parsed.data);
      const repository = await dependencies.store.create(inspected);
      response.status(201).json(publicRepository(repository));
    } catch (error) {
      if (error instanceof GitHubRepositoryValidationError) {
        respondError(response, 400, errors.validation);
        return;
      }
      if (error instanceof GitHubRepositoryRemoteError) {
        respondError(response, 422, errors.remote);
        return;
      }
      if (error instanceof RepositoryAlreadyExistsError) {
        respondError(response, 409, errors.duplicate);
        return;
      }
      logAndRespondInternal(response, dependencies.logger, error);
    }
  });

  router.get('/', async (_request: Request, response: Response) => {
    try {
      response.status(200).json((await dependencies.store.list()).map(publicRepository));
    } catch (error) {
      logAndRespondInternal(response, dependencies.logger, error);
    }
  });

  router.get('/:id', async (request: Request, response: Response) => {
    const parsed = repositoryIdParamSchema.safeParse(request.params);
    if (!parsed.success) {
      respondError(response, 400, errors.validation);
      return;
    }

    try {
      const repository = await dependencies.store.findById(parsed.data.id);
      if (!repository) {
        respondError(response, 404, errors.notFound);
        return;
      }
      response.status(200).json(publicRepository(repository));
    } catch (error) {
      logAndRespondInternal(response, dependencies.logger, error);
    }
  });

  return router;
}

export function createJsonBodyErrorHandler(logger: Logger) {
  return (error: unknown, _request: Request, response: Response, next: (error: unknown) => void): void => {
    if (error instanceof SyntaxError && 'body' in error) {
      respondError(response, 400, errors.validation);
      return;
    }
    if (response.headersSent) {
      next(error);
      return;
    }
    logAndRespondInternal(response, logger, error);
  };
}
