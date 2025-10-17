'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Users,
  Calendar,
  FileText,
  DollarSign,
  Settings,
  BarChart3,
  Home,
  Menu,
  X,
  LogOut,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Breadcrumbs } from './breadcrumbs';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  current?: boolean;
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Clientes', href: '/dashboard/clients', icon: Users },
  { name: 'Eventos', href: '/dashboard/events', icon: Calendar },
  { name: 'Cotizaciones', href: '/dashboard/quotes', icon: FileText },
  { name: 'Pagos', href: '/dashboard/payments', icon: DollarSign },
  { name: 'Reportes', href: '/dashboard/reports', icon: BarChart3 },
  { name: 'Configuración', href: '/dashboard/settings', icon: Settings },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Update current navigation item based on pathname
  const updatedNavigation = navigation.map(item => ({
    ...item,
    current:
      pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href)),
  }));

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Mobile sidebar */}
      <div
        className={classNames(
          sidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
          'fixed inset-0 z-40 transition-opacity duration-300 lg:hidden'
        )}
      >
        <div
          className='fixed inset-0 bg-gray-600 bg-opacity-75'
          onClick={() => setSidebarOpen(false)}
        />

        <nav className='fixed bottom-0 left-0 top-0 flex w-5/6 max-w-sm flex-col bg-white shadow-xl'>
          <div className='flex flex-shrink-0 items-center justify-between border-b px-4 py-4'>
            <h2 className='text-lg font-semibold text-gray-900'>CRM Casona María</h2>
            <Button variant='ghost' size='sm' onClick={() => setSidebarOpen(false)}>
              <X className='h-5 w-5' />
            </Button>
          </div>

          <div className='flex-1 px-4 py-4'>
            <ul className='space-y-2'>
              {updatedNavigation.map(item => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={classNames(
                      item.current
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100',
                      'group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors'
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon
                      className={classNames(
                        item.current ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-500',
                        'mr-3 h-5 w-5 transition-colors'
                      )}
                    />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className='flex-shrink-0 border-t p-4'>
            <div className='flex items-center'>
              <div className='flex-shrink-0'>
                <User className='h-8 w-8 text-gray-400' />
              </div>
              <div className='ml-3 min-w-0 flex-1'>
                <p className='truncate text-sm font-medium text-gray-900'>Usuario</p>
                <p className='truncate text-xs text-gray-500'>usuario@email.com</p>
              </div>
              <Button variant='ghost' size='sm'>
                <LogOut className='h-4 w-4' />
              </Button>
            </div>
          </div>
        </nav>
      </div>

      {/* Desktop sidebar */}
      <div className='hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col'>
        <nav className='flex flex-grow flex-col overflow-y-auto border-r border-gray-200 bg-white pb-4 pt-5'>
          <div className='flex flex-shrink-0 items-center px-4'>
            <h2 className='text-xl font-bold text-gray-900'>CRM Casona María</h2>
          </div>

          <div className='mt-8 flex flex-grow flex-col'>
            <div className='flex-1 space-y-1 px-4'>
              {updatedNavigation.map(item => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={classNames(
                    item.current ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100',
                    'group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors'
                  )}
                >
                  <item.icon
                    className={classNames(
                      item.current ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-500',
                      'mr-3 h-5 w-5 transition-colors'
                    )}
                  />
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          <div className='flex-shrink-0 border-t p-4'>
            <div className='flex items-center'>
              <div className='flex-shrink-0'>
                <User className='h-8 w-8 text-gray-400' />
              </div>
              <div className='ml-3 min-w-0 flex-1'>
                <p className='truncate text-sm font-medium text-gray-900'>Usuario</p>
                <p className='truncate text-xs text-gray-500'>usuario@email.com</p>
              </div>
              <Button variant='ghost' size='sm'>
                <LogOut className='h-4 w-4' />
              </Button>
            </div>
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className='flex flex-1 flex-col lg:pl-64'>
        {/* Top navigation */}
        <div className='sticky top-0 z-10 flex h-16 flex-shrink-0 border-b bg-white shadow-sm'>
          <Button
            variant='ghost'
            size='sm'
            className='border-r border-gray-200 px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden'
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className='h-6 w-6' />
          </Button>

          <div className='flex flex-1 items-center justify-between px-4'>
            <div className='flex-1'>
              <Breadcrumbs />
            </div>

            <div className='ml-4 flex items-center md:ml-6'>
              {/* User menu could go here */}
              <Button variant='ghost' size='sm'>
                <User className='h-5 w-5' />
              </Button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className='flex-1'>{children}</main>
      </div>
    </div>
  );
}
