const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestUsers() {
  // Create test doctor
  const doctor = await prisma.user.create({
    data: {
      email: 'testdoctor@example.com',
      name: 'Test Doctor',
      role: 'DOCTOR',
    }
  });

  // Create test patients
  const patient1 = await prisma.user.create({
    data: {
      email: 'testpatient1@example.com',
      name: 'Test Patient 1',
      role: 'PATIENT',
    }
  });

  const patient2 = await prisma.user.create({
    data: {
      email: 'testpatient2@example.com',
      name: 'Test Patient 2',
      role: 'PATIENT',
    }
  });

  return { doctor, patient1, patient2 };
}

async function createTestClinic(doctorId) {
  return await prisma.clinic.create({
    data: {
      name: 'Test Clinic',
      ownerId: doctorId,
    }
  });
}

async function testDoctorPatientRelationships() {
  try {
    console.log('Starting doctor-patient relationship tests...');

    // Create test users
    const { doctor, patient1, patient2 } = await createTestUsers();
    console.log('Created test users');

    // Create test clinic
    const clinic = await createTestClinic(doctor.id);
    console.log('Created test clinic');

    // Create relationships
    const relationship1 = await prisma.doctorPatientRelationship.create({
      data: {
        patientId: patient1.id,
        doctorId: doctor.id,
        clinicId: clinic.id,
        isPrimary: true,
        speciality: 'General Medicine',
        notes: 'Test relationship 1'
      },
      include: {
        patient: true,
        doctor: true,
        clinic: true
      }
    });
    console.log('Created first relationship:', relationship1);

    const relationship2 = await prisma.doctorPatientRelationship.create({
      data: {
        patientId: patient2.id,
        doctorId: doctor.id,
        clinicId: clinic.id,
        isPrimary: false,
        speciality: 'Cardiology',
        notes: 'Test relationship 2'
      },
      include: {
        patient: true,
        doctor: true,
        clinic: true
      }
    });
    console.log('Created second relationship:', relationship2);

    // List all relationships
    const relationships = await prisma.doctorPatientRelationship.findMany({
      where: {
        doctorId: doctor.id
      },
      include: {
        patient: true,
        doctor: true,
        clinic: true
      }
    });
    console.log('Found relationships:', relationships);

    // Test updating a relationship
    const updatedRelationship = await prisma.doctorPatientRelationship.update({
      where: {
        id: relationship1.id
      },
      data: {
        notes: 'Updated test relationship 1',
        speciality: 'Updated Specialty'
      },
      include: {
        patient: true,
        doctor: true,
        clinic: true
      }
    });
    console.log('Updated relationship:', updatedRelationship);

    // Cleanup test data
    await prisma.doctorPatientRelationship.deleteMany({
      where: {
        OR: [
          { id: relationship1.id },
          { id: relationship2.id }
        ]
      }
    });
    await prisma.clinic.delete({
      where: { id: clinic.id }
    });
    await prisma.user.deleteMany({
      where: {
        OR: [
          { id: doctor.id },
          { id: patient1.id },
          { id: patient2.id }
        ]
      }
    });
    console.log('Cleaned up test data');

    console.log('All tests completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDoctorPatientRelationships(); 