'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const PROVIDERS = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'google', label: 'Google (Gemini)' },
  { value: 'anthropic', label: 'Anthropic (Claude)' },
  { value: 'cohere', label: 'Cohere' },
];

interface AiConfig {
  id: string;
  provider: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AiConfigPage() {
  const [configs, setConfigs] = useState<AiConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    provider: 'openai',
    apiKey: '',
  });

  // Cargar configuraciones
  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/ai-providers');
      const data = await res.json();

      if (data.success) {
        setConfigs(data.data);
      } else {
        setError(data.error || 'Error al cargar configuraciones');
      }
    } catch (err) {
      setError('Error al cargar configuraciones');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.apiKey.trim()) {
      setError('La API Key es requerida');
      return;
    }

    try {
      setSaving(true);
      const res = await fetch('/api/admin/ai-providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(data.message);
        setFormData({ provider: 'openai', apiKey: '' });
        await fetchConfigs();
      } else {
        setError(data.error || 'Error al guardar configuración');
      }
    } catch (err) {
      setError('Error al guardar configuración');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/ai-providers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(data.message);
        await fetchConfigs();
      } else {
        setError(data.error || 'Error al actualizar');
      }
    } catch (err) {
      setError('Error al actualizar');
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta configuración?')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/ai-providers/${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(data.message);
        await fetchConfigs();
      } else {
        setError(data.error || 'Error al eliminar');
      }
    } catch (err) {
      setError('Error al eliminar');
      console.error(err);
    }
  };

  const getProviderLabel = (provider: string) => {
    return PROVIDERS.find((p) => p.value === provider)?.label || provider;
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración de Proveedores AI</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona las API keys de tus proveedores de IA (OpenAI, Google, Anthropic, etc.)
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {/* Formulario para agregar/actualizar */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Agregar o Actualizar Proveedor</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="provider">Proveedor</Label>
            <Select
              value={formData.provider}
              onValueChange={(value) =>
                setFormData({ ...formData, provider: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROVIDERS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="Ingresa tu API Key"
              value={formData.apiKey}
              onChange={(e) =>
                setFormData({ ...formData, apiKey: e.target.value })
              }
              required
            />
            <p className="text-xs text-muted-foreground">
              La API Key se encriptará y almacenará de forma segura
            </p>
          </div>

          <Button type="submit" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar Configuración'}
          </Button>
        </form>
      </Card>

      {/* Lista de configuraciones */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Configuraciones Activas</h2>

        {loading ? (
          <p className="text-muted-foreground">Cargando...</p>
        ) : configs.length === 0 ? (
          <p className="text-muted-foreground">No hay configuraciones guardadas</p>
        ) : (
          <div className="space-y-3">
            {configs.map((config) => (
              <div
                key={config.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{getProviderLabel(config.provider)}</p>
                  <p className="text-sm text-muted-foreground">
                    Actualizado: {new Date(config.updatedAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggle(config.id, config.isActive)}
                    className={`px-4 py-2 rounded text-sm font-medium transition ${
                      config.isActive
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {config.isActive ? 'Activo' : 'Inactivo'}
                  </button>

                  <button
                    onClick={() => handleDelete(config.id)}
                    className="px-4 py-2 rounded text-sm font-medium bg-red-100 text-red-800 hover:bg-red-200 transition"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
