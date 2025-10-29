'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Eye,
  Save,
  Code,
  Type,
  Palette,
  Settings,
  Plus,
  X,
  FileText,
  Mail,
  FileCheck,
  Receipt,
  Briefcase,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { TemplateEditorData, TemplateFullData, TEMPLATE_CATEGORIES } from '@/types/templates';

// Definir tipos
interface TemplateVariable {
  name: string;
  key: string;
  description: string;
  example: string;
  category: string;
}

interface TemplateEditorProps {
  template?: TemplateFullData | null;
  onSave: (data: TemplateEditorData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const TEMPLATE_TYPE_CONFIGS = [
  { value: 'QUOTE', label: 'Cotización', icon: FileText, color: 'bg-blue-500' },
  { value: 'CONTRACT', label: 'Contrato', icon: FileCheck, color: 'bg-green-500' },
  { value: 'INVOICE', label: 'Factura', icon: Receipt, color: 'bg-purple-500' },
  { value: 'EMAIL', label: 'Email', icon: Mail, color: 'bg-orange-500' },
  { value: 'PROPOSAL', label: 'Propuesta', icon: Briefcase, color: 'bg-indigo-500' },
];

const DEFAULT_STYLES = {
  fontFamily: 'Arial, sans-serif',
  fontSize: '14px',
  lineHeight: '1.6',
  color: '#333333',
  backgroundColor: '#ffffff',
  marginTop: '20px',
  marginBottom: '20px',
  marginLeft: '40px',
  marginRight: '40px',
};

export function TemplateEditor({
  template,
  onSave,
  onCancel,
  isLoading = false,
}: TemplateEditorProps) {
  // Estados principales
  const [formData, setFormData] = useState<TemplateEditorData>({
    name: '',
    description: '',
    type: 'QUOTE',
    category: '',
    htmlContent: '',
    variables: [],
    styles: DEFAULT_STYLES,
    metadata: {},
    isDefault: false,
    isActive: true,
  });

  // Estados del editor
  const [activeTab, setActiveTab] = useState('editor');
  const [variables, setVariables] = useState<Record<string, TemplateVariable[]>>({});
  const [previewContent, setPreviewContent] = useState('');
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [selectedVariables, setSelectedVariables] = useState<string[]>([]);
  const [customVariables, setCustomVariables] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cargar datos del template al inicializar
  useEffect(() => {
    if (template) {
      setFormData({
        ...template,
        variables: template.variables || [],
        styles: template.styles || DEFAULT_STYLES,
        metadata: template.metadata || {},
      });
      setSelectedVariables(template.variables || []);
    }
  }, [template]);

  // Cargar variables disponibles
  useEffect(() => {
    fetchVariables();
  }, []);

  const fetchVariables = async () => {
    try {
      const response = await fetch('/api/templates/variables');
      if (response.ok) {
        const data = await response.json();
        setVariables(data.variables);
      }
    } catch (error) {
      console.error('Error loading variables:', error);
      toast.error('Error al cargar variables');
    }
  };

  // Generar vista previa
  const generatePreview = useCallback(async () => {
    if (!formData.htmlContent.trim()) return;

    setIsPreviewLoading(true);
    try {
      const response = await fetch(`/api/templates/${template?.id || 'preview'}/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {},
          format: 'html',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setPreviewContent(data.content);
      } else {
        // Si no hay ID (template nuevo), hacer preview local simple
        setPreviewContent(formData.htmlContent);
      }
    } catch (error) {
      console.error('Error generating preview:', error);
      setPreviewContent(formData.htmlContent);
    } finally {
      setIsPreviewLoading(false);
    }
  }, [formData.htmlContent, template?.id]);

  // Auto-preview cuando cambia el contenido
  useEffect(() => {
    const timer = setTimeout(() => {
      generatePreview();
    }, 1000);

    return () => clearTimeout(timer);
  }, [generatePreview]);

  // Funciones de manejo
  const handleInputChange = (field: keyof TemplateEditorData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Limpiar errores
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleStyleChange = (property: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      styles: {
        ...prev.styles,
        [property]: value,
      },
    }));
  };

  const insertVariable = (variableKey: string) => {
    const textarea = document.getElementById('htmlContent') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentContent = formData.htmlContent;
      const newContent =
        currentContent.substring(0, start) + variableKey + currentContent.substring(end);

      handleInputChange('htmlContent', newContent);

      // Agregar a variables seleccionadas si no existe
      if (!selectedVariables.includes(variableKey)) {
        const newSelected = [...selectedVariables, variableKey];
        setSelectedVariables(newSelected);
        handleInputChange('variables', newSelected);
      }
    }
  };

  const addCustomVariable = (variableName: string) => {
    const variableKey = `{{${variableName}}}`;
    if (!customVariables.includes(variableKey)) {
      const newCustom = [...customVariables, variableKey];
      setCustomVariables(newCustom);

      const newSelected = [...selectedVariables, variableKey];
      setSelectedVariables(newSelected);
      handleInputChange('variables', newSelected);
    }
  };

  const removeVariable = (variableKey: string) => {
    const newSelected = selectedVariables.filter(v => v !== variableKey);
    setSelectedVariables(newSelected);
    handleInputChange('variables', newSelected);

    if (customVariables.includes(variableKey)) {
      setCustomVariables(customVariables.filter(v => v !== variableKey));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData['name'].trim()) {
      newErrors['name'] = 'El nombre es requerido';
    }

    if (!formData['htmlContent'].trim()) {
      newErrors['htmlContent'] = 'El contenido HTML es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('Por favor corrige los errores en el formulario');
      return;
    }

    try {
      await onSave(formData);
      toast.success('Template guardado correctamente');
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Error al guardar template');
    }
  };

  const insertTemplate = (templateType: string) => {
    let defaultTemplate = '';

    switch (templateType) {
      case 'basic':
        defaultTemplate = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>{{businessName}} - {{quoteNumber}}</title>
</head>
<body>
    <h1>{{businessName}}</h1>
    <h2>Cotización {{quoteNumber}}</h2>
    
    <div class="client-info">
        <h3>Información del Cliente</h3>
        <p><strong>Nombre:</strong> {{clientName}}</p>
        <p><strong>Email:</strong> {{clientEmail}}</p>
        <p><strong>Teléfono:</strong> {{clientPhone}}</p>
    </div>
    
    <div class="event-info">
        <h3>Información del Evento</h3>
        <p><strong>Evento:</strong> {{eventTitle}}</p>
        <p><strong>Fecha:</strong> {{eventDate}} a las {{eventTime}}</p>
        <p><strong>Lugar:</strong> {{roomName}}</p>
    </div>
    
    <div class="totals">
        <h3>Totales</h3>
        <p><strong>Subtotal:</strong> {{subtotal}}</p>
        <p><strong>Descuento:</strong> {{discount}}</p>
        <p><strong>Total:</strong> {{total}}</p>
    </div>
</body>
</html>`;
        break;

      case 'packages':
        defaultTemplate = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>{{businessName}} - {{quoteNumber}}</title>
</head>
<body>
    <h1>{{businessName}}</h1>
    <h2>Cotización {{quoteNumber}}</h2>
    
    <p><strong>Cliente:</strong> {{clientName}}</p>
    <p><strong>Evento:</strong> {{eventTitle}} - {{eventDate}}</p>
    
    <h3>Paquetes:</h3>
    {{#each packages}}
    <div class="package">
        <h4>{{name}}</h4>
        <p>{{description}}</p>
        <ul>
            {{#each items}}
            <li>{{name}} - Cantidad: {{quantity}} - Total: {{totalPrice}}</li>
            {{/each}}
        </ul>
        <p><strong>Subtotal: {{subtotal}}</strong></p>
    </div>
    {{/each}}
    
    <h3>Total General: {{total}}</h3>
</body>
</html>`;
        break;

      case 'professional':
        defaultTemplate = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>{{businessName}} - {{quoteNumber}}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .client-section, .event-section, .packages-section { margin-bottom: 30px; }
        .package { border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; }
        .totals { text-align: right; font-size: 18px; font-weight: bold; }
        .footer { border-top: 1px solid #ccc; padding-top: 20px; margin-top: 40px; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{businessName}}</h1>
        <p>{{businessAddress}} | {{businessPhone}} | {{businessEmail}}</p>
    </div>
    
    <h2>Cotización No. {{quoteNumber}}</h2>
    <p><strong>Fecha:</strong> {{currentDate}}</p>
    <p><strong>Válida hasta:</strong> {{validUntil}}</p>
    
    <div class="client-section">
        <h3>Datos del Cliente</h3>
        <p><strong>Nombre:</strong> {{clientName}}</p>
        <p><strong>Email:</strong> {{clientEmail}}</p>
        <p><strong>Teléfono:</strong> {{clientPhone}}</p>
        <p><strong>Dirección:</strong> {{clientAddress}}</p>
    </div>
    
    <div class="event-section">
        <h3>Información del Evento</h3>
        <p><strong>Evento:</strong> {{eventTitle}}</p>
        <p><strong>Fecha y Hora:</strong> {{eventDate}} a las {{eventTime}}</p>
        <p><strong>Duración:</strong> {{eventDuration}}</p>
        <p><strong>Lugar:</strong> {{roomName}} - {{locationName}}</p>
    </div>
    
    <div class="packages-section">
        <h3>Paquetes y Servicios</h3>
        {{#each packages}}
        <div class="package">
            <h4>{{name}}</h4>
            <p>{{description}}</p>
            <table width="100%" style="border-collapse: collapse;">
                <thead>
                    <tr style="background-color: #f5f5f5;">
                        <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Concepto</th>
                        <th style="text-align: center; padding: 8px; border: 1px solid #ddd;">Cantidad</th>
                        <th style="text-align: right; padding: 8px; border: 1px solid #ddd;">Precio Unit.</th>
                        <th style="text-align: right; padding: 8px; border: 1px solid #ddd;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {{#each items}}
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ddd;">{{name}}</td>
                        <td style="text-align: center; padding: 8px; border: 1px solid #ddd;">{{quantity}}</td>
                        <td style="text-align: right; padding: 8px; border: 1px solid #ddd;">{{unitPrice}}</td>
                        <td style="text-align: right; padding: 8px; border: 1px solid #ddd;">{{totalPrice}}</td>
                    </tr>
                    {{/each}}
                </tbody>
            </table>
            <p style="text-align: right; font-weight: bold;">Subtotal: {{subtotal}}</p>
        </div>
        {{/each}}
    </div>
    
    <div class="totals">
        <p>Subtotal: {{subtotal}}</p>
        <p>Descuento: {{discount}}</p>
        <p style="font-size: 20px; color: #333;">Total: {{total}}</p>
    </div>
    
    <div class="footer">
        <p>Gracias por confiar en {{businessName}}</p>
        <p><em>{{businessSlogan}}</em></p>
    </div>
</body>
</html>`;
        break;
    }

    handleInputChange('htmlContent', defaultTemplate);
  };

  return (
    <div className='mx-auto max-w-7xl space-y-6 p-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>{template ? 'Editar Template' : 'Crear Template'}</h1>
          <p className='text-muted-foreground'>
            Crea y personaliza plantillas para cotizaciones y documentos
          </p>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline' onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Guardando...
              </>
            ) : (
              <>
                <Save className='mr-2 h-4 w-4' />
                Guardar
              </>
            )}
          </Button>
        </div>
      </div>

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-4'>
        {/* Panel de configuración */}
        <div className='lg:col-span-1'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Settings className='h-5 w-5' />
                Configuración
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              {/* Información básica */}
              <div className='space-y-3'>
                <div>
                  <Label htmlFor='name'>Nombre del Template *</Label>
                  <Input
                    id='name'
                    value={formData['name']}
                    onChange={e => handleInputChange('name', e.target.value)}
                    placeholder='Ej: Cotización Eventos Sociales'
                    className={errors['name'] ? 'border-red-500' : ''}
                  />
                  {errors['name'] && <p className='mt-1 text-sm text-red-500'>{errors['name']}</p>}
                </div>

                <div>
                  <Label htmlFor='description'>Descripción</Label>
                  <Textarea
                    id='description'
                    value={formData.description}
                    onChange={e => handleInputChange('description', e.target.value)}
                    placeholder='Descripción del template...'
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor='type'>Tipo de Template</Label>
                  <Select
                    value={formData.type}
                    onValueChange={value => handleInputChange('type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TEMPLATE_TYPE_CONFIGS.map(type => {
                        const Icon = type.icon;
                        return (
                          <SelectItem key={type.value} value={type.value}>
                            <div className='flex items-center gap-2'>
                              <div className={`h-3 w-3 rounded-full ${type.color}`} />
                              <Icon className='h-4 w-4' />
                              {type.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor='category'>Categoría</Label>
                  <Select
                    {...(formData.category ? { value: formData.category } : {})}
                    onValueChange={value => handleInputChange('category', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Seleccionar categoría' />
                    </SelectTrigger>
                    <SelectContent>
                      {TEMPLATE_CATEGORIES.map(category => (
                        <SelectItem key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className='flex items-center space-x-2'>
                  <input
                    type='checkbox'
                    id='isDefault'
                    checked={formData.isDefault}
                    onChange={e => handleInputChange('isDefault', e.target.checked)}
                    className='rounded border-gray-300'
                  />
                  <Label htmlFor='isDefault'>Template por defecto</Label>
                </div>

                <div className='flex items-center space-x-2'>
                  <input
                    type='checkbox'
                    id='isActive'
                    checked={formData.isActive}
                    onChange={e => handleInputChange('isActive', e.target.checked)}
                    className='rounded border-gray-300'
                  />
                  <Label htmlFor='isActive'>Activo</Label>
                </div>
              </div>

              {/* Templates predefinidos */}
              <div className='border-t pt-4'>
                <Label>Templates Base</Label>
                <div className='mt-2 space-y-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    className='w-full justify-start'
                    onClick={() => insertTemplate('basic')}
                  >
                    <FileText className='mr-2 h-4 w-4' />
                    Básico
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    className='w-full justify-start'
                    onClick={() => insertTemplate('packages')}
                  >
                    <Briefcase className='mr-2 h-4 w-4' />
                    Con Paquetes
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    className='w-full justify-start'
                    onClick={() => insertTemplate('professional')}
                  >
                    <FileCheck className='mr-2 h-4 w-4' />
                    Profesional
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Panel de variables */}
          <Card className='mt-4'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Type className='h-5 w-5' />
                Variables
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                {/* Variables seleccionadas */}
                {selectedVariables.length > 0 && (
                  <div>
                    <Label className='text-sm font-medium'>Variables en uso:</Label>
                    <div className='mt-1 flex flex-wrap gap-1'>
                      {selectedVariables.map(variable => (
                        <Badge
                          key={variable}
                          variant='secondary'
                          className='cursor-pointer hover:bg-red-100'
                          onClick={() => removeVariable(variable)}
                        >
                          {variable}
                          <X className='ml-1 h-3 w-3' />
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Variables disponibles */}
                <Accordion type='single' collapsible className='w-full'>
                  {Object.entries(variables).map(([category, categoryVariables]) => (
                    <AccordionItem key={category} value={category}>
                      <AccordionTrigger className='text-sm'>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className='space-y-1'>
                          {categoryVariables.map(variable => (
                            <Button
                              key={variable.key}
                              variant='ghost'
                              size='sm'
                              className='w-full justify-start text-xs'
                              onClick={() => insertVariable(variable.key)}
                              title={variable.description}
                            >
                              <Plus className='mr-1 h-3 w-3' />
                              {variable.key}
                            </Button>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>

                {/* Variable personalizada */}
                <div>
                  <Label className='text-sm'>Variable personalizada:</Label>
                  <div className='mt-1 flex gap-1'>
                    <Input
                      placeholder='nombre'
                      className='text-xs'
                      onKeyPress={e => {
                        if (e.key === 'Enter') {
                          const input = e.target as HTMLInputElement;
                          if (input.value.trim()) {
                            addCustomVariable(input.value.trim());
                            input.value = '';
                          }
                        }
                      }}
                    />
                    <Button
                      size='sm'
                      onClick={e => {
                        const input = (e.target as HTMLElement)
                          .previousElementSibling as HTMLInputElement;
                        if (input?.value.trim()) {
                          addCustomVariable(input.value.trim());
                          input.value = '';
                        }
                      }}
                    >
                      <Plus className='h-3 w-3' />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Editor principal */}
        <div className='lg:col-span-3'>
          <Card className='h-full'>
            <CardHeader>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value='editor' className='flex items-center gap-2'>
                    <Code className='h-4 w-4' />
                    Editor
                  </TabsTrigger>
                  <TabsTrigger value='preview' className='flex items-center gap-2'>
                    <Eye className='h-4 w-4' />
                    Vista Previa
                  </TabsTrigger>
                  <TabsTrigger value='styles' className='flex items-center gap-2'>
                    <Palette className='h-4 w-4' />
                    Estilos
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>

            <CardContent className='h-[600px]'>
              <TabsContent value='editor' className='h-full'>
                <div className='h-full'>
                  <Label htmlFor='htmlContent'>Contenido HTML *</Label>
                  <Textarea
                    id='htmlContent'
                    value={formData['htmlContent']}
                    onChange={e => handleInputChange('htmlContent', e.target.value)}
                    placeholder='Escribe el contenido HTML del template...'
                    className={`h-[550px] font-mono text-sm ${errors['htmlContent'] ? 'border-red-500' : ''}`}
                  />
                  {errors['htmlContent'] && (
                    <p className='mt-1 text-sm text-red-500'>{errors['htmlContent']}</p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value='preview' className='h-full'>
                <div className='h-full overflow-auto rounded-lg border bg-card'>
                  {isPreviewLoading ? (
                    <div className='flex h-full items-center justify-center'>
                      <Loader2 className='h-8 w-8 animate-spin' />
                    </div>
                  ) : (
                    <div className='p-4' dangerouslySetInnerHTML={{ __html: previewContent }} />
                  )}
                </div>
              </TabsContent>

              <TabsContent value='styles' className='h-full'>
                <div className='grid h-full grid-cols-2 gap-4 overflow-auto'>
                  <div>
                    <Label>Fuente</Label>
                    <Input
                      value={formData.styles?.['fontFamily'] || ''}
                      onChange={e => handleStyleChange('fontFamily', e.target.value)}
                      placeholder='Arial, sans-serif'
                    />
                  </div>
                  <div>
                    <Label>Tamaño de fuente</Label>
                    <Input
                      value={formData.styles?.['fontSize'] || ''}
                      onChange={e => handleStyleChange('fontSize', e.target.value)}
                      placeholder='14px'
                    />
                  </div>
                  <div>
                    <Label>Color de texto</Label>
                    <Input
                      type='color'
                      value={formData.styles?.['color'] || '#333333'}
                      onChange={e => handleStyleChange('color', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Color de fondo</Label>
                    <Input
                      type='color'
                      value={formData.styles?.['backgroundColor'] || '#ffffff'}
                      onChange={e => handleStyleChange('backgroundColor', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Margen superior</Label>
                    <Input
                      value={formData.styles?.['marginTop'] || ''}
                      onChange={e => handleStyleChange('marginTop', e.target.value)}
                      placeholder='20px'
                    />
                  </div>
                  <div>
                    <Label>Margen inferior</Label>
                    <Input
                      value={formData.styles?.['marginBottom'] || ''}
                      onChange={e => handleStyleChange('marginBottom', e.target.value)}
                      placeholder='20px'
                    />
                  </div>
                  <div>
                    <Label>Margen izquierdo</Label>
                    <Input
                      value={formData.styles?.['marginLeft'] || ''}
                      onChange={e => handleStyleChange('marginLeft', e.target.value)}
                      placeholder='40px'
                    />
                  </div>
                  <div>
                    <Label>Margen derecho</Label>
                    <Input
                      value={formData.styles?.['marginRight'] || ''}
                      onChange={e => handleStyleChange('marginRight', e.target.value)}
                      placeholder='40px'
                    />
                  </div>
                </div>
              </TabsContent>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
