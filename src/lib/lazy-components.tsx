/**
 * Componentes con Lazy Loading optimizado
 * Sistema de Gestión de Eventos V3
 * 
 * @author Manuel Antonio Tut Solorzano
 * @version 3.0.0
 * @date 2025-10-17
 */

import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

// Loading component reutilizable
const Loading = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    <span className="ml-2 text-sm text-gray-600">Cargando...</span>
  </div>
);

// Skeleton específico para Analytics Dashboard
const AnalyticsLoading = () => (
  <div className="space-y-6 p-6">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse"></div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="h-64 bg-gray-200 rounded-lg animate-pulse"></div>
      <div className="h-64 bg-gray-200 rounded-lg animate-pulse"></div>
    </div>
  </div>
);

// Skeleton para Notificaciones
const NotificationsLoading = () => (
  <div className="w-80 bg-card border rounded-lg shadow-lg p-4">
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex space-x-3">
          <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ================================
// COMPONENTES LAZY LOADING
// ================================

/**
 * Analytics Dashboard con lazy loading
 */
export const LazyAnalyticsDashboard = dynamic(
  () => import('../components/analytics/AnalyticsDashboard'),
  {
    loading: () => <AnalyticsLoading />,
    ssr: false // No renderizar en servidor para mejorar performance
  }
);

/**
 * Sistema de Notificaciones con lazy loading
 */
export const LazyNotificationSystem = dynamic(
  () => import('../components/notifications/NotificationSystem'),
  {
    loading: () => <NotificationsLoading />,
    ssr: false
  }
);

/**
 * Componentes básicos con lazy loading (usando componentes existentes)
 */

/**
 * Formularios dinámicos 
 */
export const LazyFormComponent = dynamic(
  () => import('../components/ui/button').then(mod => ({ default: mod.Button })),
  {
    loading: () => <Loading />,
    ssr: false
  }
);

/**
 * Tablas de datos
 */
export const LazyTableComponent = dynamic(
  () => import('../components/ui/card').then(mod => ({ default: mod.Card })),
  {
    loading: () => (
      <div className="space-y-4">
        <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 rounded animate-pulse"></div>
        ))}
      </div>
    ),
    ssr: false
  }
);

// ================================
// UTILIDADES PARA LAZY LOADING
// ================================

/**
 * Hook para precargar componentes en hover o focus
 */
export const usePreloadComponent = (importFn: () => Promise<any>) => {
  const preload = () => {
    importFn().catch(() => {
      // Silently fail preload
    });
  };

  return { preload };
};

/**
 * HOC para wrap componentes con lazy loading
 */
export function withLazyLoading<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  LoadingComponent?: () => JSX.Element
): ComponentType<P> {
  return dynamic(importFn, {
    loading: LoadingComponent || Loading,
    ssr: false
  });
}

/**
 * Lazy loading básico para componentes simples
 */
export const LazyComponentWrapper = dynamic(
  () => import('../components/ui/card').then(mod => ({ default: mod.Card })),
  {
    loading: () => <div className="h-4 w-full"></div>,
    ssr: false
  }
);

// ================================
// CONFIGURACIÓN DE PRELOADING
// ================================

/**
 * Precargar componentes críticos en background
 */
export const preloadCriticalComponents = () => {
  // Precargar después de la carga inicial
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      // Analytics Dashboard (usado frecuentemente)
      import('../components/analytics/AnalyticsDashboard').catch(() => {});
      
      // Notificaciones (siempre visible)
      import('../components/notifications/NotificationSystem').catch(() => {});
      
    }, 2000); // Precargar después de 2 segundos
  }
};

/**
 * Configuración de Bundle Splitting inteligente
 */
export const BUNDLE_SPLIT_CONFIG = {
  // Vendors pesados que se cargan bajo demanda
  charts: () => import('recharts'),
  dates: () => import('date-fns'),
  
  // Librerías de UI que ya tenemos
  ui: () => import('@radix-ui/react-dialog'),
  icons: () => import('lucide-react'),
} as const;