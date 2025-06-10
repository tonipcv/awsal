const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addCoverImageToCourse() {
  try {
    console.log('🚀 Iniciando migração: Adicionando coverImage ao modelo Course...');
    
    // Executa o SQL diretamente para adicionar a coluna
    await prisma.$executeRaw`
      ALTER TABLE courses 
      ADD COLUMN IF NOT EXISTS "coverImage" TEXT;
    `;
    
    console.log('✅ Campo coverImage adicionado com sucesso à tabela courses!');
    
    // Verifica se a coluna foi criada
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'courses' 
      AND column_name = 'coverImage';
    `;
    
    if (result.length > 0) {
      console.log('✅ Verificação: Campo coverImage encontrado na tabela courses');
      console.log('📋 Detalhes da coluna:', result[0]);
    } else {
      console.log('❌ Erro: Campo coverImage não foi encontrado na tabela courses');
    }
    
    // Opcional: Atualizar alguns registros existentes com uma imagem padrão
    const coursesCount = await prisma.course.count();
    console.log(`📊 Total de cursos existentes: ${coursesCount}`);
    
    if (coursesCount > 0) {
      console.log('💡 Dica: Você pode agora atualizar os cursos existentes com coverImage através do painel admin');
    }
    
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executa a migração
addCoverImageToCourse()
  .then(() => {
    console.log('🎉 Migração concluída com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Falha na migração:', error);
    process.exit(1);
  }); 