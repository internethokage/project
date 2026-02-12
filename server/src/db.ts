import crypto from 'crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

let poolPromise: Promise<pg.Pool> | null = null;

function createPostgresPool(): pg.Pool {
  const pool = new pg.Pool({
    host: process.env.DATABASE_HOST || 'postgres',
    port: Number(process.env.DATABASE_PORT) || 5432,
    database: process.env.DATABASE_NAME || 'giftable',
    user: process.env.DATABASE_USER || 'giftable',
    password: process.env.DATABASE_PASSWORD || 'giftable',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  pool.on('error', (err) => {
    console.error('Unexpected pool error:', err);
  });

  return pool;
}

async function createInMemoryPool(): Promise<pg.Pool> {
  const { newDb, DataType } = await import('pg-mem');

  const db = newDb({ autoCreateForeignKeyIndices: true });
  db.public.registerFunction({
    name: 'uuid_generate_v4',
    returns: DataType.uuid,
    impure: true,
    implementation: () => crypto.randomUUID(),
  });

  const schemaPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../db/init.sql');
  const schemaSql = await fs.readFile(schemaPath, 'utf8');
  const schemaWithoutExtensions = schemaSql
    .split('\n')
    .filter((line) => !line.trim().toUpperCase().startsWith('CREATE EXTENSION'))
    .join('\n');

  db.public.none(schemaWithoutExtensions);

  const { Pool } = db.adapters.createPg();
  const pool = new Pool();

  pool.on('error', (err: Error) => {
    console.error('Unexpected in-memory pool error:', err);
  });

  return pool;
}

async function getPool(): Promise<pg.Pool> {
  if (!poolPromise) {
    poolPromise = process.env.DATABASE_IN_MEMORY === 'true'
      ? createInMemoryPool()
      : Promise.resolve(createPostgresPool());
  }

  return poolPromise;
}

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params: readonly unknown[] = []
): Promise<pg.QueryResult<T>> {
  const pool = await getPool();
  return pool.query<T>(text, [...params]);
}

export async function getClient(): Promise<pg.PoolClient> {
  const pool = await getPool();
  return pool.connect();
}

export async function testConnection(): Promise<boolean> {
  try {
    await query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}
