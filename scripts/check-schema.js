const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgres://postgres:5fc578abcbdf1f226aab@dpbdp1.easypanel.host:3245/servidor?sslmode=disable'
});

async function checkSchema() {
  try {
    // Lista todas as tabelas
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('📊 Tabelas encontradas:');
    tables.rows.forEach(table => {
      console.log(`- ${table.table_name}`);
    });

    // Se encontrar a tabela users, mostra sua estrutura
    const userTable = tables.rows.find(t => t.table_name === 'users');
    if (userTable) {
      const columns = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'users'
        ORDER BY ordinal_position;
      `);

      console.log('\n📋 Estrutura da tabela users:');
      columns.rows.forEach(column => {
        console.log(`- ${column.column_name} (${column.data_type}, ${column.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
    }
  } catch (error) {
    console.error('❌ Erro ao verificar schema:', error);
  } finally {
    await pool.end();
  }
}

checkSchema(); 