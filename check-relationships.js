const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRelationships() {
  try {
    // Buscar todos os relacionamentos
    const relationships = await prisma.doctorPatientRelationship.findMany({
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        patient: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    console.log('\n=== ALL RELATIONSHIPS ===');
    relationships.forEach((rel, index) => {
      console.log(`\nRelationship ${index + 1}:`, {
        id: rel.id,
        isActive: rel.isActive,
        isPrimary: rel.isPrimary,
        createdAt: rel.createdAt,
        doctor: {
          id: rel.doctor.id,
          name: rel.doctor.name,
          email: rel.doctor.email
        },
        patient: {
          id: rel.patient.id,
          name: rel.patient.name,
          email: rel.patient.email
        }
      });
    });

    // Buscar relacionamentos inativos
    const inactiveRelationships = relationships.filter(rel => !rel.isActive);
    if (inactiveRelationships.length > 0) {
      console.log('\n=== INACTIVE RELATIONSHIPS ===');
      inactiveRelationships.forEach((rel, index) => {
        console.log(`\nInactive Relationship ${index + 1}:`, {
          id: rel.id,
          doctorName: rel.doctor.name,
          patientName: rel.patient.name
        });
      });
    }

    // Buscar relacionamentos sem isPrimary definido
    const undefinedPrimaryRelationships = relationships.filter(rel => rel.isPrimary === null || rel.isPrimary === undefined);
    if (undefinedPrimaryRelationships.length > 0) {
      console.log('\n=== RELATIONSHIPS WITHOUT isPrimary ===');
      undefinedPrimaryRelationships.forEach((rel, index) => {
        console.log(`\nUndefined Primary Relationship ${index + 1}:`, {
          id: rel.id,
          doctorName: rel.doctor.name,
          patientName: rel.patient.name
        });
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRelationships(); 