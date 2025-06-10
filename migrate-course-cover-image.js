const { PrismaClient } = require('@prisma/client');
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);
const prisma = new PrismaClient();

async function migrateCourseSchema() {
  try {
    console.log('🚀 Iniciando migração completa: Course Cover Image');
    console.log('=' .repeat(50));
    
    // Passo 1: Verificar se a coluna já existe
    console.log('📋 Passo 1: Verificando estrutura atual...');
    const existingColumn = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'courses' 
      AND column_name = 'coverImage';
    `;
    
    if (existingColumn.length > 0) {
      console.log('⚠️  Campo coverImage já existe na tabela courses');
      console.log('✅ Migração já foi aplicada anteriormente');
      return;
    }
    
    // Passo 2: Adicionar a coluna coverImage
    console.log('📋 Passo 2: Adicionando campo coverImage...');
    await prisma.$executeRaw`
      ALTER TABLE courses 
      ADD COLUMN "coverImage" TEXT;
    `;
    console.log('✅ Campo coverImage adicionado com sucesso!');
    
    // Passo 3: Verificar a adição
    console.log('📋 Passo 3: Verificando a migração...');
    const verification = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'courses' 
      AND column_name = 'coverImage';
    `;
    
    if (verification.length > 0) {
      console.log('✅ Verificação bem-sucedida!');
      console.log('📊 Detalhes da coluna:', verification[0]);
    } else {
      throw new Error('Campo coverImage não foi encontrado após a migração');
    }
    
    // Passo 4: Regenerar o cliente Prisma
    console.log('📋 Passo 4: Regenerando cliente Prisma...');
    try {
      const { stdout, stderr } = await execAsync('npx prisma generate');
      if (stderr && !stderr.includes('warn')) {
        console.log('⚠️  Avisos do Prisma:', stderr);
      }
      console.log('✅ Cliente Prisma regenerado com sucesso!');
    } catch (generateError) {
      console.log('⚠️  Aviso: Erro ao regenerar cliente Prisma automaticamente');
      console.log('💡 Execute manualmente: npx prisma generate');
    }
    
    // Passo 5: Estatísticas finais
    console.log('📋 Passo 5: Coletando estatísticas...');
    const coursesCount = await prisma.course.count();
    const coursesWithThumbnail = await prisma.course.count({
      where: {
        thumbnail: {
          not: null
        }
      }
    });
    
    console.log('=' .repeat(50));
    console.log('📊 ESTATÍSTICAS FINAIS:');
    console.log(`📚 Total de cursos: ${coursesCount}`);
    console.log(`🖼️  Cursos com thumbnail: ${coursesWithThumbnail}`);
    console.log(`🆕 Cursos com coverImage: 0 (recém criado)`);
    
    if (coursesCount > 0) {
      console.log('');
      console.log('💡 PRÓXIMOS PASSOS:');
      console.log('1. Atualizar formulários de criação/edição de cursos');
      console.log('2. Adicionar campo coverImage nos componentes React');
      console.log('3. Implementar upload de imagens para coverImage');
      console.log('4. Atualizar cursos existentes com coverImage');
    }
    
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Função para atualizar um curso específico com coverImage
async function updateCourseCoverImage(courseId, coverImageUrl) {
  try {
    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: { coverImage: coverImageUrl }
    });
    
    console.log(`✅ Curso "${updatedCourse.title}" atualizado com coverImage`);
    return updatedCourse;
  } catch (error) {
    console.error(`❌ Erro ao atualizar curso ${courseId}:`, error);
    throw error;
  }
}

// Função para listar cursos sem coverImage
async function listCoursesWithoutCoverImage() {
  try {
    const courses = await prisma.course.findMany({
      where: {
        coverImage: null
      },
      select: {
        id: true,
        title: true,
        thumbnail: true,
        doctor: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });
    
    console.log('📋 Cursos sem coverImage:');
    courses.forEach((course, index) => {
      console.log(`${index + 1}. ${course.title} (ID: ${course.id})`);
      console.log(`   Doutor: ${course.doctor.name} (${course.doctor.email})`);
      console.log(`   Thumbnail: ${course.thumbnail || 'Não definido'}`);
      console.log('');
    });
    
    return courses;
  } catch (error) {
    console.error('❌ Erro ao listar cursos:', error);
    throw error;
  }
}

// Execução principal
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'migrate':
      migrateCourseSchema()
        .then(() => {
          console.log('🎉 Migração concluída com sucesso!');
          process.exit(0);
        })
        .catch((error) => {
          console.error('💥 Falha na migração:', error);
          process.exit(1);
        });
      break;
      
    case 'list':
      listCoursesWithoutCoverImage()
        .then(() => {
          process.exit(0);
        })
        .catch((error) => {
          console.error('💥 Erro:', error);
          process.exit(1);
        });
      break;
      
    case 'update':
      const courseId = process.argv[3];
      const coverImageUrl = process.argv[4];
      
      if (!courseId || !coverImageUrl) {
        console.log('❌ Uso: node migrate-course-cover-image.js update <courseId> <coverImageUrl>');
        process.exit(1);
      }
      
      updateCourseCoverImage(courseId, coverImageUrl)
        .then(() => {
          console.log('✅ Curso atualizado com sucesso!');
          process.exit(0);
        })
        .catch((error) => {
          console.error('💥 Erro:', error);
          process.exit(1);
        });
      break;
      
    default:
      console.log('📋 Comandos disponíveis:');
      console.log('  migrate - Executa a migração completa');
      console.log('  list    - Lista cursos sem coverImage');
      console.log('  update  - Atualiza coverImage de um curso específico');
      console.log('');
      console.log('Exemplos:');
      console.log('  node migrate-course-cover-image.js migrate');
      console.log('  node migrate-course-cover-image.js list');
      console.log('  node migrate-course-cover-image.js update curso123 https://example.com/image.jpg');
      break;
  }
}

module.exports = {
  migrateCourseSchema,
  updateCourseCoverImage,
  listCoursesWithoutCoverImage
}; 