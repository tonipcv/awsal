const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkTables() {
  try {
    // Verificar tabelas existentes
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND table_name LIKE '%protocol%';
    `;
    
    const { rows: tables } = await pool.query(tablesQuery);
    console.log('Tabelas encontradas:', tables);

    // Verificar estrutura da tabela protocols
    const protocolsStructureQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'protocols';
    `;
    
    const { rows: protocolColumns } = await pool.query(protocolsStructureQuery);
    console.log('\nEstrutura da tabela protocols:', protocolColumns);

    // Contar registros em cada tabela
    for (const table of tables) {
      const countQuery = `SELECT COUNT(*) FROM "${table.table_name}";`;
      const { rows: count } = await pool.query(countQuery);
      console.log(`\nRegistros em ${table.table_name}:`, count[0].count);
    }

  } catch (error) {
    console.error('Erro ao verificar tabelas:', error);
  } finally {
    await pool.end();
  }
}

checkTables().catch(console.error); 