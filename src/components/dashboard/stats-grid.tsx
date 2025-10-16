import { StatsCard } from './stats-card';
import { CalendarDays, Users, FileText, MapPin } from 'lucide-react';
import { DashboardStats } from '@/hooks/use-dashboard-stats';

interface StatsGridProps {
  stats: DashboardStats;
  className?: string;
}

export function StatsGrid({ stats, className }: StatsGridProps) {
  const statsData = [
    {
      title: 'Total Clientes',
      value: stats.totalClients,
      description: 'Clientes registrados',
      icon: Users,
      iconClassName: 'text-blue-600',
      trend: {
        value: 12,
        label: 'vs mes anterior',
        isPositive: true,
      },
    },
    {
      title: 'Eventos',
      value: stats.totalEvents,
      description: 'Eventos gestionados',
      icon: CalendarDays,
      iconClassName: 'text-green-600',
      trend: {
        value: 8,
        label: 'vs mes anterior',
        isPositive: true,
      },
    },
    {
      title: 'Cotizaciones',
      value: stats.totalQuotes,
      description: 'Cotizaciones generadas',
      icon: FileText,
      iconClassName: 'text-orange-600',
      trend: {
        value: 15,
        label: 'vs mes anterior',
        isPositive: true,
      },
    },
    {
      title: 'Venues',
      value: stats.totalVenues,
      description: 'Espacios disponibles',
      icon: MapPin,
      iconClassName: 'text-purple-600',
    },
  ];

  return (
    <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-4 ${className}`}>
      {statsData.map((stat, index) => (
        <StatsCard
          key={index}
          title={stat.title}
          value={stat.value}
          description={stat.description}
          icon={stat.icon}
          iconClassName={stat.iconClassName}
          {...(stat.trend && { trend: stat.trend })}
        />
      ))}
    </div>
  );
}
