require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// Configuração do banco de dados
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function getDoctorId(client, email, password) {
  console.log('🔍 Finding doctor...');
  
  // Busca o médico pelo email
  const result = await client.query(`
    SELECT id, password FROM "User" 
    WHERE email = $1 AND role = 'DOCTOR'
  `, [email]);
  
  if (result.rows.length === 0) {
    throw new Error('Doctor not found');
  }
  
  // Verifica a senha
  const isValid = await bcrypt.compare(password, result.rows[0].password);
  if (!isValid) {
    throw new Error('Invalid password');
  }
  
  const doctorId = result.rows[0].id;
  console.log('✅ Doctor found:', doctorId);
  return doctorId;
}

async function getPatients(client, doctorId) {
  console.log('🔍 Finding patients...');
  
  const result = await client.query(`
    SELECT id, name, email 
    FROM "User" 
    WHERE "doctorId" = $1 AND role = 'PATIENT'
  `, [doctorId]);
  
  console.log(`✅ Found ${result.rows.length} patients`);
  return result.rows;
}

async function getDefaultProtocols(client, doctorId) {
  console.log('🔍 Finding default protocols...');
  
  const result = await client.query(`
    SELECT "protocolId" 
    FROM doctor_default_protocols 
    WHERE "doctorId" = $1
  `, [doctorId]);
  
  console.log(`✅ Found ${result.rows.length} default protocols`);
  return result.rows.map(row => row.protocolId);
}

async function applyDefaultProtocols(client, patientId, protocolIds) {
  console.log(`📝 Applying protocols to patient ${patientId}...`);
  
  // Para cada protocolo
  for (const protocolId of protocolIds) {
    // Verifica se o protocolo já está indisponível para o paciente
    const exists = await client.query(`
      SELECT 1 FROM "PatientProtocol" 
      WHERE "patientId" = $1 AND "protocolId" = $2 AND available = false
    `, [patientId, protocolId]);
    
    if (exists.rows.length === 0) {
      // Se não existe, cria um novo registro
      await client.query(`
        INSERT INTO "PatientProtocol" ("patientId", "protocolId", available, "createdAt", "updatedAt")
        VALUES ($1, $2, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT ("patientId", "protocolId") DO UPDATE 
        SET available = false, "updatedAt" = CURRENT_TIMESTAMP
      `, [patientId, protocolId]);
    }
  }
  
  console.log('✅ Protocols applied successfully');
}

async function applyToAllPatients() {
  const client = await pool.connect();
  
  try {
    // Inicia uma transação
    await client.query('BEGIN');
    
    // Encontra o médico
    const doctorId = await getDoctorId(client, 'medica@teste.com', '123456');
    
    // Busca os pacientes
    const patients = await getPatients(client, doctorId);
    if (patients.length === 0) {
      console.log('⚠️ No patients found');
      return;
    }
    
    // Busca os protocolos padrão
    const defaultProtocols = await getDefaultProtocols(client, doctorId);
    if (defaultProtocols.length === 0) {
      console.log('⚠️ No default protocols found');
      return;
    }
    
    // Aplica os protocolos para cada paciente
    console.log(`🔄 Applying protocols to ${patients.length} patients...`);
    for (const patient of patients) {
      await applyDefaultProtocols(client, patient.id, defaultProtocols);
    }
    
    // Confirma a transação
    await client.query('COMMIT');
    console.log('✅ All protocols applied successfully!');
  } catch (error) {
    // Em caso de erro, reverte a transação
    await client.query('ROLLBACK');
    console.error('❌ Error:', error);
    throw error;
  } finally {
    // Sempre libera o cliente de volta para o pool
    client.release();
    await pool.end();
  }
}

// Executa o script
applyToAllPatients().catch((error) => {
  console.error('Failed to apply protocols:', error);
  process.exit(1);
}); 