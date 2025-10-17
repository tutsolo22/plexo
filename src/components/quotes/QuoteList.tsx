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
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit, 
  Copy, 
  Send, 
  Download,
  Trash2,
  MoreHorizontal,
  Calendar,
  User,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';

interface Quote {
  id: string;
  quoteNumber: string;
  status: string;
  subtotal: number;
  discount: number;
  total: number;
  validUntil: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
  viewedAt?: string;
  respondedAt?: string;
  client: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  event?: {
    id: string;
    title: string;
    date: string;
    startTime?: string;
    status: string;
  };
  template?: {
    id: string;
    name: string;
    type: string;
    category: string;
  };
  packages: Array<{
    id: string;
    name: string;
    subtotal: number;
  }>;
  _count: {
    comments: number;
  };
}

interface QuoteFilters {
  search: string;
  status: string;
  clientId: string;
  startDate: string;
  endDate: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface QuoteListProps {
  initialFilters?: Partial<QuoteFilters>;
  onQuoteSelect?: (quote: Quote) => void;
  showActions?: boolean;
  className?: string;
}

const statusConfig = {
  DRAFT: { label: 'Borrador', color: 'bg-gray-100 text-gray-800', icon: Edit },
  PENDING_MANAGER: { label: 'Pendiente Aprobación', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  REJECTED_BY_MANAGER: { label: 'Rechazada', color: 'bg-red-100 text-red-800', icon: XCircle },
  APPROVED_BY_MANAGER: { label: 'Aprobada', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  SENT_TO_CLIENT: { label: 'Enviada', color: 'bg-blue-100 text-blue-800', icon: Send },
  CLIENT_REQUESTED_CHANGES: { label: 'Cambios Solicitados', color: 'bg-orange-100 text-orange-800', icon: AlertCircle },
  ACCEPTED_BY_CLIENT: { label: 'Aceptada', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
  EXPIRED: { label: 'Expirada', color: 'bg-gray-100 text-gray-600', icon: Clock },
  CANCELLED: { label: 'Cancelada', color: 'bg-red-100 text-red-800', icon: XCircle },
};

export default function QuoteList({
  initialFilters = {},
  onQuoteSelect,
  showActions = true,
  className = '',
}: QuoteListProps) {
  // Estados principales
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Record<string, { count: number; total: number }>>({});
  
  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  // Estados de filtros
  const [filters, setFilters] = useState<QuoteFilters>({
    search: '',
    status: '',
    clientId: '',
    startDate: '',
    endDate: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    ...initialFilters,
  });
  
  const [showFilters, setShowFilters] = useState(false);
  const [selectedQuotes, setSelectedQuotes] = useState<string[]>([]);

  // Cargar cotizaciones
  const loadQuotes = async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        ),
      });

      const response = await fetch(`/api/quotes?${params}`);
      const data = await response.json();

      if (data.success) {
        setQuotes(data.data);
        setCurrentPage(data.pagination.currentPage);
        setTotalPages(data.pagination.totalPages);
        setTotalCount(data.pagination.totalCount);
        setStats(data.stats || {});
      } else {
        setError(data.error || 'Error cargando cotizaciones');
      }
    } catch (error) {
      console.error('Error loading quotes:', error);
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  // Efectos
  useEffect(() => {
    loadQuotes(1);
  }, [filters]);

  // Funciones de filtro
  const handleFilterChange = (key: keyof QuoteFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      clientId: '',
      startDate: '',
      endDate: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  };

  // Funciones de acción
  const handleDuplicateQuote = async (quoteId: string) => {
    try {
      const response = await fetch(`/api/quotes/${quoteId}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newQuoteNumber: true }),
      });

      const result = await response.json();
      if (result.success) {
        await loadQuotes(currentPage);
        alert(`Cotización duplicada como ${result.data.quoteNumber}`);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error duplicating quote:', error);
      alert('Error duplicando cotización');
    }
  };

  const handleSendQuote = async (quoteId: string) => {
    try {
      const response = await fetch(`/api/quotes/${quoteId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          includePDF: true,
          generatePDF: true,
          emailTemplate: 'professional',
        }),
      });

      const result = await response.json();
      if (result.success) {
        await loadQuotes(currentPage);
        alert('Cotización enviada exitosamente');
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error sending quote:', error);
      alert('Error enviando cotización');
    }
  };

