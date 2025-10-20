// lib/pdf-engines.ts
import {
  PDFGenerationOptions,
  PDFGenerationResult,
  PDFEngine,
  PDFEngineConfig,
} from '../types/pdf';
import * as Handlebars from 'handlebars';
import { createElement } from 'react';

// React-PDF Engine (Migrado a API moderna con createElement)
export class ReactPDFEngine {
  static async generate(
    options: PDFGenerationOptions,
    config: PDFEngineConfig
  ): Promise<PDFGenerationResult> {
    try {
      const ReactPDF = await import('@react-pdf/renderer');
      const { Document, Page, Text, View, StyleSheet, pdf } = ReactPDF;

      // Configurar estilos modernos
      const styles = StyleSheet.create({
        page: {
          flexDirection: 'column',
          backgroundColor: '#FFFFFF',
          padding: 20,
          fontSize: 12,
          fontFamily: 'Helvetica',
        },
        section: {
          margin: 10,
          padding: 10,
        },
        title: {
          fontSize: 24,
          marginBottom: 20,
          fontWeight: 'bold',
        },
        subtitle: {
          fontSize: 16,
          marginBottom: 10,
          fontWeight: 'bold',
        },
        text: {
          fontSize: 12,
          marginBottom: 5,
        },
        table: {
          width: '100%',
          marginTop: 10,
        },
        tableRow: {
          flexDirection: 'row',
          borderBottomWidth: 1,
          borderBottomColor: '#bfbfbf',
        },
        tableHeader: {
          backgroundColor: '#f5f5f5',
          fontWeight: 'bold',
        },
        tableCell: {
          flex: 1,
          padding: 8,
          borderRightWidth: 1,
          borderRightColor: '#bfbfbf',
          fontSize: 10,
        },
        totalSection: {
          marginTop: 20,
          paddingTop: 15,
          borderTopWidth: 2,
          borderTopColor: '#333',
        },
      });

      // Crear elementos de tabla dinámicamente
      const createPackageRows = () => {
        if (!options.data.packages || options.data.packages.length === 0) {
          return [];
        }

        return options.data.packages.map((pkg: any, index: number) =>
          createElement(View, { key: index, style: styles.tableRow }, [
            createElement(Text, { key: 'name', style: styles.tableCell }, pkg.name),
            createElement(Text, { key: 'desc', style: styles.tableCell }, pkg.description || ''),
            createElement(
              Text,
              { key: 'price', style: styles.tableCell },
              `$${pkg.subtotal.toFixed(2)}`
            ),
          ])
        );
      };

      // Crear tabla de paquetes
      const createPackageTable = () => {
        if (!options.data.packages || options.data.packages.length === 0) {
          return null;
        }

        return createElement(View, { style: styles.table }, [
          // Header
          createElement(View, { key: 'header', style: [styles.tableRow, styles.tableHeader] }, [
            createElement(
              Text,
              { key: 'h1', style: [styles.tableCell, styles.subtitle] },
              'Paquete'
            ),
            createElement(
              Text,
              { key: 'h2', style: [styles.tableCell, styles.subtitle] },
              'Descripción'
            ),
            createElement(
              Text,
              { key: 'h3', style: [styles.tableCell, styles.subtitle] },
              'Precio'
            ),
          ]),
          // Rows
          ...createPackageRows(),
        ]);
      };

      // Crear componente PDF con createElement
      const createPDFDocument = () =>
        createElement(Document, {}, [
          createElement(
            Page,
            {
              key: 'page1',
              size: (config.metadata as any)?.pageSize || 'A4',
              style: styles.page,
            },
            [
              createElement(
                View,
                { key: 'section', style: styles.section },
                [
                  createElement(
                    Text,
                    {
                      key: 'title',
                      style: styles.title,
                    },
                    options.data.quoteNumber || 'Cotización'
                  ),

                  createElement(
                    Text,
                    {
                      key: 'client',
                      style: styles.text,
                    },
                    `Cliente: ${options.data.client.name}`
                  ),

                  createElement(
                    Text,
                    {
                      key: 'email',
                      style: styles.text,
                    },
                    `Email: ${options.data.client.email}`
                  ),

                  createElement(
                    Text,
                    {
                      key: 'date',
                      style: styles.text,
                    },
                    `Fecha: ${new Date().toLocaleDateString()}`
                  ),

                  // Evento condicional
                  ...(options.data.event
                    ? [
                        createElement(
                          Text,
                          {
                            key: 'event',
                            style: styles.text,
                          },
                          `Evento: ${options.data.event.title}`
                        ),
                      ]
                    : []),

                  // Tabla de paquetes
                  createPackageTable(),

                  createElement(View, { key: 'total', style: styles.totalSection }, [
                    createElement(
                      Text,
                      {
                        key: 'totalText',
                        style: styles.subtitle,
                      },
                      `Total: $${options.data.total?.toFixed(2) || '0.00'}`
                    ),
                  ]),
                ].filter(Boolean)
              ),
            ]
          ),
        ]);

      // Generar PDF usando la API moderna
      const pdfBlob = await pdf(createPDFDocument()).toBlob();
      const fileName = options.metadata?.fileName || `cotizacion-${Date.now()}.pdf`;

      // Guardar archivo (implementar según configuración)
      const pdfUrl = await this.saveFile(pdfBlob, fileName);

      return {
        success: true,
        pdfUrl,
        fileName,
        metadata: {
          pages: 1,
          size: pdfBlob.size,
          generatedAt: new Date(),
        },
      };
    } catch (error) {
      console.error('Error generating PDF with React-PDF:', error);
      return {
        success: false,
        error: `Error generando PDF: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      };
    }
  }

  public static prepareData(data: any) {
    return {
      ...data,
      currentDate: new Date().toLocaleDateString(),
      currentTime: new Date().toLocaleTimeString(),
      formattedTotal: data.total?.toFixed(2) || '0.00',
      formattedSubtotal: data.subtotal?.toFixed(2) || '0.00',
      formattedDiscount: data.discount?.toFixed(2) || '0.00',
    };
  }

  private static async saveFile(blob: Blob, _fileName: string): Promise<string> {
    // Por ahora, crear URL temporal
    // En producción, implementar guardado en storage
    return URL.createObjectURL(blob);
  }
}

// Puppeteer Engine
export class PuppeteerEngine {
  static async generate(
    options: PDFGenerationOptions,
    config: PDFEngineConfig
  ): Promise<PDFGenerationResult> {
    try {
      const puppeteer = await import('puppeteer-core');

      // Procesar template
      const template = Handlebars.compile(options.template.htmlContent);
      const processedData = ReactPDFEngine.prepareData(options.data);
      const htmlContent = template(processedData);

      // CSS por defecto
      const defaultCSS = `
        body { 
          font-family: Arial, sans-serif; 
          margin: 0; 
          padding: 20px; 
          font-size: 14px; 
          line-height: 1.6; 
        }
        .header { 
          border-bottom: 2px solid #333; 
          padding-bottom: 20px; 
          margin-bottom: 30px; 
        }
        .title { 
          font-size: 24px; 
          font-weight: bold; 
          color: #333; 
          margin-bottom: 10px; 
        }
        .subtitle { 
          font-size: 18px; 
          font-weight: bold; 
          margin: 20px 0 10px 0; 
        }
        .table { 
          width: 100%; 
          border-collapse: collapse; 
          margin: 20px 0; 
        }
        .table th, .table td { 
          border: 1px solid #ddd; 
          padding: 12px; 
          text-align: left; 
        }
        .table th { 
          background-color: #f8f9fa; 
          font-weight: bold; 
        }
        .total { 
          font-size: 18px; 
          font-weight: bold; 
          text-align: right; 
          margin-top: 20px; 
          padding: 15px; 
          background-color: #f8f9fa; 
        }
      `;

      // Aplicar estilos del template si existen
      const templateStyles = options.template.styles ? JSON.stringify(options.template.styles) : '';
      const finalCSS = `${defaultCSS}\n${templateStyles}`;

      const fullHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>${finalCSS}</style>
        </head>
        <body>
          ${htmlContent}
        </body>
        </html>
      `;

      // Buscar instalación de Chrome
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const page = await browser.newPage();
      await page.setContent(fullHTML, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: (config.metadata as any)?.format || 'A4',
        margin: {
          top: '20mm',
          bottom: '20mm',
          left: '15mm',
          right: '15mm',
        },
        displayHeaderFooter: true,
        headerTemplate: '<div></div>',
        footerTemplate: options.metadata?.showPageNumbers
          ? '<div style="font-size: 10px; margin: 0 auto;">Página <span class="pageNumber"></span> de <span class="totalPages"></span></div>'
          : '<div></div>',
      });

      await browser.close();

      const fileName = options.metadata?.fileName || `cotizacion-${Date.now()}.pdf`;
      const blob = new Blob([pdfBuffer as BlobPart], { type: 'application/pdf' });
      const pdfUrl = URL.createObjectURL(blob);

      return {
        success: true,
        pdfUrl,
        fileName,
        metadata: {
          pages: 1, // Puppeteer no devuelve este dato fácilmente
          size: pdfBuffer.length,
          generatedAt: new Date(),
        },
      };
    } catch (error) {
      console.error('Error generating PDF with Puppeteer:', error);
      return {
        success: false,
        error: `Error generando PDF: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      };
    }
  }
}

// jsPDF Engine (más simple, para casos básicos)
export class JSPDFEngine {
  static async generate(
    options: PDFGenerationOptions,
    config: PDFEngineConfig
  ): Promise<PDFGenerationResult> {
    try {
      const jsPDFModule = await import('jspdf');
      const jsPDF = (jsPDFModule as any).jsPDF || jsPDFModule;
      const html2canvas = await import('html2canvas');

      // Crear contenido HTML
      const template = Handlebars.compile(options.template.htmlContent);
      const processedData = ReactPDFEngine.prepareData(options.data);
      const htmlContent = template(processedData);

      // Crear elemento temporal
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      tempDiv.style.width = '800px';
      tempDiv.style.padding = '20px';
      tempDiv.style.fontFamily = 'Arial, sans-serif';
      document.body.appendChild(tempDiv);

      // Convertir a canvas
      const canvas = await html2canvas.default(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });

      // Limpiar elemento temporal
      document.body.removeChild(tempDiv);

      // Crear PDF
      const pdf = new jsPDF({
        orientation: options.metadata?.orientation || 'portrait',
        unit: 'mm',
        format: (config.metadata as any)?.format || 'a4',
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.8);
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = options.metadata?.fileName || `cotizacion-${Date.now()}.pdf`;
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);

      return {
        success: true,
        pdfUrl,
        fileName,
        metadata: {
          pages: pdf.getNumberOfPages(),
          size: pdfBlob.size,
          generatedAt: new Date(),
        },
      };
    } catch (error) {
      console.error('Error generating PDF with jsPDF:', error);
      return {
        success: false,
        error: `Error generando PDF: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      };
    }
  }
}

// Factory para seleccionar engine
export class PDFEngineFactory {
  static getEngine(engine: PDFEngine) {
    switch (engine) {
      case 'react-pdf':
        return ReactPDFEngine;
      case 'puppeteer':
        return PuppeteerEngine;
      case 'jspdf':
        return JSPDFEngine;
      default:
        return ReactPDFEngine;
    }
  }

  static async generate(
    options: PDFGenerationOptions,
    config: PDFEngineConfig
  ): Promise<PDFGenerationResult> {
    const engine = this.getEngine(config.engine);
    return engine.generate(options, config);
  }
}
