import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, act } from '@testing-library/react';
import { PDFService } from '@/lib/pdf-service';
import { AIService } from '@/lib/ai-service';
import { ProtocolPDFUpload } from '@/components/protocol/protocol-pdf-upload';
import fs from 'fs/promises';
import path from 'path';

// Mock external services
vi.mock('@/lib/pdf-service');
vi.mock('@/lib/ai-service');
vi.mock('next-auth');
vi.mock('@/lib/prisma');

describe('Protocol PDF Flow', () => {
  let pdfBuffer: Buffer;
  
  beforeEach(async () => {
    // Reset all mocks
    vi.resetAllMocks();
    
    // Load test PDF
    pdfBuffer = await fs.readFile(path.join(process.cwd(), 'src/tests/fixtures/test-protocol.pdf'));
  });

  describe('PDF Service', () => {
    it('should validate PDF file correctly', () => {
      const validFile = new File([pdfBuffer], 'test.pdf', { type: 'application/pdf' });
      expect(() => PDFService.validatePDF(validFile)).not.toThrow();

      const invalidFile = new File([pdfBuffer], 'test.txt', { type: 'text/plain' });
      expect(() => PDFService.validatePDF(invalidFile)).toThrow('File must be a PDF');
    });

    it('should extract text from PDF', async () => {
      const mockText = 'Test protocol content';
      vi.mocked(PDFService.extractText).mockResolvedValue(mockText);

      const text = await PDFService.extractText(pdfBuffer);
      expect(text).toBe(mockText);
    });

    it('should handle PDF extraction errors', async () => {
      vi.mocked(PDFService.extractText).mockRejectedValue(new Error('Failed to extract text'));

      await expect(PDFService.extractText(pdfBuffer)).rejects.toThrow('Failed to extract text');
    });
  });

  describe('AI Service', () => {
    it('should analyze PDF content correctly', async () => {
      const mockAnalysis = {
        name: 'Test Protocol',
        description: 'A test protocol',
        duration: 7,
        days: [
          {
            dayNumber: 1,
            title: 'Day 1',
            sessions: [
              {
                name: 'Morning Session',
                tasks: [
                  {
                    title: 'Task 1',
                    description: 'Test task'
                  }
                ]
              }
            ]
          }
        ]
      };

      vi.mocked(AIService.analyzePDFContent).mockResolvedValue(mockAnalysis);

      const analysis = await AIService.analyzePDFContent('Test content');
      expect(analysis).toEqual(mockAnalysis);
    });

    it('should handle AI analysis errors', async () => {
      vi.mocked(AIService.analyzePDFContent).mockRejectedValue(new Error('Failed to analyze'));

      await expect(AIService.analyzePDFContent('Test content')).rejects.toThrow('Failed to analyze');
    });
  });

  describe('API Endpoints', () => {
    it('should handle PDF upload correctly', async () => {
      const formData = new FormData();
      formData.append('file', new File([pdfBuffer], 'test.pdf', { type: 'application/pdf' }));

      const mockResponse = { ok: true, json: () => Promise.resolve({ text: 'Test content' }) };
      vi.mocked(global.fetch).mockResolvedValue(mockResponse as Response);

      const response = await fetch('/api/protocols/pdf-upload', {
        method: 'POST',
        body: formData
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data).toHaveProperty('text');
    });

    it('should create protocol from PDF', async () => {
      const formData = new FormData();
      formData.append('file', new File([pdfBuffer], 'test.pdf', { type: 'application/pdf' }));

      const mockProtocol = {
        id: '1',
        name: 'Test Protocol',
        days: []
      };
      const mockResponse = { ok: true, json: () => Promise.resolve(mockProtocol) };
      vi.mocked(global.fetch).mockResolvedValue(mockResponse as Response);

      const response = await fetch('/api/protocols/create-from-pdf', {
        method: 'POST',
        body: formData
      });

      expect(response.ok).toBe(true);
      const protocol = await response.json();
      expect(protocol).toHaveProperty('id');
      expect(protocol).toHaveProperty('name');
      expect(protocol).toHaveProperty('days');
    });

    it('should handle unauthorized access', async () => {
      const formData = new FormData();
      formData.append('file', new File([pdfBuffer], 'test.pdf', { type: 'application/pdf' }));

      const mockResponse = { ok: false, status: 401 };
      vi.mocked(global.fetch).mockResolvedValue(mockResponse as Response);

      const response = await fetch('/api/protocols/pdf-upload', {
        method: 'POST',
        body: formData
      });

      expect(response.status).toBe(401);
    });
  });

  describe('Frontend Components', () => {
    it('should render upload component correctly', async () => {
      const { container } = render(<ProtocolPDFUpload onUploadComplete={() => {}} />);
      expect(container).toMatchSnapshot();
    });

    it('should handle file selection', async () => {
      const { getByText, queryByText } = render(<ProtocolPDFUpload onUploadComplete={() => {}} />);
      
      const file = new File([pdfBuffer], 'test.pdf', { type: 'application/pdf' });
      const dropzone = getByText(/drag and drop/i);

      await act(async () => {
        fireEvent.drop(dropzone, {
          dataTransfer: {
            files: [file]
          }
        });
      });

      expect(queryByText('test.pdf')).toBeInTheDocument();
    });

    it('should show preview modal after analysis', async () => {
      const mockAnalysis = {
        name: 'Test Protocol',
        description: 'A test protocol',
        duration: 7,
        days: []
      };

      const mockUploadResponse = { ok: true, json: () => Promise.resolve({ text: 'Test content' }) };
      const mockCreateResponse = { ok: true, json: () => Promise.resolve(mockAnalysis) };
      
      vi.mocked(global.fetch)
        .mockResolvedValueOnce(mockUploadResponse as Response)
        .mockResolvedValueOnce(mockCreateResponse as Response);

      const { getByText, queryByText } = render(<ProtocolPDFUpload onUploadComplete={() => {}} />);
      
      const file = new File([pdfBuffer], 'test.pdf', { type: 'application/pdf' });
      await act(async () => {
        fireEvent.drop(getByText(/drag and drop/i), {
          dataTransfer: {
            files: [file]
          }
        });
      });

      await act(async () => {
        fireEvent.click(getByText('Analyze PDF'));
      });

      expect(queryByText('Protocol Preview')).toBeInTheDocument();
    });
  });
}); 