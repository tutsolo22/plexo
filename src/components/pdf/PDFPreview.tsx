'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, 
  Download, 
  RefreshCw, 
  Loader2, 
  FileText, 
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  AlertCircle
} from 'lucide-react';

interface PDFPreviewProps {
  pdfUrl?: string;
  fileName?: string;
  metadata?: {
    pages: number;
    size: number;
    generatedAt: Date;
  };
  templateData?: any;
  onRegenerate?: () => void;
  className?: string;
}

export default function PDFPreview({
  pdfUrl,
  fileName,
  metadata,
  templateData,
  onRegenerate,
  className = '',
}: PDFPreviewProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const downloadPDF = () => {
    if (pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = fileName || 'documento.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const openInNewTab = () => {
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const zoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200));
  };

  const zoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50));
  };

  const resetZoom = () => {
    setZoom(100);
  };

  if (!pdfUrl) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay PDF disponible
          </h3>
          <p className="text-gray-500 text-center mb-4">
            Genera un PDF para ver la vista previa aquí
          </p>
          {onRegenerate && (
            <Button onClick={onRegenerate} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Generar PDF
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header con información del PDF */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Vista Previa del PDF
            </CardTitle>
            <div className="flex items-center gap-2">
              {metadata && (
                <>
                  <Badge variant="secondary">
                    {metadata.pages} página{metadata.pages !== 1 ? 's' : ''}
                  </Badge>
                  <Badge variant="outline">
                    {formatFileSize(metadata.size)}
                  </Badge>
                </>
              )}
            </div>
          </div>
          {metadata?.generatedAt && (
            <p className="text-sm text-gray-500">
              Generado el {formatDate(metadata.generatedAt)}
            </p>
          )}
        </CardHeader>

        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button onClick={downloadPDF} size="sm">
              <Download className="h-4 w-4 mr-2" />
              Descargar
            </Button>
            <Button onClick={openInNewTab} variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir en nueva pestaña
            </Button>
            {onRegenerate && (
              <Button onClick={onRegenerate} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Controles de visualización */}
      <Card>
        <CardContent className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                onClick={zoomOut}
                variant="outline"
                size="sm"
                disabled={zoom <= 50}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[60px] text-center">
                {zoom}%
              </span>
              <Button
                onClick={zoomIn}
                variant="outline"
                size="sm"
                disabled={zoom >= 200}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button onClick={resetZoom} variant="ghost" size="sm">
                Ajustar
              </Button>
            </div>

            {metadata && metadata.pages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                >
                  Anterior
                </Button>
                <span className="text-sm">
                  Página {currentPage} de {metadata.pages}
                </span>
                <Button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, metadata.pages))}
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= metadata.pages}
                >
                  Siguiente
                </Button>
              </div>
            )}

            <Button
              onClick={() => setIsFullscreen(!isFullscreen)}
              variant="outline"
              size="sm"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Visor de PDF */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {error ? (
            <Alert variant="destructive" className="m-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <div 
              className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}
              style={{ height: isFullscreen ? '100vh' : '600px' }}
            >
              {isLoading && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Cargando PDF...</span>
                  </div>
                </div>
              )}
              
              <iframe
                src={`${pdfUrl}#page=${currentPage}&zoom=${zoom}`}
                className="w-full h-full border-0"
                title="Vista previa del PDF"
                onLoad={() => setIsLoading(false)}
                onError={() => {
                  setIsLoading(false);
                  setError('Error cargando el PDF');
                }}
              />
              
              {isFullscreen && (
                <Button
                  onClick={() => setIsFullscreen(false)}
                  className="absolute top-4 right-4 z-20"
                  variant="secondary"
                >
                  Cerrar pantalla completa
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Información adicional del template */}
      {templateData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Información del Template</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Nombre:</span> {templateData.name}
              </div>
              <div>
                <span className="font-medium">Tipo:</span> {templateData.type}
              </div>
              <div>
                <span className="font-medium">Categoría:</span> {templateData.category}
              </div>
              {templateData.description && (
                <div className="md:col-span-2">
                  <span className="font-medium">Descripción:</span> {templateData.description}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overlay para fullscreen */}
      {isFullscreen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsFullscreen(false)}
        />
      )}
    </div>
  );
}