'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Download, 
  Eye, 
  Settings, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  FileDown
} from 'lucide-react';
import { PDFGenerationOptions, PDFGenerationResult, PDFEngine } from '@/types/pdf';

interface PDFGeneratorProps {
  quoteId?: string;
  templateId?: string;
  initialData?: any;
  onPDFGenerated?: (result: PDFGenerationResult) => void;
  className?: string;
}

interface PDFConfiguration {
  engines: PDFEngine[];
  formats: string[];
  orientations: string[];
  qualities: string[];
  defaultEngine: PDFEngine;
  defaultFormat: string;
  defaultOrientation: string;
  defaultQuality: string;
}

interface Template {
  id: string;
  name: string;
  type: string;
  category: string;
  description?: string;
}

export default function PDFGenerator({
  quoteId,
  templateId,
  initialData,
  onPDFGenerated,
  className = '',
}: PDFGeneratorProps) {
  // Estados principales
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState<PDFGenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Estados de configuración
  const [selectedEngine, setSelectedEngine] = useState<PDFEngine>('react-pdf');
  const [selectedTemplate, setSelectedTemplate] = useState(templateId || '');
  const [configuration, setConfiguration] = useState<PDFConfiguration | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  
  // Estados del formulario
  const [formData, setFormData] = useState({
    client: {
      name: '',
      email: '',
      phone: '',
      address: '',
    },
    event: {
      title: '',
      date: '',
      time: '',
      location: '',
    },
    total: 0,
    subtotal: 0,
    discount: 0,
    notes: '',
    quoteNumber: '',
  });
  
  // Opciones de PDF
  const [pdfOptions, setPdfOptions] = useState({
    quality: 'medium' as const,
    format: 'A4' as const,
    orientation: 'portrait' as const,
    fileName: '',
    showPageNumbers: true,
    compression: true,
    watermark: '',
  });

  // Cargar configuración inicial
  useEffect(() => {
    loadConfiguration();
  }, []);

  // Cargar datos iniciales si se proporcionan
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
      }));
    }
  }, [initialData]);

  const loadConfiguration = async () => {
    try {
      const response = await fetch('/api/pdf/generate');
      const data = await response.json();
      
      if (data.success) {
        setConfiguration(data.configuration);
        setTemplates(data.templates);
        setSelectedEngine(data.configuration.defaultEngine);
        setPdfOptions(prev => ({
          ...prev,
          quality: data.configuration.defaultQuality,
          format: data.configuration.defaultFormat,
          orientation: data.configuration.defaultOrientation,
        }));
      }
    } catch (error) {
      console.error('Error loading PDF configuration:', error);
      setError('Error cargando configuración de PDF');
    }
  };

  const generatePDF = async () => {
    if (!selectedTemplate) {
      setError('Selecciona un template');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGenerationResult(null);

    try {
      const endpoint = quoteId ? `/api/quotes/${quoteId}/pdf` : '/api/pdf/generate';
      
      const requestData = quoteId ? {
        engine: selectedEngine,
        quality: pdfOptions.quality,
        format: pdfOptions.format,
        orientation: pdfOptions.orientation,
        fileName: pdfOptions.fileName,
        showPageNumbers: pdfOptions.showPageNumbers,
        compression: pdfOptions.compression,
        watermark: pdfOptions.watermark,
      } : {
        templateId: selectedTemplate,
        quoteId,
        data: formData,
        options: {
          engine: selectedEngine,
          ...pdfOptions,
        },
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (result.success) {
        setGenerationResult(result);
        onPDFGenerated?.(result);
      } else {
        setError(result.error || 'Error generando PDF');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError('Error de conexión generando PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPDF = () => {
    if (generationResult?.pdfUrl) {
      const link = document.createElement('a');
      link.href = generationResult.pdfUrl;
      link.download = generationResult.fileName || 'cotizacion.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const previewPDF = () => {
    if (generationResult?.pdfUrl) {
      window.open(generationResult.pdfUrl, '_blank');
    }
  };

  const handleFormChange = (section: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: value,
      },
    }));
  };

  const getEngineIcon = (engine: PDFEngine) => {
    switch (engine) {
      case 'react-pdf': return '⚛️';
      case 'puppeteer': return '🎭';
      case 'jspdf': return '📄';
      default: return '📋';
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">
            Generador de PDF
          </h2>
        </div>
        {generationResult && (
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm text-green-600 font-medium">
              PDF generado exitosamente
            </span>
          </div>
        )}
      </div>

      {/* Configuración del Template */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuración
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selector de Template */}
          <div className="space-y-2">
            <Label htmlFor="template">Template</Label>
            <select
              id="template"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
            >
              <option value="">Seleccionar template...</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name} ({template.type} - {template.category})
                </option>
              ))}
            </select>
          </div>

          {/* Engine Selection */}
          <div className="space-y-2">
            <Label>Engine de Generación</Label>
            <div className="flex flex-wrap gap-2">
              {configuration?.engines.map((engine) => (
                <button
                  key={engine}
                  onClick={() => setSelectedEngine(engine)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                    selectedEngine === engine
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <span>{getEngineIcon(engine)}</span>
                  <span className="capitalize">{engine}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Opciones de PDF */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quality">Calidad</Label>
              <select
                id="quality"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={pdfOptions.quality}
                onChange={(e) => setPdfOptions(prev => ({ ...prev, quality: e.target.value as any }))}
              >
                {configuration?.qualities.map((quality) => (
                  <option key={quality} value={quality}>
                    {quality.charAt(0).toUpperCase() + quality.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="format">Formato</Label>
              <select
                id="format"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={pdfOptions.format}
                onChange={(e) => setPdfOptions(prev => ({ ...prev, format: e.target.value as any }))}
              >
                {configuration?.formats.map((format) => (
                  <option key={format} value={format}>
                    {format}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="orientation">Orientación</Label>
              <select
                id="orientation"
                className="w-full p-2 border border-gray-300 rounded-md"
                value={pdfOptions.orientation}
                onChange={(e) => setPdfOptions(prev => ({ ...prev, orientation: e.target.value as any }))}
              >
                {configuration?.orientations.map((orientation) => (
                  <option key={orientation} value={orientation}>
                    {orientation === 'portrait' ? 'Vertical' : 'Horizontal'}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fileName">Nombre del archivo</Label>
              <Input
                id="fileName"
                type="text"
                placeholder="cotizacion.pdf"
                value={pdfOptions.fileName}
                onChange={(e) => setPdfOptions(prev => ({ ...prev, fileName: e.target.value }))}
              />
            </div>
          </div>

          {/* Opciones adicionales */}
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={pdfOptions.showPageNumbers}
                onChange={(e) => setPdfOptions(prev => ({ ...prev, showPageNumbers: e.target.checked }))}
              />
              <span className="text-sm">Mostrar números de página</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={pdfOptions.compression}
                onChange={(e) => setPdfOptions(prev => ({ ...prev, compression: e.target.checked }))}
              />
              <span className="text-sm">Comprimir PDF</span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Datos del Formulario (solo si no es desde una cotización existente) */}
      {!quoteId && (
        <Card>
          <CardHeader>
            <CardTitle>Datos de la Cotización</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Cliente */}
            <div>
              <h4 className="font-medium mb-3">Información del Cliente</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientName">Nombre</Label>
                  <Input
                    id="clientName"
                    type="text"
                    value={formData.client.name}
                    onChange={(e) => handleFormChange('client', 'name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientEmail">Email</Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    value={formData.client.email}
                    onChange={(e) => handleFormChange('client', 'email', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientPhone">Teléfono</Label>
                  <Input
                    id="clientPhone"
                    type="text"
                    value={formData.client.phone}
                    onChange={(e) => handleFormChange('client', 'phone', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientAddress">Dirección</Label>
                  <Input
                    id="clientAddress"
                    type="text"
                    value={formData.client.address}
                    onChange={(e) => handleFormChange('client', 'address', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Evento */}
            <div>
              <h4 className="font-medium mb-3">Información del Evento</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="eventTitle">Título del Evento</Label>
                  <Input
                    id="eventTitle"
                    type="text"
                    value={formData.event.title}
                    onChange={(e) => handleFormChange('event', 'title', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eventDate">Fecha</Label>
                  <Input
                    id="eventDate"
                    type="date"
                    value={formData.event.date}
                    onChange={(e) => handleFormChange('event', 'date', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eventTime">Hora</Label>
                  <Input
                    id="eventTime"
                    type="time"
                    value={formData.event.time}
                    onChange={(e) => handleFormChange('event', 'time', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eventLocation">Ubicación</Label>
                  <Input
                    id="eventLocation"
                    type="text"
                    value={formData.event.location}
                    onChange={(e) => handleFormChange('event', 'location', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Montos */}
            <div>
              <h4 className="font-medium mb-3">Información Financiera</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subtotal">Subtotal</Label>
                  <Input
                    id="subtotal"
                    type="number"
                    step="0.01"
                    value={formData.subtotal}
                    onChange={(e) => handleFormChange('', 'subtotal', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discount">Descuento</Label>
                  <Input
                    id="discount"
                    type="number"
                    step="0.01"
                    value={formData.discount}
                    onChange={(e) => handleFormChange('', 'discount', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="total">Total</Label>
                  <Input
                    id="total"
                    type="number"
                    step="0.01"
                    value={formData.total}
                    onChange={(e) => handleFormChange('', 'total', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quoteNumber">Número de Cotización</Label>
                  <Input
                    id="quoteNumber"
                    type="text"
                    value={formData.quoteNumber}
                    onChange={(e) => handleFormChange('', 'quoteNumber', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alertas */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Resultado */}
      {generationResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              PDF Generado Exitosamente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">
                Engine: {getEngineIcon(selectedEngine)} {selectedEngine}
              </Badge>
              <Badge className={getQualityColor(pdfOptions.quality)}>
                Calidad: {pdfOptions.quality}
              </Badge>
              <Badge variant="secondary">
                Formato: {pdfOptions.format}
              </Badge>
              <Badge variant="secondary">
                Páginas: {generationResult.metadata?.pages || 1}
              </Badge>
              <Badge variant="secondary">
                Tamaño: {((generationResult.metadata?.size || 0) / 1024).toFixed(1)} KB
              </Badge>
            </div>

            <div className="flex gap-3">
              <Button onClick={previewPDF} variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Vista Previa
              </Button>
              <Button onClick={downloadPDF} size="sm">
                <Download className="h-4 w-4 mr-2" />
                Descargar PDF
              </Button>
              <Button onClick={() => setGenerationResult(null)} variant="ghost" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Generar Nuevo
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botones de Acción */}
      <div className="flex justify-end gap-3">
        <Button
          onClick={generatePDF}
          disabled={isGenerating || !selectedTemplate}
          size="lg"
          className="min-w-[150px]"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Generando...
            </>
          ) : (
            <>
              <FileDown className="h-5 w-5 mr-2" />
              Generar PDF
            </>
          )}
        </Button>
      </div>
    </div>
  );
}