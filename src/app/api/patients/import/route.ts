import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parse } from 'csv-parse/sync';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the doctor's ID from the session user's email
    const doctor = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    });

    if (!doctor || doctor.role !== 'DOCTOR') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Read file content
    const fileContent = await file.text();
    
    // Parse CSV
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    // Validate CSV structure
    if (records.length === 0) {
      return NextResponse.json({ error: 'CSV file is empty' }, { status: 400 });
    }

    // Expected columns
    const requiredColumns = ['name', 'email'];
    const optionalColumns = ['phone', 'birthDate', 'gender', 'address', 'emergencyContact', 'emergencyPhone', 'medicalHistory', 'allergies', 'medications', 'notes'];
    const firstRecord = records[0];
    
    // Check if all required columns are present
    const missingColumns = requiredColumns.filter(col => !(col in firstRecord));
    if (missingColumns.length > 0) {
      return NextResponse.json({
        error: `Missing required columns: ${missingColumns.join(', ')}`
      }, { status: 400 });
    }

    // Process records
    const results = {
      success: 0,
      errors: [] as { row: number; email: string; error: string }[]
    };

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      try {
        // Check if patient already exists
        const existingPatient = await prisma.user.findFirst({
          where: {
            OR: [
              { email: record.email },
              { AND: [{ name: record.name }, { doctorId: doctor.id }] }
            ]
          }
        });

        if (existingPatient) {
          results.errors.push({
            row: i + 2, // +2 because CSV header is row 1
            email: record.email,
            error: 'Patient already exists'
          });
          continue;
        }

        // Create patient
        await prisma.user.create({
          data: {
            email: record.email,
            name: record.name,
            role: 'PATIENT',
            doctorId: doctor.id,
            phone: record.phone,
            birthDate: record.birthDate ? new Date(record.birthDate) : undefined,
            gender: record.gender,
            address: record.address,
            emergencyContact: record.emergencyContact,
            emergencyPhone: record.emergencyPhone,
            medicalHistory: record.medicalHistory,
            allergies: record.allergies,
            medications: record.medications,
            notes: record.notes
          }
        });

        results.success++;
      } catch (error) {
        console.error(`Error processing row ${i + 2}:`, error);
        results.errors.push({
          row: i + 2,
          email: record.email,
          error: 'Failed to create patient'
        });
      }
    }

    return NextResponse.json({
      message: `Successfully imported ${results.success} patients`,
      errors: results.errors
    });

  } catch (error) {
    console.error('Error importing patients:', error);
    return NextResponse.json(
      { error: 'Error importing patients' },
      { status: 500 }
    );
  }
} 