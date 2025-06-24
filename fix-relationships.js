const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixRelationships() {
  try {
    // Buscar todos os pacientes com múltiplos relacionamentos primários
    const patients = await prisma.user.findMany({
      where: {
        role: 'PATIENT',
        patientRelationships: {
          some: {
            isPrimary: true
          }
        }
      },
      include: {
        patientRelationships: {
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    });

    console.log(`Found ${patients.length} patients to fix`);

    for (const patient of patients) {
      const relationships = patient.patientRelationships;
      if (relationships.filter(r => r.isPrimary).length > 1) {
        console.log(`Fixing relationships for patient ${patient.name} (${patient.email})`);
        
        // Manter apenas o primeiro relacionamento como primário
        await prisma.$transaction(
          relationships.map((rel, index) => 
            prisma.doctorPatientRelationship.update({
              where: { id: rel.id },
              data: { isPrimary: index === 0 }
            })
          )
        );
      }
    }

    console.log('Relationships fixed successfully');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixRelationships(); 