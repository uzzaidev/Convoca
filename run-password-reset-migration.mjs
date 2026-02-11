// Script to run the password reset migration
import { sql } from './src/db/client.ts';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  try {
    console.log('🔄 Running password reset migration...');
    
    const migrationPath = path.join(__dirname, 'src', 'db', 'migrations', '20260211_add_password_reset_fields.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    await sql.unsafe(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    console.log('✅ Added reset_token and reset_token_expiry fields to users table');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
