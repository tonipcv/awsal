const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuração do banco de dados
const pool = new Pool({
  connectionString: 'postgres://postgres:5fc578abcbdf1f226aab@dpbdp1.easypanel.host:3245/servidor?sslmode=disable'
});

async function createTables() {
  try {
    // Lê o arquivo SQL
    const sqlPath = path.join(__dirname, 'create-patient-documents-tables.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // Executa o SQL
    await pool.query(sqlContent);
    console.log('✅ Tabelas criadas com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error);
  } finally {
    // Fecha a conexão
    await pool.end();
  }
}

// Executa a função
createTables(); 