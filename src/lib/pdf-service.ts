import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";

export class PDFService {
  async extractText(input: string | Blob): Promise<string> {
    try {
      let docs;
      
      if (input instanceof Blob) {
        // Use WebPDFLoader for blobs
        const loader = new WebPDFLoader(input);
        docs = await loader.load();
      } else {
        // Use PDFLoader for file paths
        const loader = new PDFLoader(input);
        docs = await loader.load();
      }

      // Combine all pages into a single text
      const text = docs.map(doc => doc.pageContent).join('\n\n');
      return text;
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }

  static validatePDF(file: File): boolean {
    // Check file type
    if (!file.type || file.type !== 'application/pdf') {
      throw new Error('File must be a PDF');
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      throw new Error('PDF file size must be less than 10MB');
    }

    return true;
  }
} 