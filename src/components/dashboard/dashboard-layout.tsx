'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { isAtLeast } from '@/lib/client/roles';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  Users,
  Calendar,
  FileText,
  DollarSign,
  Settings,
  Mail,
  BarChart3,
  Home,
  Menu,
  X,
  LogOut,
  User,
  Layout,
  LucideIcon,
  Cpu,
  Box,
  ChevronDown
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { PlexoLogo } from '@/components/plexo-branding';
import { Button } from '@/components/ui/button';
import { Breadcrumbs } from './breadcrumbs';
import NotificationSystem from '@/components/notifications/NotificationSystem';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
  current?: boolean;
}

interface NavGroup {
  title: string;
  items: NavigationItem[];
}

const navigationGroups: NavGroup[] = [
  {
    title: 'General',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: Home },
    ]
  },
  {
    title: 'Gestión Principal',
    items: [
      { name: 'Eventos', href: '/dashboard/events', icon: Calendar },
      { name: 'Cotizaciones', href: '/dashboard/quotes', icon: FileText },
      { name: 'Clientes', href: '/dashboard/clients', icon: Users },
      { name: 'Pagos', href: '/dashboard/payments', icon: DollarSign },
    ]
  },
  {
    title: 'Análisis y Reportes',
    items: [
      { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
      { name: 'Reportes', href: '/dashboard/reports', icon: BarChart3 },
    ]
  },
  {
    title: 'Personalización',
    items: [
      { name: 'Plantillas', href: '/dashboard/templates', icon: Layout },
      { name: 'Recursos', href: '/dashboard/resources', icon: Box },
    ]
  },
];

const adminNavGroup: NavGroup = {
  title: 'Administración',
  items: [
    { name: 'Usuarios', href: '/dashboard/users', icon: Users },
    { name: 'Emails', href: '/dashboard/emails/config', icon: Mail },
    { name: 'IA', href: '/dashboard/admin/ai-test', icon: Cpu },
    { name: 'PDF Test', href: '/dashboard/pdf-test', icon: FileText },
  ]
};

