import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import sharp from 'sharp';
import { requireMobileAuth, unauthorizedResponse } from '@/lib/mobile-auth';
import { prisma } from '@/lib/prisma';

// Função auxiliar para processar a imagem
async function processImage(buffer: Buffer, mimeType: string): Promise<Buffer> {
  let sharpInstance = sharp(buffer);

  // Converter HEIC para JPEG se necessário
  if (mimeType === 'image/heic' || mimeType === 'image/heif') {
    sharpInstance = sharpInstance.toFormat('jpeg', { quality: 85 });
    mimeType = 'image/jpeg';
  } else {
    // Para outros formatos, apenas otimizar
    switch (mimeType) {
      case 'image/jpeg':
      case 'image/jpg':
        sharpInstance = sharpInstance.jpeg({ quality: 85 });
        break;
      case 'image/png':
        sharpInstance = sharpInstance.png({ quality: 85 });
        break;
      case 'image/webp':
        sharpInstance = sharpInstance.webp({ quality: 85 });
        break;
      default:
        // Para outros formatos, converter para JPEG
        sharpInstance = sharpInstance.jpeg({ quality: 85 });
        mimeType = 'image/jpeg';
    }
  }

  // Redimensionar se a imagem for muito grande
  const metadata = await sharpInstance.metadata();
  if (metadata.width && metadata.width > 2048) {
    sharpInstance = sharpInstance.resize(2048, null, {
      withoutEnlargement: true,
      fit: 'inside'
    });
  }

  return sharpInstance.toBuffer();
}

// POST /api/mobile/symptom-reports/[id]/attachments - Upload attachment
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireMobileAuth(request);
    if (!user) {
      return unauthorizedResponse();
    }

    const reportId = params.id;

    // Verify symptom report exists and user has access
    const symptomReport = await prisma.symptomReport.findFirst({
      where: {
        id: reportId,
        userId: user.id
      }
    });

    if (!symptomReport) {
      return NextResponse.json({ 
        error: 'Symptom report not found or access denied' 
      }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ 
        error: 'No file uploaded' 
      }, { status: 400 });
    }

    // Validate file type (images only)
    const allowedTypes = [
      'image/jpeg', 
      'image/jpg', 
      'image/png', 
      'image/gif', 
      'image/webp',
      'image/heic',
      'image/heif'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'File type not allowed. Only images are accepted.' 
      }, { status: 400 });
    }

    // Validate file size (max 20MB before processing)
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size: 20MB' 
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
    const fileExtension = file.type === 'image/heic' || file.type === 'image/heif' ? 'jpg' : (file.name.split('.').pop() || 'jpg');
    const fileName = `${timestamp}-${randomString}.${fileExtension}`;
    const filePath = join(uploadsDir, fileName);

    // Process and save image
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    try {
      // Process image
      const processedBuffer = await processImage(buffer, file.type);
      
      // Save processed file
      await writeFile(filePath, processedBuffer);

      // Create attachment record
      const attachment = await prisma.symptomReportAttachment.create({
        data: {
          symptomReportId: reportId,
          fileName: fileName,
          originalName: file.name,
          fileSize: processedBuffer.length,
          mimeType: file.type === 'image/heic' || file.type === 'image/heif' ? 'image/jpeg' : file.type,
          fileUrl: `/uploads/symptom-reports/${fileName}`
        }
      });

      return NextResponse.json({
        success: true,
        attachment
      }, { status: 201 });

    } catch (error) {
      console.error('Error processing image:', error);
      return NextResponse.json({ 
        error: 'Error processing image',
        details: error instanceof Error ? error.message : String(error)
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error uploading attachment:', error);
    return NextResponse.json({ 
      error: 'Error uploading file',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// GET /api/mobile/symptom-reports/[id]/attachments - List attachments
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params

    const user = await requireMobileAuth(request);
    if (!user) {
      return unauthorizedResponse();
    }

    // Verify access to symptom report
    const symptomReport = await prisma.symptomReport.findFirst({
      where: {
        id: id,
        userId: user.id
      },
      include: {
        attachments: true
      }
    });

    if (!symptomReport) {
      return NextResponse.json({ 
        error: 'Symptom report not found or access denied' 
      }, { status: 404 });
    }

    return NextResponse.json(symptomReport.attachments);

  } catch (error) {
    console.error('Error fetching attachments:', error);
    return NextResponse.json({ 
      error: 'Error fetching attachments',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 