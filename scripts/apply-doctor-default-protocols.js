require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

// Configuração do banco de dados
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkDatabaseConnection() {
  const client = await pool.connect();
  try {
    console.log('🔍 Checking database connection...');
    const result = await client.query('SELECT current_database(), current_schema();');
    console.log('Connected to database:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('Error connecting to database:', error);
    return false;
  } finally {
    client.release();
  }
}

async function createTable(client) {
  console.log('📦 Creating table...');
  const sql = `
    CREATE TABLE IF NOT EXISTS doctor_default_protocols (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "doctorId" UUID NOT NULL,
      "protocolId" UUID NOT NULL,
      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_doctor FOREIGN KEY ("doctorId") REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_protocol FOREIGN KEY ("protocolId") REFERENCES protocols(id) ON DELETE CASCADE,
      CONSTRAINT unique_doctor_protocol UNIQUE ("doctorId", "protocolId")
    );

    COMMENT ON TABLE doctor_default_protocols IS 
    'Stores the default protocols that should be marked as unavailable for new patients of a doctor';
  `;
  
  await client.query(sql);
  console.log('✅ Table created successfully');
  
  // Atualiza as estatísticas da tabela
  await client.query('ANALYZE doctor_default_protocols;');
  console.log('✅ Table analyzed');
}

async function createIndexes(client) {
  console.log('📑 Creating indexes...');
  
  // Verifica se a tabela existe e tem a estrutura correta
  const tableInfo = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'doctor_default_protocols'
    ORDER BY ordinal_position;
  `);
  
  console.log('Current table structure:', tableInfo.rows);
  
  if (!tableInfo.rows.some(col => col.column_name === 'doctorId')) {
    throw new Error('Column doctorId does not exist in the table structure');
  }
  
  // Cria os índices
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_doctor_default_protocols_doctor_id 
    ON doctor_default_protocols("doctorId");
  `);
  console.log('✅ First index created');
  
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_doctor_default_protocols_protocol_id 
    ON doctor_default_protocols("protocolId");
  `);
  console.log('✅ Second index created');
}

async function verifyStructure(client) {
  console.log('🔍 Verifying final structure...');
  
  // Verifica a tabela
  const tableResult = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'doctor_default_protocols'
    ORDER BY ordinal_position;
  `);
  console.log('Table columns:', tableResult.rows);

  // Verifica os índices
  const indexResult = await client.query(`
    SELECT indexname, indexdef
    FROM pg_indexes
    WHERE tablename = 'doctor_default_protocols';
  `);
  console.log('Indexes:', indexResult.rows);
}

async function applyMigration() {
  // Verifica a conexão primeiro
  const isConnected = await checkDatabaseConnection();
  if (!isConnected) {
    console.error('❌ Could not connect to database');
    process.exit(1);
  }

  const client = await pool.connect();
  
  try {
    console.log('🔄 Starting migration...');
    
    // Primeira transação: cria a tabela
    await client.query('BEGIN');
    await createTable(client);
    await client.query('COMMIT');
    
    // Segunda transação: cria os índices
    await client.query('BEGIN');
    await createIndexes(client);
    await client.query('COMMIT');
    
    // Terceira transação: verifica a estrutura final
    await client.query('BEGIN');
    await verifyStructure(client);
    await client.query('COMMIT');
    
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    // Em caso de erro, reverte a transação atual
    await client.query('ROLLBACK');
    console.error('❌ Error applying migration:', error);
    throw error;
  } finally {
    // Sempre libera o cliente de volta para o pool
    client.release();
    await pool.end();
  }
}

// Executa a migração
applyMigration().catch((error) => {
  console.error('Failed to apply migration:', error);
  process.exit(1);
}); 