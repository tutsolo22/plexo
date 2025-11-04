'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { AiConfigHistoryModal } from '@/components/ai-config-history-modal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Pencil, Trash2, Plus, RefreshCw, CheckCircle, AlertCircle, Eye, EyeOff, Copy, History } from 'lucide-react';

const PROVIDERS = [
  { value: 'openai', label: 'OpenAI', emoji: '🤖' },
  { value: 'google', label: 'Google (Gemini)', emoji: '🌟' },
  { value: 'anthropic', label: 'Anthropic (Claude)', emoji: '🧠' },
  { value: 'cohere', label: 'Cohere', emoji: '🎯' },
];

interface AiConfig {
  id: string;
  provider: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface EditingConfig {
  id: string;
  provider: string;
  apiKey: string;
}

export default function AiConfigPage() {
  const [configs, setConfigs] = useState<AiConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState<EditingConfig | null>(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedConfigForHistory, setSelectedConfigForHistory] = useState<{ id: string; provider: string } | null>(null);

  const [formData, setFormData] = useState({
    provider: 'openai',
    apiKey: '',
  });

  // Auto-hide alerts
  useEffect((): (() => void) | void => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect((): (() => void) | void => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

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
        setSuccess(data.message || 'Configuración guardada exitosamente');
        setFormData({ provider: 'openai', apiKey: '' });
        setShowCreateModal(false);
        setEditingConfig(null);
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
        setSuccess(data.message || `Configuración ${!isActive ? 'activada' : 'desactivada'}`);
        await fetchConfigs();
      } else {
        setError(data.error || 'Error al actualizar');
      }
    } catch (err) {
      setError('Error al actualizar');
      console.error(err);
    }
  };

  const handleDelete = async (id: string, provider: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar la configuración de ${provider}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/ai-providers/${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(data.message || 'Configuración eliminada exitosamente');
        await fetchConfigs();
      } else {
        setError(data.error || 'Error al eliminar');
      }
    } catch (err) {
      setError('Error al eliminar');
      console.error(err);
    }
  };

  const handleEdit = (config: AiConfig) => {
    setEditingConfig({ id: config.id, provider: config.provider, apiKey: '' });
    setFormData({ provider: config.provider, apiKey: '' });
    setShowCreateModal(true);
  };

  const handleOpenHistory = (id: string, provider: string) => {
    setSelectedConfigForHistory({ id, provider });
    setHistoryModalOpen(true);
  };

  const getProviderLabel = (provider: string) => {
    return PROVIDERS.find((p) => p.value === provider)?.label || provider;
  };

  const getProviderEmoji = (provider: string) => {
    return PROVIDERS.find((p) => p.value === provider)?.emoji || '📦';
  };

  const getAvailableProviders = () => {
    const usedProviders = configs.map((c) => c.provider);
    return PROVIDERS.filter((p) => !usedProviders.includes(p.value) || editingConfig?.provider === p.value);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración de Proveedores IA</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona las API keys de tus proveedores de IA y revisa el historial de cambios
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
          <p className="text-green-700">{success}</p>
        </div>
      )}

      {/* Botón para agregar */}
      <div className="flex justify-between items-center">
        <div></div>
        <Button
          onClick={() => {
            setEditingConfig(null);
            setFormData({ provider: 'openai', apiKey: '' });
            setShowCreateModal(true);
          }}
          className="gap-2"
        >
          <Plus size={20} />
          Agregar Proveedor
        </Button>
      </div>

      {/* Modal para crear/editar */}
      {showCreateModal && (
        <Card className="p-6 bg-white border-2 border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">
              {editingConfig ? `Actualizar ${getProviderLabel(editingConfig.provider)}` : 'Agregar Nuevo Proveedor'}
            </h2>
            <button
              onClick={() => {
                setShowCreateModal(false);
                setEditingConfig(null);
              }}
              className="text-slate-500 hover:text-slate-700"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="provider">Proveedor</Label>
              <Select
                value={formData.provider}
                onValueChange={(value) => setFormData({ ...formData, provider: value })}
                disabled={!!editingConfig}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableProviders().map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.emoji} {p.label}
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
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground">
                {editingConfig ? 'Dejar en blanco para mantener la actual' : 'La API Key se encriptará y almacenará de forma segura'}
              </p>
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? 'Guardando...' : editingConfig ? 'Actualizar' : 'Guardar'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingConfig(null);
                }}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Lista de configuraciones */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Configuraciones Activas</h2>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="text-center">
              <RefreshCw className="animate-spin h-8 w-8 text-slate-400 mx-auto mb-2" />
              <p className="text-muted-foreground">Cargando configuraciones...</p>
            </div>
          </div>
        ) : configs.length === 0 ? (
          <Card className="p-12 text-center bg-slate-50 border-2 border-dashed">
            <div className="text-4xl mb-2">📦</div>
            <p className="text-muted-foreground font-medium">No hay proveedores configurados</p>
            <p className="text-muted-foreground text-sm mt-1">
              Agrega tu primer proveedor de IA para comenzar
            </p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {configs.map((config) => (
              <Card key={config.id} className="p-4 hover:shadow-lg transition-shadow">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getProviderEmoji(config.provider)}</span>
                      <div>
                        <h3 className="font-semibold text-sm">{getProviderLabel(config.provider)}</h3>
                        <p className="text-xs text-muted-foreground">
                          {new Date(config.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        config.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {config.isActive ? '✓ Activo' : '○ Inactivo'}
                    </span>
                  </div>

                  <div className="flex gap-2 pt-2 flex-wrap">
                    <button
                      onClick={() => handleToggle(config.id, config.isActive)}
                      className={`flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition ${
                        config.isActive
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {config.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>

                    <button
                      onClick={() => handleEdit(config)}
                      className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded text-xs font-medium bg-amber-100 text-amber-700 hover:bg-amber-200 transition"
                    >
                      <Pencil size={14} />
                    </button>

                    <button
                      onClick={() => handleOpenHistory(config.id, config.provider)}
                      className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition"
                    >
                      <History size={14} />
                    </button>

                    <button
                      onClick={() => handleDelete(config.id, config.provider)}
                      className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* History Modal */}
      {selectedConfigForHistory && (
        <AiConfigHistoryModal
          configId={selectedConfigForHistory.id}
          provider={selectedConfigForHistory.provider}
          isOpen={historyModalOpen}
          onClose={() => {
            setHistoryModalOpen(false);
            setSelectedConfigForHistory(null);
          }}
        />
      )}
    </div>
  );
}
