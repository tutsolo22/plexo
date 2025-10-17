'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  name: string;
  href: string;
  current?: boolean;
}

const pathNameMap: Record<string, string> = {
  dashboard: 'Dashboard',
  clients: 'Clientes',
  events: 'Eventos',
  quotes: 'Cotizaciones',
  payments: 'Pagos',
  reports: 'Reportes',
  settings: 'Configuración',
  new: 'Nuevo',
  edit: 'Editar',
};

export function Breadcrumbs() {
  const pathname = usePathname();

  // Generate breadcrumb items from pathname
  const pathSegments = pathname.split('/').filter(Boolean);

  const breadcrumbs: BreadcrumbItem[] = pathSegments.map((segment, index) => {
    const href = '/' + pathSegments.slice(0, index + 1).join('/');
    const isLast = index === pathSegments.length - 1;

    // Handle dynamic routes (like [id])
    let name = pathNameMap[segment] || segment;

    // If it's an ID (cuid-like), show "Detalle" instead
    if (segment.length > 10 && segment.match(/^[a-z0-9]+$/i)) {
      name = 'Detalle';
    }

    return {
      name,
      href,
      current: isLast,
    };
  });

  // Don't show breadcrumbs for the root dashboard
  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav className='flex' aria-label='Breadcrumb'>
      <ol className='flex items-center space-x-2'>
        <li>
          <div>
            <Link href='/dashboard' className='text-gray-400 hover:text-gray-500'>
              <Home className='h-4 w-4' />
              <span className='sr-only'>Dashboard</span>
            </Link>
          </div>
        </li>

        {breadcrumbs.map(item => (
          <li key={item.href}>
            <div className='flex items-center'>
              <ChevronRight className='mx-2 h-4 w-4 text-gray-300' />
              {item.current ? (
                <span className='text-sm font-medium capitalize text-gray-900'>{item.name}</span>
              ) : (
                <Link
                  href={item.href}
                  className='text-sm font-medium capitalize text-gray-500 hover:text-gray-700'
                >
                  {item.name}
                </Link>
              )}
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
}
