export class RepositoryAlreadyExistsError extends Error {
    url;
    code = 'REPOSITORY_ALREADY_EXISTS';
    constructor(url) {
        super('Repository already exists');
        this.url = url;
        this.name = 'RepositoryAlreadyExistsError';
    }
}
