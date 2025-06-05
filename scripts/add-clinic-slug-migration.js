const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Função para gerar slug a partir do nome
function generateSlug(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '-') // Substitui espaços por hífens
    .replace(/-+/g, '-') // Remove hífens duplicados
    .replace(/^-|-$/g, ''); // Remove hífens do início e fim
}

// Função para garantir slug único
async function ensureUniqueSlug(baseSlug, excludeId = null) {
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    const existing = await prisma.clinic.findFirst({
      where: {
        slug: slug,
        ...(excludeId && { id: { not: excludeId } })
      }
    });
    
    if (!existing) {
      return slug;
    }
    
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

async function runMigration() {
  console.log('🚀 Iniciando migração: Adicionando campo slug às clínicas...');
  
  try {
    // 1. Adicionar coluna slug (se não existir)
    console.log('📝 Adicionando coluna slug...');
    await prisma.$executeRaw`
      ALTER TABLE clinics 
      ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE;
    `;
    
    // 2. Criar índice (se não existir)
    console.log('📝 Criando índice para slug...');
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "clinics_slug_idx" ON "clinics"("slug");
    `;
    
    // 3. Buscar clínicas sem slug
    console.log('🔍 Buscando clínicas existentes...');
    const clinics = await prisma.clinic.findMany({
      where: {
        slug: null
      },
      select: {
        id: true,
        name: true
      }
    });
    
    console.log(`📊 Encontradas ${clinics.length} clínicas sem slug`);
    
    // 4. Gerar slugs para clínicas existentes
    if (clinics.length > 0) {
      console.log('🔧 Gerando slugs únicos...');
      
      for (const clinic of clinics) {
        const baseSlug = generateSlug(clinic.name);
        const uniqueSlug = await ensureUniqueSlug(baseSlug, clinic.id);
        
        await prisma.clinic.update({
          where: { id: clinic.id },
          data: { slug: uniqueSlug }
        });
        
        console.log(`✅ Clínica "${clinic.name}" -> slug: "${uniqueSlug}"`);
      }
    }
    
    // 5. Verificar resultado
    const totalClinics = await prisma.clinic.count();
    const clinicsWithSlug = await prisma.clinic.count({
      where: {
        slug: { not: null }
      }
    });
    
    console.log('\n📈 Resultado da migração:');
    console.log(`   Total de clínicas: ${totalClinics}`);
    console.log(`   Clínicas com slug: ${clinicsWithSlug}`);
    console.log(`   Sucesso: ${clinicsWithSlug === totalClinics ? '✅' : '❌'}`);
    
    if (clinicsWithSlug === totalClinics) {
      console.log('\n🎉 Migração concluída com sucesso!');
    } else {
      console.log('\n⚠️  Algumas clínicas ainda não possuem slug');
    }
    
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar migração
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('✨ Migração finalizada');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Falha na migração:', error);
      process.exit(1);
    });
}

module.exports = { runMigration, generateSlug, ensureUniqueSlug }; 