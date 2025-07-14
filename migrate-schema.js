const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgres://postgres:5fc578abcbdf1f226aab@dpbdp1.easypanel.host:3245/servidor?sslmode=disable'
});

const migrateSchema = async () => {
  try {
    await client.connect();
    
    // Remove referências nas tabelas existentes
    const alterQueries = [
      // Remover colunas da tabela User que fazem referência aos modelos removidos
      `ALTER TABLE IF EXISTS "User" 
       DROP COLUMN IF EXISTS "cycles" CASCADE,
       DROP COLUMN IF EXISTS "circles" CASCADE,
       DROP COLUMN IF EXISTS "checkpoints" CASCADE,
       DROP COLUMN IF EXISTS "eisenhowerTasks" CASCADE,
       DROP COLUMN IF EXISTS "habits" CASCADE,
       DROP COLUMN IF EXISTS "pomodoroStars" CASCADE,
       DROP COLUMN IF EXISTS "thoughts" CASCADE;`,

      // Remover tabela de migração do Prisma se existir
      'DROP TABLE IF EXISTS "_prisma_migrations" CASCADE;',
      
      // Criar nova tabela de migração
      `CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
        "id" VARCHAR(36) PRIMARY KEY,
        "checksum" VARCHAR(64) NOT NULL,
        "finished_at" TIMESTAMP WITH TIME ZONE,
        "migration_name" VARCHAR(255) NOT NULL,
        "logs" TEXT,
        "rolled_back_at" TIMESTAMP WITH TIME ZONE,
        "started_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "applied_steps_count" INTEGER NOT NULL DEFAULT 0
      );`,

      // Inserir registro da migração
      `INSERT INTO "_prisma_migrations" (
        "id",
        "checksum",
        "migration_name",
        "logs",
        "finished_at",
        "applied_steps_count"
      ) VALUES (
        '${generateUUID()}',
        '${generateChecksum()}',
        'remove_unused_models_${new Date().toISOString()}',
        'Removed unused models and their references',
        NOW(),
        1
      );`
    ];

    for (const query of alterQueries) {
      console.log(`Executing migration query:`);
      console.log(query);
      await client.query(query);
      console.log('Success!\n');
    }

    console.log('Schema migration completed successfully!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
};

// Função auxiliar para gerar UUID v4
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Função auxiliar para gerar checksum
function generateChecksum() {
  const timestamp = new Date().getTime().toString();
  return require('crypto')
    .createHash('sha256')
    .update(timestamp)
    .digest('hex')
    .substring(0, 64);
}

migrateSchema(); 