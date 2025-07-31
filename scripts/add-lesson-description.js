// Script para adicionar a coluna description à tabela lessons
const { Pool } = require('pg');
require('dotenv').config();

async function addDescriptionColumn() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Conectando ao banco de dados...');
    
    // Verificar se a coluna já existe
    const checkResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'lessons' AND column_name = 'description';
    `);
    
    if (checkResult.rows.length > 0) {
      console.log('A coluna description já existe na tabela lessons.');
      return;
    }
    
    // Adicionar a coluna description
    console.log('Adicionando coluna description à tabela lessons...');
    await pool.query(`
      ALTER TABLE lessons 
      ADD COLUMN description TEXT;
    `);
    
    console.log('Coluna description adicionada com sucesso!');
    
    // Atualizar o Prisma schema
    console.log('Não se esqueça de atualizar o schema.prisma para incluir o novo campo:');
    console.log(`
model Lesson {
  id          String       @id(map: "Lesson_pkey") @default(cuid())
  title       String
  description String?      // Novo campo adicionado
  content     String?
  videoUrl    String?
  duration    Int?
  orderIndex  Int
  moduleId    String
  isPublished Boolean      @default(false)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @default(now()) @updatedAt
  module      Module       @relation(fields: [moduleId], references: [id], onDelete: Cascade, map: "Lesson_moduleId_fkey")
  progress    UserLesson[]

  @@map("lessons")
}
    `);
    
  } catch (error) {
    console.error('Erro ao adicionar coluna description:', error);
  } finally {
    await pool.end();
  }
}

addDescriptionColumn();
