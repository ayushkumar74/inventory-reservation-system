const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config();

async function runMigration() {
  // Use DIRECT_URL for migration. If DIRECT_URL fails, try DATABASE_URL
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  console.log('Connecting to database...');
  
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected successfully. Reading migration file...');
    
    const sql = fs.readFileSync('migrate_utf8.sql', 'utf8');
    
    console.log('Executing migration...');
    await client.query(sql);
    
    console.log('Migration executed successfully! All tables created.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.end();
  }
}

runMigration();
