const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

// Configuração do banco de dados
const pool = new Pool({
  connectionString: "postgres://postgres:5fc578abcbdf1f226aab@dpbdp1.easypanel.host:3245/servidor?sslmode=disable"
});

async function runMigration() {
  try {
    // Lê o arquivo SQL
    const sqlPath = path.join(__dirname, '..', 'migrations', 'protocol_relationships.sql');
    const sqlContent = await fs.readFile(sqlPath, 'utf8');

    // Inicia uma transação
    const client = await pool.connect();
    
    try {
      console.log('Iniciando migração...');
      await client.query('BEGIN');

      // Executa o SQL
      await client.query(sqlContent);

      // Commit da transação
      await client.query('COMMIT');
      console.log('Migração concluída com sucesso!');
    } catch (error) {
      // Rollback em caso de erro
      await client.query('ROLLBACK');
      console.error('Erro durante a migração:', error);
      throw error;
    } finally {
      // Libera o cliente
      client.release();
    }
  } catch (error) {
    console.error('Erro ao executar migração:', error);
    process.exit(1);
  } finally {
    // Fecha a pool de conexões
    await pool.end();
  }
}

// Executa a migração
runMigration(); 