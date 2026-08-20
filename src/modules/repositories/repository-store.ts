import type { CreateRepositoryInput, Repository } from './repository.js';
import { RepositoryAlreadyExistsError } from './repository.js';

interface RepositoryRow {
  id: string;
  name: string;
  url: string;
  provider: string;
  external_id: string;
  default_branch: string;
  created_at: Date;
  updated_at: Date;
}

export interface Queryable {
  query<Row extends object>(text: string, values?: unknown[]): Promise<{ rows: Row[] }>;
}

interface PostgresError {
  code?: string;
  constraint?: string;
}

const repositoryColumns = `
  id,
  name,
  url,
  provider,
  external_id,
  default_branch,
  created_at,
  updated_at
`;

function mapRepository(row: RepositoryRow): Repository {
  return {
    id: row.id,
    name: row.name,
    url: row.url,
    provider: row.provider,
    externalId: row.external_id,
    defaultBranch: row.default_branch,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function isDuplicateCanonicalUrl(error: unknown): error is PostgresError {
  return typeof error === 'object'
    && error !== null
    && 'code' in error
    && (error as PostgresError).code === '23505'
    && (error as PostgresError).constraint === 'repositories_url_key';
}

export class RepositoryStore {
  constructor(private readonly database: Queryable) {}

  async create(input: CreateRepositoryInput): Promise<Repository> {
    try {
      const result = await this.database.query<RepositoryRow>(
        `INSERT INTO repositories (
          name,
          url,
          provider,
          external_id,
          default_branch
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING ${repositoryColumns}`,
        [input.name, input.url, input.provider, input.externalId, input.defaultBranch],
      );

      return mapRepository(result.rows[0]);
    } catch (error) {
      if (isDuplicateCanonicalUrl(error)) {
        throw new RepositoryAlreadyExistsError(input.url);
      }

      throw error;
    }
  }

  async list(): Promise<Repository[]> {
    const result = await this.database.query<RepositoryRow>(
      `SELECT ${repositoryColumns}
       FROM repositories
       ORDER BY created_at DESC, id DESC`,
    );

    return result.rows.map(mapRepository);
  }

  async findById(id: string): Promise<Repository | undefined> {
    const result = await this.database.query<RepositoryRow>(
      `SELECT ${repositoryColumns}
       FROM repositories
       WHERE id = $1`,
      [id],
    );

    const row = result.rows[0];
    return row === undefined ? undefined : mapRepository(row);
  }
}
