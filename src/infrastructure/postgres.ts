import { Pool } from 'pg';

export interface PostgresConnection {
  connect(): Promise<void>;
  ping(): Promise<void>;
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
    async close(): Promise<void> {
      await pool.end();
    },
  };
}