const systemNavGroup: NavGroup = {
  title: 'Sistema',
  items: [
    { name: 'Configuración', href: '/dashboard/settings', icon: Settings },
  ]
};

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const [openGroups, setOpenGroups] = useState<string[]>([]);

  const role = session?.user?.role as string | undefined;
  const isAdmin = isAtLeast(role, 'MANAGER');

  const effectiveNavGroups = isAdmin
    ? [...navigationGroups, adminNavGroup, systemNavGroup]
    : [...navigationGroups, systemNavGroup];

  useEffect(() => {
    const activeGroup = effectiveNavGroups.find(group => 
      group.items.some(item => pathname.startsWith(item.href))
    );
    if (activeGroup && !openGroups.includes(activeGroup.title)) {
      setOpenGroups(prev => [...prev, activeGroup.title]);
    }
  }, [pathname, effectiveNavGroups]);

  const toggleGroup = (title: string) => {
    setOpenGroups(prev => 
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    );
  };

  const renderNavLinks = (items: NavigationItem[]) => {
    return items.map(item => {
      const Icon = item.icon as React.ElementType;
      const isCurrent = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
      return (
        <Link
          key={item.name}
          href={item.href}
          className={classNames(
            isCurrent ? 'bg-secondary text-primary' : 'text-foreground hover:bg-secondary',
            'group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors'
          )}
          onClick={() => setSidebarOpen(false)}
        >
          <Icon
            className={classNames(
              isCurrent ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground',
              'mr-3 h-5 w-5 transition-colors'
            )}
          />
          {item.name}
        </Link>
      );
    });
  };

  const renderNavGroups = (groups: NavGroup[]) => {
    return groups.map(group => (
      <Collapsible key={group.title} open={openGroups.includes(group.title)} onOpenChange={() => toggleGroup(group.title)}>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between w-full px-3 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
            {group.title}
            <ChevronDown className={`h-4 w-4 transition-transform ${openGroups.includes(group.title) ? 'rotate-180' : ''}`} />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-1 pl-4">
          {renderNavLinks(group.items)}
        </CollapsibleContent>
      </Collapsible>
    ));
  };

  return (
    <div className='min-h-screen bg-background'>
      {/* Mobile sidebar */}
      <div
        className={classNames(
          sidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
          'fixed inset-0 z-40 transition-opacity duration-300 lg:hidden'
        )}
      >
        <div
          className='fixed inset-0 bg-black/60'
          onClick={() => setSidebarOpen(false)}
        />

        <nav className='fixed bottom-0 left-0 top-0 flex w-5/6 max-w-sm flex-col bg-card shadow-xl'>
          <div className='flex flex-shrink-0 items-center justify-between border-b px-4 py-4'>
            <PlexoLogo />
            <Button variant='ghost' size='sm' onClick={() => setSidebarOpen(false)}>
              <X className='h-5 w-5' />
            </Button>
          </div>

          <div className='flex-1 px-4 py-4 space-y-2'>
            {renderNavGroups(effectiveNavGroups)}
          </div>

          <div className='flex-shrink-0 border-t p-4'>
            <div className='flex items-center'>
              <div className='flex-shrink-0'>
                <User className='h-8 w-8 text-muted-foreground' />
              </div>
                <div className='ml-3 min-w-0 flex-1'>
                <p className='truncate text-sm font-medium text-card-foreground'>{session?.user?.name ?? 'Usuario'}</p>
                <p className='truncate text-xs text-muted-foreground'>{session?.user?.email ?? 'usuario@email.com'}</p>
              </div>
              <Button 
                variant='ghost' 
                size='sm'
                onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                title="Cerrar sesión"
              >
                <LogOut className='h-4 w-4' />
              </Button>
            </div>
          </div>
        </nav>
      </div>

      {/* Desktop sidebar */}
      <div className='hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col'>
        <nav className='flex flex-grow flex-col overflow-y-auto border-r bg-card pb-4 pt-5'>
          <div className='flex flex-shrink-0 items-center px-4'>
            <PlexoLogo />
          </div>

          <div className='mt-8 flex flex-grow flex-col px-4 space-y-2'>
            {renderNavGroups(effectiveNavGroups)}
          </div>

          <div className='flex-shrink-0 border-t p-4'>
            <div className='flex items-center'>
              <div className='flex-shrink-0'>
                <User className='h-8 w-8 text-muted-foreground' />
              </div>
              <div className='ml-3 min-w-0 flex-1'>
                <p className='truncate text-sm font-medium text-card-foreground'>{session?.user?.name ?? 'Usuario'}</p>
                <p className='truncate text-xs text-muted-foreground'>{session?.user?.email ?? 'usuario@email.com'}</p>
              </div>
              <Button 
                variant='ghost' 
                size='sm'
                onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                title="Cerrar sesión"
              >
                <LogOut className='h-4 w-4' />
              </Button>
            </div>
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className='flex flex-1 flex-col lg:pl-64'>
        {/* Top navigation */}
        <div className='sticky top-0 z-10 flex h-16 flex-shrink-0 border-b bg-card shadow-sm'>
          <Button
            variant='ghost'
            size='sm'
            className='border-r px-4 text-muted-foreground focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary lg:hidden'
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className='h-6 w-6' />
          </Button>

          <div className='flex flex-1 items-center justify-between px-4'>
            <div className='flex-1'>
              <Breadcrumbs />
            </div>

            <div className='ml-4 flex items-center gap-2 md:ml-6'>
              <ThemeToggle />
              <NotificationSystem />
              <Button variant='ghost' size='sm'>
                <User className='h-5 w-5' />
              </Button>
            </div>
          </div>
        </div>

        <main className='flex-1'>{children}</main>
      </div>
    </div>
  );
}
