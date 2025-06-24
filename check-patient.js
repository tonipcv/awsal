const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPatient() {
  try {
    const patient = await prisma.user.findUnique({
      where: { 
        email: 'xppsalvador@gmail.com'
      },
      include: {
        patientRelationships: {
          include: {
            doctor: true
          }
        }
      }
    });
    
    console.log('Patient:', {
      id: patient?.id,
      name: patient?.name,
      email: patient?.email,
      role: patient?.role,
      relationships: patient?.patientRelationships.map(rel => ({
        id: rel.id,
        doctorId: rel.doctorId,
        doctorName: rel.doctor.name,
        isPrimary: rel.isPrimary
      }))
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPatient(); 