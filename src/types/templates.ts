// Tipos compartidos para el sistema de templates

export interface TemplateBase {
  name: string;
  description?: string;
  type: 'QUOTE' | 'CONTRACT' | 'INVOICE' | 'EMAIL' | 'PROPOSAL';
  category?: string;
  variables?: string[];
  styles?: Record<string, string>;
  metadata?: Record<string, any>;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface TemplateListItem extends TemplateBase {
  id: string;
  isDefault: boolean;
  isActive: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  businessIdentity: {
    name: string;
    logo?: string;
  };
  _count: {
    quotes: number;
  };
}

export interface TemplateEditorData extends TemplateBase {
  id?: string;
  htmlContent: string;
  isDefault: boolean;
  isActive: boolean;
}

export interface TemplateFullData extends TemplateListItem {
  htmlContent: string;
  quotes?: Array<{
    id: string;
    quoteNumber: string;
    status: string;
    total: number;
    createdAt: string;
    client: {
      name: string;
      email: string;
    };
  }>;
}

export type TemplateType = 'QUOTE' | 'CONTRACT' | 'INVOICE' | 'EMAIL' | 'PROPOSAL';

export const TEMPLATE_TYPES = [
  { value: 'QUOTE' as const, label: 'Cotización' },
  { value: 'CONTRACT' as const, label: 'Contrato' },
  { value: 'INVOICE' as const, label: 'Factura' },
  { value: 'EMAIL' as const, label: 'Email' },
  { value: 'PROPOSAL' as const, label: 'Propuesta' },
];

export const TEMPLATE_CATEGORIES = [
  'eventos',
  'bodas',
  'corporativo',
  'social',
  'familiar',
  'comercial',
  'personalizado'
] as const;