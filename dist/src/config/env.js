import { z } from 'zod';
const environmentSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
    DATABASE_URL: z.string().url(),
    REDIS_URL: z.string().url(),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
});
export class EnvironmentValidationError extends Error {
    fields;
    constructor(fields) {
        super(`Invalid environment configuration: ${fields.join(', ')}`);
        this.name = 'EnvironmentValidationError';
        this.fields = fields;
    }
}
export function loadEnv(environment = process.env) {
    const parsed = environmentSchema.safeParse(environment);
    if (!parsed.success) {
        const fields = [...new Set(parsed.error.issues.map((issue) => issue.path.join('.')))];
        throw new EnvironmentValidationError(fields);
    }
    return parsed.data;
}
