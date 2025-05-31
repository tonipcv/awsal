const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixClinicNames() {
  try {
    console.log('🔍 Searching for clinics to fix...');
    
    // Get all clinics
    const clinics = await prisma.clinic.findMany({
      include: {
        owner: true
      }
    });

    console.log(`📋 Found ${clinics.length} clinics`);

    for (const clinic of clinics) {
      let needsUpdate = false;
      let newName = clinic.name;
      let newDescription = clinic.description;

      // Fix name: remove "Clínica" and duplicate "Dr."
      if (clinic.name.includes('Clínica Dr.')) {
        // Extract doctor name from current name
        const doctorName = clinic.owner.name || 'Doctor';
        newName = `${doctorName} Clinic`;
        needsUpdate = true;
        console.log(`📝 Fixing name: "${clinic.name}" → "${newName}"`);
      }

      // Fix description: translate to English and remove duplicate "Dr."
      if (clinic.description && clinic.description.includes('Clínica pessoal do Dr(a).')) {
        const doctorName = clinic.owner.name || 'Doctor';
        newDescription = `Personal clinic of ${doctorName}`;
        needsUpdate = true;
        console.log(`📝 Fixing description: "${clinic.description}" → "${newDescription}"`);
      }

      // Update if needed
      if (needsUpdate) {
        await prisma.clinic.update({
          where: { id: clinic.id },
          data: {
            name: newName,
            description: newDescription
          }
        });
        console.log(`✅ Updated clinic: ${clinic.id}`);
      }
    }

    console.log('🎉 All clinic names and descriptions fixed!');

  } catch (error) {
    console.error('❌ Error fixing clinic names:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixClinicNames(); 