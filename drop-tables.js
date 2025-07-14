const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgres://postgres:5fc578abcbdf1f226aab@dpbdp1.easypanel.host:3245/servidor?sslmode=disable'
});

const dropTables = async () => {
  try {
    await client.connect();
    
    // Drop tables in correct order (respecting foreign key constraints)
    const dropQueries = [
      'DROP TABLE IF EXISTS "Task" CASCADE;',
      'DROP TABLE IF EXISTS "Day" CASCADE;',
      'DROP TABLE IF EXISTS "Goal" CASCADE;',
      'DROP TABLE IF EXISTS "KeyResult" CASCADE;',
      'DROP TABLE IF EXISTS "Week" CASCADE;',
      'DROP TABLE IF EXISTS "Cycle" CASCADE;',
      'DROP TABLE IF EXISTS "DayProgress" CASCADE;',
      'DROP TABLE IF EXISTS "Habit" CASCADE;',
      'DROP TABLE IF EXISTS "EisenhowerTask" CASCADE;',
      'DROP TABLE IF EXISTS "Circle" CASCADE;',
      'DROP TABLE IF EXISTS "Checkpoint" CASCADE;',
      'DROP TABLE IF EXISTS "Thought" CASCADE;',
      'DROP TABLE IF EXISTS "PomodoroStar" CASCADE;'
    ];

    for (const query of dropQueries) {
      console.log(`Executing: ${query}`);
      await client.query(query);
      console.log('Success!');
    }

    console.log('All tables dropped successfully!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
};

dropTables(); 