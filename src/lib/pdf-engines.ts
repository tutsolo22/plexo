// lib/pdf-engines.ts
import { PDFGenerationOptions, PDFGenerationResult, PDFEngine, PDFEngineConfig } from '@/types/pdf';
import handlebars from 'handlebars';

// React-PDF Engine
export class ReactPDFEngine {
  static async generate(options: PDFGenerationOptions, config: PDFEngineConfig): Promise<PDFGenerationResult> {
    try {
      const { Document, Page, Text, View, StyleSheet, PDFDownloadLink, pdf } = await import('@react-pdf/renderer');
      
      // Procesar template con handlebars
      const template = handlebars.compile(options.template.content);
      const processedData = this.prepareData(options.data);
      const htmlContent = template(processedData);
      
      // Configurar estilos
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
          display: 'table',
          width: '100%',
          borderStyle: 'solid',
          borderWidth: 1,
          borderColor: '#bfbfbf',
        },
        tableRow: {
          flexDirection: 'row',
          borderBottomWidth: 1,
          borderBottomColor: '#bfbfbf',
        },
        tableCell: {
          flex: 1,
          padding: 5,
          borderRightWidth: 1,
          borderRightColor: '#bfbfbf',
        },
      });

      // Crear documento PDF
      const MyDocument = () => (
        Document({},
          Page({ size: config.metadata?.format || 'A4', style: styles.page },
            View({ style: styles.section },
              Text({ style: styles.title }, options.data.quoteNumber || 'Cotización'),
              Text({ style: styles.text }, `Cliente: ${options.data.client.name}`),
              Text({ style: styles.text }, `Email: ${options.data.client.email}`),
              Text({ style: styles.text }, `Fecha: ${new Date().toLocaleDateString()}`),
              options.data.event && Text({ style: styles.text }, `Evento: ${options.data.event.title}`),
              
              // Tabla de paquetes si existen
              options.data.packages && options.data.packages.length > 0 && 
              View({ style: styles.table },
                View({ style: styles.tableRow },
                  Text({ style: [styles.tableCell, styles.subtitle] }, 'Paquete'),
                  Text({ style: [styles.tableCell, styles.subtitle] }, 'Descripción'),
                  Text({ style: [styles.tableCell, styles.subtitle] }, 'Precio')
                ),
                ...options.data.packages.map(pkg => 
                  View({ style: styles.tableRow },
                    Text({ style: styles.tableCell }, pkg.name),
                    Text({ style: styles.tableCell }, pkg.description || ''),
                    Text({ style: styles.tableCell }, `$${pkg.subtotal.toFixed(2)}`)
                  )
                )
              ),
              
              View({ style: { marginTop: 20 } },
                Text({ style: styles.subtitle }, `Total: $${options.data.total?.toFixed(2) || '0.00'}`)
              )
            )
          )
        )
      );

      // Generar PDF
      const blob = await pdf(MyDocument()).toBlob();
      const fileName = options.metadata?.fileName || `cotizacion-${Date.now()}.pdf`;
      
      // Guardar archivo (implementar según configuración)
      const pdfUrl = await this.saveFile(blob, fileName);

      return {
        success: true,
        pdfUrl,
        fileName,
        metadata: {
          pages: 1,
          size: blob.size,
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

  private static prepareData(data: any) {
    return {
      ...data,
      currentDate: new Date().toLocaleDateString(),
      currentTime: new Date().toLocaleTimeString(),
      formattedTotal: data.total?.toFixed(2) || '0.00',
      formattedSubtotal: data.subtotal?.toFixed(2) || '0.00',
      formattedDiscount: data.discount?.toFixed(2) || '0.00',
    };
  }

  private static async saveFile(blob: Blob, fileName: string): Promise<string> {
    // Por ahora, crear URL temporal
    // En producción, implementar guardado en storage
    return URL.createObjectURL(blob);
  }
}

// Puppeteer Engine  
export class PuppeteerEngine {
  static async generate(options: PDFGenerationOptions, config: PDFEngineConfig): Promise<PDFGenerationResult> {
    try {
      const puppeteer = await import('puppeteer-core');
      
      // Procesar template
      const template = handlebars.compile(options.template.content);
      const processedData = ReactPDFEngine.prepareData ? ReactPDFEngine['prepareData'](options.data) : options.data;
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
        format: config.metadata?.format || 'A4',
        margin: {
          top: '20mm',
          bottom: '20mm',
          left: '15mm',
          right: '15mm',
        },
        displayHeaderFooter: true,
        headerTemplate: '<div></div>',
        footerTemplate: options.metadata?.showPageNumbers ? 
          '<div style="font-size: 10px; margin: 0 auto;">Página <span class="pageNumber"></span> de <span class="totalPages"></span></div>' : 
          '<div></div>',
      });

      await browser.close();

      const fileName = options.metadata?.fileName || `cotizacion-${Date.now()}.pdf`;
      const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
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
  static async generate(options: PDFGenerationOptions, config: PDFEngineConfig): Promise<PDFGenerationResult> {
    try {
      const { jsPDF } = await import('jspdf');
      const html2canvas = await import('html2canvas');
      
      // Crear contenido HTML
      const template = handlebars.compile(options.template.content);
      const processedData = ReactPDFEngine.prepareData ? ReactPDFEngine['prepareData'](options.data) : options.data;
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
      const imgData = canvas.toDataURL('image/jpeg', 0.8);
      const pdf = new jsPDF({
        orientation: options.metadata?.orientation || 'portrait',
        unit: 'mm',
        format: config.metadata?.format || 'a4',
      });
      
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