import { Pool } from 'pg';

export interface PostgresConnection {
  connect(): Promise<void>;
  ping(): Promise<void>;
  query<Row extends object>(text: string, values?: unknown[]): Promise<{ rows: Row[] }>;
  close(): Promise<void>;
}

export function createPostgresConnection(connectionString: string): PostgresConnection {
  const pool = new Pool({ connectionString });

  return {
    async connect(): Promise<void> {
      await pool.query('SELECT 1');
    },
    async ping(): Promise<void> {
      await pool.query('SELECT 1');
    },
    async query<Row extends object>(text: string, values?: unknown[]): Promise<{ rows: Row[] }> {
      const result = await pool.query<Row>(text, values);
      return { rows: result.rows };
    },
    async close(): Promise<void> {
      await pool.end();
    },
  };
}
