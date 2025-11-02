'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Building2, Palette, Share2, Save, Upload, Image as ImageIcon } from 'lucide-react';

interface BusinessIdentity {
  id?: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  logo?: string;
  slogan?: string;
  facebook?: string;
  instagram?: string;
  twitter?: string;
  website?: string;
}

export default function BrandingPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<BusinessIdentity>({
    name: '',
    address: '',
    phone: '',
    email: '',
    logo: '',
    slogan: '',
    facebook: '',
    instagram: '',
    twitter: '',
    website: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    loadBusinessIdentity();
  }, []);

  const loadBusinessIdentity = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/business-identity', { cache: 'no-store' });
      const json = await res.json();
      
      if (json.success && json.data) {
        setFormData(json.data);
      }
    } catch (e) {
      console.error(e);
      toast({
        type: 'error',
        title: 'Error',
        description: 'No se pudo cargar la información',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/business-identity', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      
      if (json.success) {
        toast({
          type: 'success',
          title: 'Guardado',
          description: 'Información actualizada exitosamente',
        });
        if (json.data) {
          setFormData(json.data);
        }
      } else {
        toast({
          type: 'error',
          title: 'Error',
          description: json.error || 'No se pudo guardar la información',
        });
      }
    } catch (e) {
      console.error(e);
      toast({
        type: 'error',
        title: 'Error',
        description: 'No se pudo guardar la información',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof BusinessIdentity, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Cargando información del negocio...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Personalización</h1>
          <p className="text-muted-foreground">
            Configura la identidad visual y información de tu negocio
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </div>

      {/* Información Básica */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-plexo-purple" />
            Información del Negocio
          </CardTitle>
          <CardDescription>
            Información básica de tu empresa o negocio
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Nombre del Negocio <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Ej: La Casona del Lago"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                placeholder="+52 55 1234 5678"
                value={formData.phone || ''}
                onChange={(e) => handleChange('phone', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="contacto@tunegocio.com"
                value={formData.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Sitio Web</Label>
              <Input
                id="website"
                placeholder="https://www.tunegocio.com"
                value={formData.website || ''}
                onChange={(e) => handleChange('website', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Dirección</Label>
            <Input
              id="address"
              placeholder="Calle, Colonia, Ciudad, Estado, CP"
              value={formData.address || ''}
              onChange={(e) => handleChange('address', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Identidad Visual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-plexo-purple" />
            Identidad Visual
          </CardTitle>
          <CardDescription>
            Logo, eslogan y elementos visuales de tu marca
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="logo">URL del Logo</Label>
            <div className="flex gap-2">
              <Input
                id="logo"
                placeholder="https://ejemplo.com/logo.png o /uploads/logo.png"
                value={formData.logo || ''}
                onChange={(e) => handleChange('logo', e.target.value)}
              />
              <Button variant="outline" size="icon" title="Subir imagen">
                <Upload className="h-4 w-4" />
              </Button>
            </div>
            {formData.logo && (
              <div className="mt-2 p-4 border rounded-lg bg-gray-50">
                <p className="text-xs text-muted-foreground mb-2">Vista previa:</p>
                <img
                  src={formData.logo}
                  alt="Logo preview"
                  className="max-w-xs max-h-32 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="slogan">Eslogan</Label>
            <Input
              id="slogan"
              placeholder="El lugar perfecto para tus eventos"
              value={formData.slogan || ''}
              onChange={(e) => handleChange('slogan', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Redes Sociales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-plexo-purple" />
            Redes Sociales
          </CardTitle>
          <CardDescription>
            Enlaces a tus perfiles en redes sociales
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="facebook">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 fill-blue-600" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Facebook
                </div>
              </Label>
              <Input
                id="facebook"
                placeholder="https://facebook.com/tunegocio"
                value={formData.facebook || ''}
                onChange={(e) => handleChange('facebook', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instagram">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 fill-pink-600" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  Instagram
                </div>
              </Label>
              <Input
                id="instagram"
                placeholder="https://instagram.com/tunegocio"
                value={formData.instagram || ''}
                onChange={(e) => handleChange('instagram', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="twitter">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 fill-blue-400" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
                Twitter / X
              </div>
            </Label>
            <Input
              id="twitter"
              placeholder="https://twitter.com/tunegocio"
              value={formData.twitter || ''}
              onChange={(e) => handleChange('twitter', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Botón de guardar al final */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Guardando...' : 'Guardar Todos los Cambios'}
        </Button>
      </div>
    </div>
  );
}
