const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addModalFieldsToCourse() {
  try {
    console.log('🚀 Starting migration to add modal fields to courses table...');

    // Check if the table exists and if modal fields already exist
    const result = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'courses' 
      AND column_name IN ('modalTitle', 'modalVideoUrl', 'modalDescription', 'modalButtonText', 'modalButtonUrl')
    `;

    if (result.length > 0) {
      console.log('✅ Modal fields already exist in courses table. Nothing to add.');
      console.log('Existing fields:', result.map(r => r.column_name));
      return;
    }

    console.log('📋 Adding modal fields to courses table...');

    // Add the modal fields one by one
    const fieldsToAdd = [
      { name: 'modalTitle', type: 'TEXT' },
      { name: 'modalVideoUrl', type: 'TEXT' },
      { name: 'modalDescription', type: 'TEXT' },
      { name: 'modalButtonText', type: 'TEXT DEFAULT \'Saber mais\'' },
      { name: 'modalButtonUrl', type: 'TEXT' }
    ];
    
    for (const field of fieldsToAdd) {
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE courses ADD COLUMN "${field.name}" ${field.type}`);
        console.log(`✅ Added column: ${field.name}`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⚠️  Column ${field.name} already exists, skipping...`);
        } else {
          console.error(`❌ Error adding column ${field.name}:`, error.message);
          throw error;
        }
      }
    }

    console.log('✅ Migration completed successfully!');
    console.log('📊 Courses table now has modal fields for unavailable course configuration');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
addModalFieldsToCourse()
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  }); 