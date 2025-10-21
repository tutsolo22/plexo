'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Users, TrendingUp, Clock } from 'lucide-react';

interface WidgetStats {
  totalConversations: number;
  activeConversations: number;
  totalMessages: number;
  averageResponseTime: number;
  topQuestions: Array<{
    question: string;
    count: number;
  }>;
  usageByDay: Array<{
    date: string;
    conversations: number;
    messages: number;
  }>;
}

export function WidgetAnalytics() {
  const [stats, setStats] = useState<WidgetStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/widget/analytics');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Cargando analytics...</div>;
  }

  if (!stats) {
    return <div className="text-center py-8">No se pudieron cargar las estadísticas</div>;
  }

  return (
    <div className="space-y-6">
      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalConversations}</p>
                <p className="text-sm text-muted-foreground">Conversaciones Totales</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Users className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.activeConversations}</p>
                <p className="text-sm text-muted-foreground">Conversaciones Activas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalMessages}</p>
                <p className="text-sm text-muted-foreground">Mensajes Totales</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Clock className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{stats.averageResponseTime}s</p>
                <p className="text-sm text-muted-foreground">Tiempo de Respuesta</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Preguntas Más Frecuentes */}
        <Card>
          <CardHeader>
            <CardTitle>Preguntas Más Frecuentes</CardTitle>
            <CardDescription>
              Las preguntas más realizadas por los usuarios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topQuestions.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge variant="secondary">{index + 1}</Badge>
                    <span className="text-sm">{item.question}</span>
                  </div>
                  <Badge variant="outline">{item.count} veces</Badge>
                </div>
              ))}
              {stats.topQuestions.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No hay preguntas registradas aún
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Uso por Día */}
        <Card>
          <CardHeader>
            <CardTitle>Actividad Diaria</CardTitle>
            <CardDescription>
              Conversaciones y mensajes por día
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.usageByDay.slice(0, 7).map((day, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {new Date(day.date).toLocaleDateString()}
                  </span>
                  <div className="flex space-x-2">
                    <Badge variant="outline">{day.conversations} conv.</Badge>
                    <Badge variant="outline">{day.messages} msg.</Badge>
                  </div>
                </div>
              ))}
              {stats.usageByDay.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No hay actividad registrada aún
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Tendencia (simulado) */}
      <Card>
        <CardHeader>
          <CardTitle>Tendencia de Uso</CardTitle>
          <CardDescription>
            Evolución del uso del widget en los últimos 30 días
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
            <div className="text-center">
              <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Gráfico de tendencias próximamente</p>
              <p className="text-sm text-gray-400 mt-2">
                Se implementará con una librería de gráficos como Chart.js o Recharts
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}