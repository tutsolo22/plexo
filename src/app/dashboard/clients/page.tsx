'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Filter, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  clientType: 'GENERAL' | 'COLABORADOR' | 'EXTERNO';
  createdAt: string;
  _count: {
    events: number;
    quotes: number;
  };
}

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/clients');
      const data = await response.json();

      if (data.success) {
        setClients(data.data);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.company?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = selectedType === 'all' || client.clientType === selectedType;

    return matchesSearch && matchesType;
  });

  const getClientTypeLabel = (type: string) => {
    const labels = {
      GENERAL: 'General',
      COLABORADOR: 'Colaborador',
      EXTERNO: 'Externo',
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getClientTypeColor = (type: string) => {
    const colors = {
      GENERAL: 'bg-blue-100 text-blue-800',
      COLABORADOR: 'bg-green-100 text-green-800',
      EXTERNO: 'bg-purple-100 text-purple-800',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className='container mx-auto space-y-6 py-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Clientes</h1>
          <p className='text-muted-foreground'>
            Gestiona tu base de clientes y sus tipos de acceso
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/clients/new')}>
          <Plus className='mr-2 h-4 w-4' />
          Nuevo Cliente
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className='pt-6'>
          <div className='flex items-center space-x-4'>
            <div className='relative flex-1'>
              <Search className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Buscar clientes por nombre, email o empresa...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='pl-10'
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='outline'>
                  <Filter className='mr-2 h-4 w-4' />
                  Tipo: {selectedType === 'all' ? 'Todos' : getClientTypeLabel(selectedType)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setSelectedType('all')}>
                  Todos los tipos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedType('GENERAL')}>
                  General
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedType('COLABORADOR')}>
                  Colaborador
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedType('EXTERNO')}>
                  Externo
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className='grid gap-4 md:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{clients.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Generales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {clients.filter(c => c.clientType === 'GENERAL').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Colaboradores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {clients.filter(c => c.clientType === 'COLABORADOR').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Externos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {clients.filter(c => c.clientType === 'EXTERNO').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
          <CardDescription>
            {filteredClients.length} de {clients.length} clientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='py-4 text-center'>Cargando clientes...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Eventos</TableHead>
                  <TableHead>Cotizaciones</TableHead>
                  <TableHead>Registro</TableHead>
                  <TableHead className='w-[70px]'></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map(client => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div className='flex items-center space-x-3'>
                        <Avatar>
                          <AvatarFallback>{getInitials(client.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className='font-medium'>{client.name}</div>
                          {client.company && (
                            <div className='text-sm text-muted-foreground'>{client.company}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='space-y-1'>
                        {client.email && <div className='text-sm'>{client.email}</div>}
                        {client.phone && (
                          <div className='text-sm text-muted-foreground'>{client.phone}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getClientTypeColor(client.clientType)}>
                        {getClientTypeLabel(client.clientType)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className='font-medium'>{client._count.events}</span>
                    </TableCell>
                    <TableCell>
                      <span className='font-medium'>{client._count.quotes}</span>
                    </TableCell>
                    <TableCell>{new Date(client.createdAt).toLocaleDateString('es-ES')}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant='ghost' className='h-8 w-8 p-0'>
                            <MoreHorizontal className='h-4 w-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem
                            onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                          >
                            Ver detalles
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => router.push(`/dashboard/clients/${client.id}/edit`)}
                          >
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem className='text-red-600'>Eliminar</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!isLoading && filteredClients.length === 0 && (
            <div className='py-8 text-center text-muted-foreground'>
              {searchTerm || selectedType !== 'all'
                ? 'No se encontraron clientes que coincidan con los filtros'
                : 'No hay clientes registrados'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
