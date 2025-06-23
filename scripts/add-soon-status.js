const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Atualizar os protocolos que têm data de consulta futura para SOON
    await prisma.$executeRaw`
      UPDATE "UserProtocol"
      SET status = 'SOON'
      WHERE "consultationDate" > NOW()
      AND status = 'ACTIVE'
    `;
    console.log('✅ Updated protocols with future consultation date to SOON status');

    // Criar uma trigger para atualizar o status automaticamente
    await prisma.$executeRaw`
      CREATE OR REPLACE FUNCTION update_protocol_status()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW."consultationDate" IS NOT NULL AND NEW."consultationDate" > NOW() THEN
          NEW.status = 'SOON';
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `;
    console.log('✅ Created function to update protocol status');

    await prisma.$executeRaw`
      DROP TRIGGER IF EXISTS update_protocol_status_trigger ON "UserProtocol";
    `;
    console.log('✅ Dropped existing trigger if any');

    await prisma.$executeRaw`
      CREATE TRIGGER update_protocol_status_trigger
      BEFORE INSERT OR UPDATE ON "UserProtocol"
      FOR EACH ROW
      EXECUTE FUNCTION update_protocol_status();
    `;
    console.log('✅ Created trigger to automatically update status to SOON');

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 