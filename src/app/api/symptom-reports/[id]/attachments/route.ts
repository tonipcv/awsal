import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { NextRequest } from 'next/server';

// POST /api/symptom-reports/[id]/attachments - Upload attachment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const resolvedParams = await params;
    const reportId = resolvedParams.id;

    // Verify symptom report exists and user has access
    const symptomReport = await prisma.symptomReport.findFirst({
      where: {
        id: reportId,
        userId: session.user.id
      }
    });

    if (!symptomReport) {
      return NextResponse.json({ 
        error: 'Relatório de sintomas não encontrado' 
      }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ 
        error: 'Nenhum arquivo enviado' 
      }, { status: 400 });
    }

    // Validate file type (images only for now)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Tipo de arquivo não permitido. Apenas imagens são aceitas.' 
      }, { status: 400 });
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'Arquivo muito grande. Tamanho máximo: 10MB' 
      }, { status: 400 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'symptom-reports');
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, ignore error
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `${timestamp}-${randomString}.${fileExtension}`;
    const filePath = join(uploadsDir, fileName);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Create attachment record
    const attachment = await prisma.symptomReportAttachment.create({
      data: {
        symptomReportId: reportId,
        fileName: fileName,
        originalName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        fileUrl: `/uploads/symptom-reports/${fileName}`
      }
    });

    return NextResponse.json({
      success: true,
      attachment
    }, { status: 201 });

  } catch (error) {
    console.error('Error uploading attachment:', error);
    return NextResponse.json({ 
      error: 'Erro ao fazer upload do arquivo',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// GET /api/symptom-reports/[id]/attachments - List attachments
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const resolvedParams = await params;
    const reportId = resolvedParams.id;

    // Get user to check role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Verify access to symptom report
    let whereClause: any = { id: reportId };

    if (user.role === 'DOCTOR') {
      // Doctor can see reports from their patients
      whereClause.protocol = {
        doctorId: session.user.id
      };
    } else {
      // Patient can only see their own reports
      whereClause.userId = session.user.id;
    }

    const symptomReport = await prisma.symptomReport.findFirst({
      where: whereClause,
      include: {
        attachments: true
      }
    });

    if (!symptomReport) {
      return NextResponse.json({ 
        error: 'Relatório de sintomas não encontrado' 
      }, { status: 404 });
    }

    return NextResponse.json(symptomReport.attachments);

  } catch (error) {
    console.error('Error fetching attachments:', error);
    return NextResponse.json({ 
      error: 'Erro ao buscar anexos',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 