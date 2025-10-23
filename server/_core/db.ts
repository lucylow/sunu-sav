import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from '../../drizzle/schema';

let db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!db) {
    const connection = await mysql.createConnection({
      uri: process.env.DATABASE_URL || 'mysql://root@localhost:3306/sunusav',
    });
    
    db = drizzle(connection, { schema });
  }
  
  return db;
}

export { schema };