  const handleGeneratePDF = async (quoteId: string) => {
    try {
      const response = await fetch(`/api/quotes/${quoteId}/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ engine: 'react-pdf' }),
      });

      const result = await response.json();
      if (result.success) {
        window.open(result.pdfUrl, '_blank');
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generando PDF');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.DRAFT;
    const IconComponent = config.icon;
    
    return (
      <Badge className={config.color}>
        <IconComponent className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  if (loading && quotes.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando cotizaciones...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">
            Cotizaciones ({totalCount})
          </h2>
        </div>
        {showActions && (
          <div className="flex items-center gap-2">
            <Button onClick={() => loadQuotes(currentPage)} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Cotización
            </Button>
          </div>
        )}
      </div>

      {/* Estadísticas */}
      {Object.keys(stats).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Object.entries(stats).map(([status, data]) => {
            const config = statusConfig[status as keyof typeof statusConfig];
            return (
              <Card key={status} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">{config?.label || status}</p>
                      <p className="text-xl font-bold">{data.count}</p>
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatCurrency(data.total)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Filtros</CardTitle>
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              size="sm"
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? 'Ocultar' : 'Mostrar'} Filtros
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Búsqueda rápida */}
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por número, cliente o notas..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              className="px-3 py-2 border border-gray-300 rounded-md"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">Todos los estados</option>
              {Object.entries(statusConfig).map(([value, config]) => (
                <option key={value} value={value}>{config.label}</option>
              ))}
            </select>
          </div>

          {/* Filtros avanzados */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="startDate">Fecha desde</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Fecha hasta</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sortBy">Ordenar por</Label>
                <select
                  id="sortBy"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                >
                  <option value="createdAt">Fecha de creación</option>
                  <option value="updatedAt">Última actualización</option>
                  <option value="total">Total</option>
                  <option value="validUntil">Fecha de vencimiento</option>
                  <option value="quoteNumber">Número de cotización</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sortOrder">Orden</Label>
                <select
                  id="sortOrder"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={filters.sortOrder}
                  onChange={(e) => handleFilterChange('sortOrder', e.target.value as 'asc' | 'desc')}
                >
                  <option value="desc">Descendente</option>
                  <option value="asc">Ascendente</option>
                </select>
              </div>
              <div className="md:col-span-4 flex justify-end">
                <Button onClick={clearFilters} variant="outline" size="sm">
                  Limpiar Filtros
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de cotizaciones */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        {quotes.map((quote) => (
          <Card key={quote.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-semibold text-blue-600 hover:text-blue-800 cursor-pointer">
                      {quote.quoteNumber}
                    </h3>
                    {getStatusBadge(quote.status)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="font-medium">{quote.client.name}</p>
                        <p className="text-gray-600">{quote.client.email}</p>
                      </div>
                    </div>

                    {quote.event && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="font-medium">{quote.event.title}</p>
                          <p className="text-gray-600">{formatDate(quote.event.date)}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="font-medium">{formatCurrency(quote.total)}</p>
                        <p className="text-gray-600">Válida hasta {formatDate(quote.validUntil)}</p>
                      </div>
                    </div>
                  </div>

                  {quote.packages.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {quote.packages.map((pkg) => (
                        <Badge key={pkg.id} variant="outline" className="text-xs">
                          {pkg.name}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                    <span>Creada: {formatDate(quote.createdAt)}</span>
                    {quote.sentAt && <span>Enviada: {formatDate(quote.sentAt)}</span>}
                    {quote._count.comments > 0 && (
                      <span>{quote._count.comments} comentario{quote._count.comments !== 1 ? 's' : ''}</span>
                    )}
                  </div>
                </div>

                {showActions && (
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      onClick={() => onQuoteSelect?.(quote)}
                      variant="outline"
                      size="sm"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => handleGeneratePDF(quote.id)}
                      variant="outline"
                      size="sm"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => handleDuplicateQuote(quote.id)}
                      variant="outline"
                      size="sm"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => handleSendQuote(quote.id)}
                      variant="outline"
                      size="sm"
                      disabled={quote.status === 'CANCELLED' || quote.status === 'EXPIRED'}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Mostrando {((currentPage - 1) * 10) + 1} a {Math.min(currentPage * 10, totalCount)} de {totalCount} cotizaciones
          </p>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => loadQuotes(currentPage - 1)}
              disabled={currentPage <= 1}
              variant="outline"
              size="sm"
            >
              Anterior
            </Button>
            <span className="text-sm font-medium">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              onClick={() => loadQuotes(currentPage + 1)}
              disabled={currentPage >= totalPages}
              variant="outline"
              size="sm"
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      {loading && quotes.length > 0 && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          <span>Actualizando...</span>
        </div>
      )}
    </div>
  );
}