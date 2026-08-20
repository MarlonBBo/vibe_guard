import { Pool } from 'pg';
export function createPostgresConnection(connectionString) {
    const pool = new Pool({ connectionString });
    return {
        async connect() {
            await pool.query('SELECT 1');
        },
        async ping() {
            await pool.query('SELECT 1');
        },
        async query(text, values) {
            const result = await pool.query(text, values);
            return { rows: result.rows };
        },
        async close() {
            await pool.end();
        },
    };
}
