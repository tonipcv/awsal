const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
  const prisma = new PrismaClient();

  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, '../prisma/migrations/20240322000000_add_welcome_and_success_fields.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Split SQL into individual commands
    const commands = sql
      .split(',')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0)
      .map(cmd => cmd.endsWith(';') ? cmd : `${cmd};`);

    // Execute each command separately
    for (const command of commands) {
      await prisma.$executeRawUnsafe(command);
      console.log('Executed:', command);
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error applying migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration(); 