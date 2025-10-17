'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

export default function NewClientPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    clientType: 'GENERAL' as 'GENERAL' | 'COLABORADOR' | 'EXTERNO',
    address: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear el cliente');
      }

      if (data.success) {
        toast.success('Cliente creado exitosamente');
        router.push(`/dashboard/clients/${data.data.id}`);
      } else {
        throw new Error(data.error || 'Error desconocido');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className='container mx-auto space-y-6 py-6'>
      {/* Header */}
      <div className='flex items-center space-x-4'>
        <Button variant='ghost' onClick={() => router.back()}>
          <ArrowLeft className='mr-2 h-4 w-4' />
          Volver
        </Button>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Nuevo Cliente</h1>
          <p className='text-muted-foreground'>Registra un nuevo cliente en el sistema</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className='grid gap-6 lg:grid-cols-3'>
          {/* Main Form */}
          <div className='lg:col-span-2'>
            <Card>
              <CardHeader>
                <CardTitle>Información del Cliente</CardTitle>
                <CardDescription>Completa los datos básicos del cliente</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid gap-4 md:grid-cols-2'>
                  <div className='space-y-2'>
                    <Label htmlFor='name'>
                      Nombre completo <span className='text-red-500'>*</span>
                    </Label>
                    <Input
                      id='name'
                      value={formData.name}
                      onChange={e => handleInputChange('name', e.target.value)}
                      placeholder='Ej: Juan Carlos Pérez'
                      required
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='company'>Empresa</Label>
                    <Input
                      id='company'
                      value={formData.company}
                      onChange={e => handleInputChange('company', e.target.value)}
                      placeholder='Ej: Empresa SA de CV'
                    />
                  </div>
                </div>

                <div className='grid gap-4 md:grid-cols-2'>
                  <div className='space-y-2'>
                    <Label htmlFor='email'>Email</Label>
                    <Input
                      id='email'
                      type='email'
                      value={formData.email}
                      onChange={e => handleInputChange('email', e.target.value)}
                      placeholder='correo@ejemplo.com'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='phone'>Teléfono</Label>
                    <Input
                      id='phone'
                      value={formData.phone}
                      onChange={e => handleInputChange('phone', e.target.value)}
                      placeholder='Ej: +502 1234-5678'
                    />
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='address'>Dirección</Label>
                  <Textarea
                    id='address'
                    value={formData.address}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      handleInputChange('address', e.target.value)
                    }
                    placeholder='Dirección del cliente'
                    rows={3}
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='notes'>Notas adicionales</Label>
                  <Textarea
                    id='notes'
                    value={formData.notes}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      handleInputChange('notes', e.target.value)
                    }
                    placeholder='Notas adicionales sobre el cliente'
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className='space-y-6'>
            {/* Client Type */}
            <Card>
              <CardHeader>
                <CardTitle>Tipo de Cliente</CardTitle>
                <CardDescription>Selecciona el tipo de acceso y precios</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-2'>
                  <Label htmlFor='clientType'>Tipo</Label>
                  <Select
                    value={formData.clientType}
                    onValueChange={(value: 'GENERAL' | 'COLABORADOR' | 'EXTERNO') =>
                      handleInputChange('clientType', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='GENERAL'>General - Precios públicos</SelectItem>
                      <SelectItem value='COLABORADOR'>
                        Colaborador - Descuentos especiales
                      </SelectItem>
                      <SelectItem value='EXTERNO'>Externo - Sistema de créditos</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className='mt-2 text-sm text-muted-foreground'>
                    {formData.clientType === 'GENERAL' && (
                      <p>Clientes con acceso a precios públicos estándar</p>
                    )}
                    {formData.clientType === 'COLABORADOR' && (
                      <p>Empleados y colaboradores internos con descuentos</p>
                    )}
                    {formData.clientType === 'EXTERNO' && (
                      <p>Clientes con sistema de créditos y conversion de descuentos</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className='pt-6'>
                <div className='flex flex-col gap-2'>
                  <Button type='submit' disabled={isLoading} className='w-full'>
                    {isLoading ? (
                      <>Guardando...</>
                    ) : (
                      <>
                        <Save className='mr-2 h-4 w-4' />
                        Crear Cliente
                      </>
                    )}
                  </Button>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => router.back()}
                    disabled={isLoading}
                    className='w-full'
                  >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
