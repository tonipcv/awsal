const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugPatient() {
  try {
    // Buscar o paciente com todos os relacionamentos
    const patient = await prisma.user.findUnique({
      where: { 
        email: 'xppsalvador@gmail.com'
      },
      include: {
        patientRelationships: {
          include: {
            doctor: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });
    
    console.log('=== PATIENT INFO ===');
    console.log('Patient:', {
      id: patient?.id,
      name: patient?.name,
      email: patient?.email,
      role: patient?.role
    });
    
    console.log('\n=== RELATIONSHIPS ===');
    patient?.patientRelationships.forEach((rel, index) => {
      console.log(`Relationship ${index + 1}:`, {
        id: rel.id,
        doctorId: rel.doctorId,
        doctorName: rel.doctor.name,
        doctorEmail: rel.doctor.email,
        isPrimary: rel.isPrimary,
        createdAt: rel.createdAt
      });
    });

    console.log('\n=== ALL DOCTORS ===');
    const allDoctors = await prisma.user.findMany({
      where: { role: 'DOCTOR' },
      select: {
        id: true,
        name: true,
        email: true
      }
    });
    
    allDoctors.forEach((doctor, index) => {
      console.log(`Doctor ${index + 1}:`, doctor);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugPatient(); 