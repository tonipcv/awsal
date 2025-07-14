import { minioClient, BUCKET_NAME } from './minio';
import { prisma } from './prisma';
import { randomUUID } from 'crypto';

export class PatientDocumentService {
  private getDocumentPath(patientId: string, doctorId: string, fileId: string, fileExtension: string): string {
    return `documents/${doctorId}/${patientId}/${fileId}.${fileExtension}`;
  }

  async uploadDocument(
    file: Buffer,
    fileName: string,
    patientId: string,
    doctorId: string,
    type: 'MEDICAL_RECORD' | 'LAB_RESULT' | 'PRESCRIPTION' | 'OTHER'
  ) {
    try {
      // Generate unique ID and get file extension
      const fileId = randomUUID();
      const fileExtension = fileName.split('.').pop()?.toLowerCase() || 'pdf';
      
      // Generate organized path: documents/doctorId/patientId/fileId.extension
      const filePath = this.getDocumentPath(patientId, doctorId, fileId, fileExtension);

      // Upload to MinIO
      await minioClient.putObject(
        BUCKET_NAME,
        filePath,
        file,
        file.length,
        { 'Content-Type': 'application/pdf' }
      );

      // Create document record using the correct model name
      const document = await prisma.patient_documents.create({
        data: {
          id: fileId,
          patient_id: patientId,
          doctor_id: doctorId,
          file_name: fileName,
          file_url: filePath,
          file_type: type,
          status: 'ACTIVE',
          patient_document_metadata: {
            create: {
              title: fileName,
              keywords: [],
              categories: [],
              importance: 'MEDIUM'
            }
          }
        },
        include: {
          patient_document_metadata: true
        }
      });

      return document;
    } catch (error) {
      console.error('Error uploading patient document:', error);
      throw new Error('Failed to upload patient document');
    }
  }

  async getDocuments(patientId: string) {
    return prisma.patient_documents.findMany({
      where: {
        patient_id: patientId,
        status: 'ACTIVE'
      },
      include: {
        patient_document_metadata: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });
  }

  async getDocument(documentId: string) {
    const document = await prisma.patient_documents.findUnique({
      where: { id: documentId },
      include: { patient_document_metadata: true }
    });

    if (!document) {
      throw new Error('Document not found');
    }

    // Get pre-signed URL for temporary access
    const presignedUrl = await minioClient.presignedGetObject(
      BUCKET_NAME,
      document.file_url,
      60 * 60 // 1 hour expiry
    );

    return {
      ...document,
      presignedUrl
    };
  }

  async deleteDocument(documentId: string) {
    try {
      const document = await prisma.patient_documents.findUnique({
        where: { id: documentId }
      });

      if (!document) {
        throw new Error('Document not found');
      }

      // Delete from MinIO first
      await minioClient.removeObject(BUCKET_NAME, document.file_url);

      // Then delete from database (this will cascade delete metadata due to the relation setup)
      await prisma.patient_documents.delete({
        where: { id: documentId }
      });

      return true;
    } catch (error) {
      console.error('Error deleting document:', error);
      throw new Error('Failed to delete document');
    }
  }
} 