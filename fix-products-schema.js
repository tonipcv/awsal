const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixProductsSchema() {
  try {
    console.log('🔧 Iniciando correção do schema de produtos...');
    
    // 1. Primeiro, vamos verificar se a coluna já existe
    const result = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' AND column_name = 'doctorId';
    `;
    
    if (result.length > 0) {
      console.log('✅ Campo doctorId já existe na tabela products');
      return;
    }
    
    console.log('📝 Adicionando campo doctorId à tabela products...');
    
    // 2. Adicionar a coluna doctorId (nullable inicialmente)
    await prisma.$executeRaw`
      ALTER TABLE products 
      ADD COLUMN "doctorId" TEXT;
    `;
    
    console.log('✅ Campo doctorId adicionado com sucesso');
    
    // 3. Verificar se existem produtos sem doctorId
    const productsWithoutDoctor = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM products WHERE "doctorId" IS NULL;
    `;
    
    const count = Number(productsWithoutDoctor[0].count);
    console.log(`📊 Encontrados ${count} produtos sem doctorId`);
    
    if (count > 0) {
      // 4. Buscar o primeiro médico ativo para atribuir aos produtos órfãos
      const firstDoctor = await prisma.user.findFirst({
        where: { role: 'DOCTOR', isActive: true }
      });
      
      if (firstDoctor) {
        console.log(`👨‍⚕️ Atribuindo produtos órfãos ao médico: ${firstDoctor.name} (${firstDoctor.id})`);
        
        await prisma.$executeRaw`
          UPDATE products 
          SET "doctorId" = ${firstDoctor.id}
          WHERE "doctorId" IS NULL;
        `;
        
        console.log('✅ Produtos órfãos atribuídos com sucesso');
      } else {
        console.log('⚠️  Nenhum médico encontrado. Produtos ficarão sem doctorId por enquanto.');
      }
    }
    
    // 5. Adicionar índice para performance
    console.log('📈 Adicionando índice para doctorId...');
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "products_doctorId_idx" ON products("doctorId");
    `;
    
    console.log('✅ Índice adicionado com sucesso');
    
    // 6. Adicionar foreign key constraint
    console.log('🔗 Adicionando constraint de foreign key...');
    await prisma.$executeRaw`
      ALTER TABLE products 
      ADD CONSTRAINT "products_doctorId_fkey" 
      FOREIGN KEY ("doctorId") REFERENCES "User"(id) ON DELETE CASCADE;
    `;
    
    console.log('✅ Foreign key constraint adicionada com sucesso');
    
    console.log('🎉 Correção do schema de produtos concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao corrigir schema de produtos:', error);
    
    // Se der erro na foreign key, pode ser que ainda existam produtos sem doctorId
    if (error.message.includes('foreign key constraint')) {
      console.log('🔄 Tentando corrigir produtos sem doctorId...');
      
      const firstDoctor = await prisma.user.findFirst({
        where: { role: 'DOCTOR', isActive: true }
      });
      
      if (firstDoctor) {
        await prisma.$executeRaw`
          UPDATE products 
          SET "doctorId" = ${firstDoctor.id}
          WHERE "doctorId" IS NULL;
        `;
        
        console.log('✅ Produtos corrigidos. Tente executar o script novamente.');
      }
    }
    
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  fixProductsSchema()
    .then(() => {
      console.log('✅ Script executado com sucesso');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro na execução:', error);
      process.exit(1);
    });
}

module.exports = { fixProductsSchema }; 