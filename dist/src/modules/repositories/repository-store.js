import { RepositoryAlreadyExistsError } from './repository.js';
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
function mapRepository(row) {
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
function isDuplicateCanonicalUrl(error) {
    return typeof error === 'object'
        && error !== null
        && 'code' in error
        && error.code === '23505'
        && error.constraint === 'repositories_url_key';
}
export class RepositoryStore {
    database;
    constructor(database) {
        this.database = database;
    }
    async create(input) {
        try {
            const result = await this.database.query(`INSERT INTO repositories (
          name,
          url,
          provider,
          external_id,
          default_branch
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING ${repositoryColumns}`, [input.name, input.url, input.provider, input.externalId, input.defaultBranch]);
            return mapRepository(result.rows[0]);
        }
        catch (error) {
            if (isDuplicateCanonicalUrl(error)) {
                throw new RepositoryAlreadyExistsError(input.url);
            }
            throw error;
        }
    }
    async list() {
        const result = await this.database.query(`SELECT ${repositoryColumns}
       FROM repositories
       ORDER BY created_at DESC, id DESC`);
        return result.rows.map(mapRepository);
    }
    async findById(id) {
        const result = await this.database.query(`SELECT ${repositoryColumns}
       FROM repositories
       WHERE id = $1`, [id]);
        const row = result.rows[0];
        return row === undefined ? undefined : mapRepository(row);
    }
}
