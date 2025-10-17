'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Mail, 
  Send, 
  Eye, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Search,
  Filter,
  BarChart3,
  User,
  Calendar,
  FileText,
  Download,
  RefreshCw
} from 'lucide-react';

interface EmailLog {
  id: string;
  recipientEmail: string;
  subject: string;
  template: string;
  status: string;
  messageId?: string;
  trackingToken?: string;
  sentAt: string;
  openedAt?: string;
  clickedAt?: string;
  failureReason?: string;
  metadata?: any;
  quote: {
    id: string;
    quoteNumber: string;
    total: number;
    client: {
      id: string;
      name: string;
      email: string;
    };
    event?: {
      id: string;
      title: string;
      startDate: string;
    };
  };
}

interface EmailStats {
  total: number;
  byStatus: Record<string, number>;
  openRate: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const EmailDashboard: React.FC = () => {
  const [emails, setEmails] = useState<EmailLog[]>([]);
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    template: '',
    dateFrom: '',
    dateTo: '',
    page: 1,
    limit: 10
  });

  useEffect(() => {
    fetchEmails();
  }, [filters]);

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          queryParams.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/emails?${queryParams}`);
      if (response.ok) {
        const data = await response.json();
        setEmails(data.data.emails);
        setStats(data.data.stats);
        setPagination(data.data.pagination);
        setError(null);
      } else {
        throw new Error('Error loading emails');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading emails');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key === 'page' ? parseInt(value) || 1 : 1 // Reset page unless changing page
    }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <Send className="h-4 w-4 text-blue-500" />;
      case 'delivered': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'opened': return <Eye className="h-4 w-4 text-purple-500" />;
      case 'clicked': return <BarChart3 className="h-4 w-4 text-orange-500" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'opened': return 'bg-purple-100 text-purple-800';
      case 'clicked': return 'bg-orange-100 text-orange-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'sent': return 'Enviado';
      case 'delivered': return 'Entregado';
      case 'opened': return 'Abierto';
      case 'clicked': return 'Clic realizado';
      case 'failed': return 'Fallido';
      default: return status;
    }
  };

  const getTemplateText = (template: string) => {
    switch (template) {
      case 'basic': return 'Básica';
      case 'professional': return 'Profesional';
      case 'custom': return 'Personalizada';
      default: return template;
    }
  };

  if (loading && emails.length === 0) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Emails</h1>
          <p className="text-gray-600">Seguimiento y análisis de emails de cotizaciones</p>
        </div>
        <Button onClick={fetchEmails} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Mail className="h-8 w-8 text-blue-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Total Enviados</p>
                  <p className="text-lg font-semibold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Entregados</p>
                  <p className="text-lg font-semibold">{stats.byStatus['delivered'] || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Eye className="h-8 w-8 text-purple-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Abiertos</p>
                  <p className="text-lg font-semibold">{stats.byStatus['opened'] || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-orange-500" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Tasa Apertura</p>
                  <p className="text-lg font-semibold">{stats.openRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Email, cotización, cliente..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="status">Estado</Label>
              <select
                id="status"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">Todos los estados</option>
                <option value="sent">Enviado</option>
                <option value="delivered">Entregado</option>
                <option value="opened">Abierto</option>
                <option value="clicked">Clic realizado</option>
                <option value="failed">Fallido</option>
              </select>
            </div>

            <div>
              <Label htmlFor="template">Plantilla</Label>
              <select
                id="template"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filters.template}
                onChange={(e) => handleFilterChange('template', e.target.value)}
              >
                <option value="">Todas las plantillas</option>
                <option value="basic">Básica</option>
                <option value="professional">Profesional</option>
                <option value="custom">Personalizada</option>
              </select>
            </div>

            <div>
              <Label htmlFor="dateFrom">Desde</Label>
              <Input
                id="dateFrom"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error state */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center text-red-800">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de emails */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Emails</CardTitle>
        </CardHeader>
        <CardContent>
          {emails.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay emails
              </h3>
              <p className="text-gray-600">
                No se encontraron emails con los filtros actuales.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {emails.map((email) => (
                <div key={email.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {getStatusIcon(email.status)}
                        <div>
                          <h4 className="font-medium text-gray-900">{email.subject}</h4>
                          <p className="text-sm text-gray-600">
                            Para: {email.recipientEmail}
                          </p>
                        </div>
                        <Badge className={getStatusColor(email.status)}>
                          {getStatusText(email.status)}
                        </Badge>
                        <Badge variant="outline">
                          {getTemplateText(email.template)}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-2" />
                          Cotización: {email.quote.quoteNumber}
                        </div>
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          Cliente: {email.quote.client.name}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          Enviado: {new Date(email.sentAt).toLocaleDateString()}
                        </div>
                      </div>

                      {email.openedAt && (
                        <div className="mt-2 text-xs text-green-600">
                          <Eye className="h-3 w-3 inline mr-1" />
                          Abierto: {new Date(email.openedAt).toLocaleDateString()} a las {new Date(email.openedAt).toLocaleTimeString()}
                        </div>
                      )}

                      {email.failureReason && (
                        <div className="mt-2 text-xs text-red-600">
                          <AlertCircle className="h-3 w-3 inline mr-1" />
                          Error: {email.failureReason}
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/dashboard/quotes/${email.quote.id}`, '_blank')}
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Ver Cotización
                      </Button>
                      
                      {email.quote.event && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`/dashboard/events/${email.quote.event?.id}`, '_blank')}
                        >
                          <Calendar className="h-4 w-4 mr-1" />
                          Ver Evento
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paginación */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
            {pagination.total} emails
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasPrev}
              onClick={() => handleFilterChange('page', (pagination.page - 1).toString())}
            >
              Anterior
            </Button>
            
            <span className="px-3 py-2 text-sm">
              Página {pagination.page} de {pagination.totalPages}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasNext}
              onClick={() => handleFilterChange('page', (pagination.page + 1).toString())}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailDashboard;