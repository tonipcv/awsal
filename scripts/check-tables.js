const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkAllTables() {
  try {
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    
    const { rows: tables } = await pool.query(tablesQuery);
    console.log('Todas as tabelas:', tables);

  } catch (error) {
    console.error('Erro ao verificar tabelas:', error);
  } finally {
    await pool.end();
  }
}

checkAllTables().catch(console.error); 