'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Send, 
  Mail, 
  Eye, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Search,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';

interface EmailLog {
  id: string;
  toEmail: string;
  subject: string;
  template: string;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'OPENED' | 'FAILED';
  sentAt: string;
  openedAt?: string;
  failureReason?: string;
  trackingToken: string;
  quote: {
    id: string;
    quoteNumber: string;
    title: string;
    client: {
      name: string;
    };
  };
}

interface EmailStats {
  total: number;
  sent: number;
  delivered: number;
  opened: number;
  failed: number;
  pending: number;
  openRate: number;
  deliveryRate: number;
}

const EmailManager: React.FC = () => {
  const [emails, setEmails] = useState<EmailLog[]>([]);
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    dateFrom: '',
    dateTo: ''
  });

  // Test email form
  const [testEmail, setTestEmail] = useState({
    to: '',
    subject: 'Prueba - Sistema de Gestión de Eventos',
    template: 'professional',
    quoteId: ''
  });

  const [quotes, setQuotes] = useState<any[]>([]);

  useEffect(() => {
    fetchEmails();
    fetchQuotes();
  }, [filters]);

  const fetchEmails = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);

      const response = await fetch(`/api/emails?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setEmails(data.data.emails || []);
        setStats(data.data.stats || null);
      }
    } catch (error) {
      console.error('Error fetching emails:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuotes = async () => {
    try {
      const response = await fetch('/api/quotes?limit=50');
      if (response.ok) {
        const data = await response.json();
        setQuotes(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching quotes:', error);
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail.to || !testEmail.quoteId) {
      alert('Email y cotización son requeridos');
      return;
    }

    setSending(true);
    try {
      const response = await fetch(`/api/quotes/${testEmail.quoteId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template: testEmail.template,
          customEmail: testEmail.to,
          customSubject: testEmail.subject
        })
      });

      if (response.ok) {
        alert('Email de prueba enviado exitosamente');
        fetchEmails(); // Refresh list
        setTestEmail(prev => ({ ...prev, to: '', quoteId: '' }));
      } else {
        const error = await response.json();
        alert(error.error || 'Error enviando email');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error enviando email de prueba');
    } finally {
      setSending(false);
    }
  };

  const resendEmail = async (emailId: string) => {
    try {
      const response = await fetch(`/api/emails/${emailId}/resend`, {
        method: 'POST'
      });

      if (response.ok) {
        alert('Email reenviado exitosamente');
        fetchEmails();
      } else {
        const error = await response.json();
        alert(error.error || 'Error reenviando email');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error reenviando email');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'SENT': return <Send className="h-4 w-4 text-blue-500" />;
      case 'DELIVERED': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'OPENED': return <Eye className="h-4 w-4 text-purple-500" />;
      case 'FAILED': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Mail className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'SENT': return 'bg-blue-100 text-blue-800';
      case 'DELIVERED': return 'bg-green-100 text-green-800';
      case 'OPENED': return 'bg-purple-100 text-purple-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Pendiente';
      case 'SENT': return 'Enviado';
      case 'DELIVERED': return 'Entregado';
      case 'OPENED': return 'Abierto';
      case 'FAILED': return 'Fallido';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Sistema de Email</h1>
          <p className="mt-2 text-gray-600">
            Gestión y seguimiento de emails enviados desde Gestión de Eventos
          </p>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Mail className="h-8 w-8 text-blue-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Total</p>
                    <p className="text-lg font-semibold">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Send className="h-8 w-8 text-green-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Enviados</p>
                    <p className="text-lg font-semibold">{stats.sent}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-purple-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Entregados</p>
                    <p className="text-lg font-semibold">{stats.delivered}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Eye className="h-8 w-8 text-indigo-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Abiertos</p>
                    <p className="text-lg font-semibold">{stats.opened}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="text-center w-full">
                    <p className="text-sm font-medium text-gray-600">Tasa Apertura</p>
                    <p className="text-lg font-semibold text-green-600">
                      {stats.openRate.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="text-center w-full">
                    <p className="text-sm font-medium text-gray-600">Tasa Entrega</p>
                    <p className="text-lg font-semibold text-blue-600">
                      {stats.deliveryRate.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Filters */}
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
                        placeholder="Email, asunto..."
                        value={filters.search}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="status">Estado</Label>
                    <select
                      id="status"
                      value={filters.status}
                      onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Todos</option>
                      <option value="PENDING">Pendiente</option>
                      <option value="SENT">Enviado</option>
                      <option value="DELIVERED">Entregado</option>
                      <option value="OPENED">Abierto</option>
                      <option value="FAILED">Fallido</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="dateFrom">Desde</Label>
                    <Input
                      id="dateFrom"
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="dateTo">Hasta</Label>
                    <Input
                      id="dateTo"
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex justify-end mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setFilters({ status: '', search: '', dateFrom: '', dateTo: '' })}
                  >
                    Limpiar Filtros
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Email List */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Mail className="h-5 w-5 mr-2" />
                    Historial de Emails ({emails.length})
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchEmails}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Actualizar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {emails.length === 0 ? (
                  <div className="text-center py-8">
                    <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No hay emails
                    </h3>
                    <p className="text-gray-600">
                      No se han enviado emails todavía o no hay resultados para los filtros seleccionados.
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
                              <h4 className="font-medium text-gray-900">
                                {email.subject}
                              </h4>
                              <Badge className={getStatusColor(email.status)}>
                                {getStatusText(email.status)}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">Para:</span> {email.toEmail}
                              </div>
                              <div>
                                <span className="font-medium">Cotización:</span> {email.quote.quoteNumber}
                              </div>
                              <div>
                                <span className="font-medium">Cliente:</span> {email.quote.client.name}
                              </div>
                            </div>

                            <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500">
                              <span>Enviado: {new Date(email.sentAt).toLocaleString()}</span>
                              {email.openedAt && (
                                <span>Abierto: {new Date(email.openedAt).toLocaleString()}</span>
                              )}
                              <span>Plantilla: {email.template}</span>
                            </div>

                            {email.failureReason && (
                              <Alert className="mt-3 border-red-200 bg-red-50">
                                <AlertTriangle className="h-4 w-4 text-red-600" />
                                <AlertDescription className="text-red-800">
                                  Error: {email.failureReason}
                                </AlertDescription>
                              </Alert>
                            )}
                          </div>

                          <div className="flex space-x-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(`/dashboard/quotes/${email.quote.id}`, '_blank')}
                            >
                              Ver Cotización
                            </Button>
                            {email.status === 'FAILED' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => resendEmail(email.id)}
                              >
                                <RefreshCw className="h-4 w-4 mr-1" />
                                Reenviar
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
          </div>

          {/* Sidebar - Test Email */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Send className="h-5 w-5 mr-2" />
                  Email de Prueba
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="testTo">Email Destinatario</Label>
                  <Input
                    id="testTo"
                    type="email"
                    value={testEmail.to}
                    onChange={(e) => setTestEmail(prev => ({ ...prev, to: e.target.value }))}
                    placeholder="test@ejemplo.com"
                  />
                </div>

                <div>
                  <Label htmlFor="testSubject">Asunto</Label>
                  <Input
                    id="testSubject"
                    value={testEmail.subject}
                    onChange={(e) => setTestEmail(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Asunto del email"
                  />
                </div>

                <div>
                  <Label htmlFor="testQuote">Cotización</Label>
                  <select
                    id="testQuote"
                    value={testEmail.quoteId}
                    onChange={(e) => setTestEmail(prev => ({ ...prev, quoteId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar cotización</option>
                    {quotes.map(quote => (
                      <option key={quote.id} value={quote.id}>
                        {quote.quoteNumber} - {quote.event?.title || 'Sin evento'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="testTemplate">Plantilla</Label>
                  <select
                    id="testTemplate"
                    value={testEmail.template}
                    onChange={(e) => setTestEmail(prev => ({ ...prev, template: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="basic">Básica</option>
                    <option value="professional">Profesional</option>
                    <option value="custom">Personalizada</option>
                  </select>
                </div>

                <Button
                  onClick={sendTestEmail}
                  disabled={sending || !testEmail.to || !testEmail.quoteId}
                  className="w-full"
                >
                  {sending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Enviar Prueba
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Acciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => window.open('/dashboard/quotes', '_blank')}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Ver Cotizaciones
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    const csvData = emails.map(email => ({
                      Email: email.toEmail,
                      Asunto: email.subject,
                      Estado: getStatusText(email.status),
                      Enviado: new Date(email.sentAt).toLocaleString(),
                      Cotización: email.quote.quoteNumber,
                      Cliente: email.quote.client.name
                    }));
                    
                    const csv = [
                      Object.keys(csvData[0] || {}).join(','),
                      ...csvData.map(row => Object.values(row).join(','))
                    ].join('\n');
                    
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `emails_${new Date().toISOString().split('T')[0]}.csv`;
                    a.click();
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar CSV
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailManager;