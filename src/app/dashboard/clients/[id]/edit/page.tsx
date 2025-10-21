'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  company?: string;
  type: 'GENERAL' | 'COLABORADOR' | 'EXTERNO';
  isActive: boolean;
  eventCounter: number;
  discountPercent?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  priceList?: {
    id: string;
    name: string;
  };
}

interface ClientFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  company: string;
  notes: string;
  type: 'GENERAL' | 'COLABORADOR' | 'EXTERNO';
  isActive: boolean;
  discountPercent: number;
}

export default function EditClientPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params['id'] as string;

  const [client, setClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState<ClientFormData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    company: '',
    notes: '',
    type: 'GENERAL',
    isActive: true,
    discountPercent: 0,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchClient();
  }, [clientId]);

  const fetchClient = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/clients/${clientId}`);

      if (!response.ok) {
        throw new Error('Cliente no encontrado');
      }

      const result = await response.json();
      const clientData = result.data;
      setClient(clientData);

      // Populate form with client data
      setFormData({
        name: clientData.name || '',
        email: clientData.email || '',
        phone: clientData.phone || '',
        address: clientData.address || '',
        company: clientData.company || '',
        notes: clientData.notes || '',
        type: clientData.type || 'GENERAL',
        isActive: clientData.isActive ?? true,
        discountPercent: clientData.discountPercent || 0,
      });
    } catch (error) {
      console.error('Error fetching client:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ClientFormData, value: string | boolean | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear success message when form is modified
    if (success) {
      setSuccess(false);
    }
  };

  const validateForm = (): string | null => {
    if (!formData.name.trim()) {
      return 'El nombre es requerido';
    }

    if (!formData.email.trim()) {
      return 'El email es requerido';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return 'El formato del email no es válido';
    }

    // No validation needed for company field since it was removed

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim() || null,
          address: formData.address.trim() || null,
          company: formData.company.trim() || null,
          notes: formData.notes.trim() || null,
          type: formData.type,
          isActive: formData.isActive,
          discountPercent: formData.discountPercent || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar el cliente');
      }

      const result = await response.json();
      setClient(result.data);
      setSuccess(true);

      // Redirect to client detail page after a short delay
      setTimeout(() => {
        router.push(`/dashboard/clients/${clientId}`);
      }, 1500);
    } catch (error) {
      console.error('Error updating client:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push(`/dashboard/clients/${clientId}`);
  };

  if (loading) {
    return (
      <div className='container mx-auto p-6'>
        <div className='mb-6 flex items-center space-x-4'>
          <div className='h-8 w-8 animate-pulse rounded bg-gray-200' />
          <div className='h-8 w-64 animate-pulse rounded bg-gray-200' />
        </div>
        <div className='mx-auto max-w-2xl'>
          <div className='h-96 animate-pulse rounded-lg bg-gray-200' />
        </div>
      </div>
    );
  }

  if (error && !client) {
    return (
      <div className='container mx-auto p-6'>
        <div className='py-12 text-center'>
          <h2 className='mb-4 text-2xl font-bold text-gray-900'>Error</h2>
          <p className='mb-4 text-gray-600'>{error}</p>
          <Button onClick={() => router.push('/dashboard/clients')}>Volver a Clientes</Button>
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto p-6'>
      {/* Header */}
      <div className='mb-6 flex items-center justify-between'>
        <div className='flex items-center space-x-4'>
          <Button variant='ghost' size='sm' onClick={() => router.back()}>
            <ArrowLeft className='mr-2 h-4 w-4' />
            Volver
          </Button>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>Editar Cliente</h1>
            <p className='text-gray-600'>{client?.name}</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className='mx-auto max-w-2xl'>
        <Card>
          <CardHeader>
            <CardTitle>Información del Cliente</CardTitle>
            <CardDescription>Actualiza la información del cliente</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className='space-y-6'>
              {/* Success Message */}
              {success && (
                <Alert className='border-green-200 bg-green-50'>
                  <AlertDescription className='text-green-800'>
                    Cliente actualizado exitosamente. Redirigiendo...
                  </AlertDescription>
                </Alert>
              )}

              {/* Error Message */}
              {error && (
                <Alert className='border-red-200 bg-red-50'>
                  <AlertDescription className='text-red-800'>{error}</AlertDescription>
                </Alert>
              )}

              {/* Client Type */}
              <div className='space-y-2'>
                <Label htmlFor='type'>Tipo de Cliente *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: 'GENERAL' | 'COLABORADOR' | 'EXTERNO') =>
                    handleInputChange('type', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Selecciona el tipo de cliente' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='GENERAL'>General</SelectItem>
                    <SelectItem value='COLABORADOR'>Colaborador</SelectItem>
                    <SelectItem value='EXTERNO'>Externo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Name */}
              <div className='space-y-2'>
                <Label htmlFor='name'>Nombre Completo *</Label>
                <Input
                  id='name'
                  type='text'
                  value={formData.name}
                  onChange={e => handleInputChange('name', e.target.value)}
                  placeholder='Nombre completo del cliente'
                  required
                />
              </div>

              {/* Company */}
              <div className='space-y-2'>
                <Label htmlFor='company'>Empresa</Label>
                <Input
                  id='company'
                  type='text'
                  value={formData.company}
                  onChange={e => handleInputChange('company', e.target.value)}
                  placeholder='Nombre de la empresa'
                />
              </div>

              {/* Email */}
              <div className='space-y-2'>
                <Label htmlFor='email'>Email *</Label>
                <Input
                  id='email'
                  type='email'
                  value={formData.email}
                  onChange={e => handleInputChange('email', e.target.value)}
                  placeholder='cliente@ejemplo.com'
                  required
                />
              </div>

              {/* Phone */}
              <div className='space-y-2'>
                <Label htmlFor='phone'>Teléfono</Label>
                <Input
                  id='phone'
                  type='tel'
                  value={formData.phone}
                  onChange={e => handleInputChange('phone', e.target.value)}
                  placeholder='+502 1234-5678'
                />
              </div>

              {/* Address */}
              <div className='space-y-2'>
                <Label htmlFor='address'>Dirección</Label>
                <Textarea
                  id='address'
                  value={formData.address}
                  onChange={e => handleInputChange('address', e.target.value)}
                  placeholder='Dirección completa del cliente'
                  rows={3}
                />
              </div>

              {/* Notes */}
              <div className='space-y-2'>
                <Label htmlFor='notes'>Notas</Label>
                <Textarea
                  id='notes'
                  value={formData.notes}
                  onChange={e => handleInputChange('notes', e.target.value)}
                  placeholder='Notas internas sobre el cliente'
                  rows={3}
                />
              </div>

              {/* Discount Percent (only for COLABORADOR type) */}
              {formData.type === 'COLABORADOR' && (
                <div className='space-y-2'>
                  <Label htmlFor='discountPercent'>Descuento Personalizado (%)</Label>
                  <Input
                    id='discountPercent'
                    type='number'
                    min='0'
                    max='100'
                    value={formData.discountPercent}
                    onChange={e => handleInputChange('discountPercent', Number(e.target.value))}
                    placeholder='0'
                  />
                </div>
              )}

              {/* Active Status */}
              <div className='flex items-center space-x-2'>
                <Checkbox
                  id='isActive'
                  checked={formData.isActive}
                  onCheckedChange={checked => handleInputChange('isActive', checked === true)}
                />
                <Label htmlFor='isActive' className='text-sm font-medium'>
                  Cliente activo
                </Label>
              </div>

              {/* Action Buttons */}
              <div className='flex justify-end space-x-4 pt-6'>
                <Button type='button' variant='outline' onClick={handleCancel} disabled={saving}>
                  <X className='mr-2 h-4 w-4' />
                  Cancelar
                </Button>
                <Button type='submit' disabled={saving}>
                  {saving ? (
                    <>
                      <div className='mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white' />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className='mr-2 h-4 w-4' />
                      Guardar Cambios
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Client Info Summary */}
        {client && (
          <Card className='mt-6'>
            <CardHeader>
              <CardTitle>Información del Sistema</CardTitle>
            </CardHeader>
            <CardContent className='space-y-2'>
              <div className='flex justify-between text-sm'>
                <span className='text-gray-600'>ID del Cliente:</span>
                <span className='font-mono'>{client.id}</span>
              </div>
              <div className='flex justify-between text-sm'>
                <span className='text-gray-600'>Creado:</span>
                <span>{new Date(client.createdAt).toLocaleDateString('es-GT')}</span>
              </div>
              <div className='flex justify-between text-sm'>
                <span className='text-gray-600'>Última actualización:</span>
                <span>{new Date(client.updatedAt).toLocaleDateString('es-GT')}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
