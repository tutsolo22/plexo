// types/pdf.ts
import { Quote, QuoteTemplate } from '@prisma/client';

export interface PDFGenerationOptions {
  template: QuoteTemplate;
  data: Quote & {
    client: {
      name: string;
      email: string;
      phone?: string;
      address?: string;
    };
    event?: {
      title: string;
      date: Date;
      time?: string;
      duration?: number;
      location?: string;
    };
    packages?: Array<{
      id: string;
      name: string;
      description?: string;
      items: Array<{
        name: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
      }>;
      subtotal: number;
    }>;
    business?: {
      name: string;
      phone?: string;
      email?: string;
      address?: string;
      logo?: string;
    };
  };
  metadata?: {
    fileName?: string;
    watermark?: string;
    showPageNumbers?: boolean;
    orientation?: 'portrait' | 'landscape';
    format?: 'A4' | 'Letter';
  };
}

export interface PDFGenerationResult {
  success: boolean;
  pdfUrl?: string;
  fileName?: string;
  error?: string;
  metadata?: {
    pages: number;
    size: number;
    generatedAt: Date;
  };
}

export interface PDFPreviewData {
  htmlContent: string;
  cssStyles: string;
  variables: Record<string, any>;
}

export type PDFEngine = 'react-pdf' | 'puppeteer' | 'jspdf';

export interface PDFEngineConfig {
  engine: PDFEngine;
  quality?: 'low' | 'medium' | 'high';
  compression?: boolean;
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string[];
    creator?: string;
  };
}

export interface PDFStorageConfig {
  storageType: 'local' | 'cloudinary' | 's3';
  path?: string;
  publicUrl?: string;
  retention?: number; // days
}