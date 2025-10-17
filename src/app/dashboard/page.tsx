export default function DashboardPage() {
  // TEMPORALMENTE DESHABILITADO PARA PRUEBAS
  /*
  const session = await auth()
  
  if (!session) {
    redirect('/auth/signin')
  }
  */

  // const stats = await getDashboardStats()

  return (
    <div className='p-6'>
      {/* Header */}
      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-gray-900'>Dashboard</h1>
        <p className='text-gray-600'>Bienvenido al sistema de gestión de eventos</p>
      </div>

      {/* Quick Actions */}
      <div className='mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4'>
        <div className='rounded-lg border bg-white p-6 shadow-sm'>
          <h3 className='mb-2 text-lg font-semibold text-gray-900'>Clientes</h3>
          <p className='mb-4 text-sm text-gray-600'>Gestiona tu base de clientes</p>
          <a href='/dashboard/clients' className='font-medium text-blue-600 hover:text-blue-700'>
            Ver clientes →
          </a>
        </div>

        <div className='rounded-lg border bg-white p-6 shadow-sm'>
          <h3 className='font-semibent mb-2 text-lg text-gray-900'>Eventos</h3>
          <p className='mb-4 text-sm text-gray-600'>Programa y gestiona eventos</p>
          <a href='/dashboard/events' className='font-medium text-blue-600 hover:text-blue-700'>
            Ver eventos →
          </a>
        </div>

        <div className='rounded-lg border bg-white p-6 shadow-sm'>
          <h3 className='mb-2 text-lg font-semibold text-gray-900'>Cotizaciones</h3>
          <p className='mb-4 text-sm text-gray-600'>Crea y gestiona cotizaciones</p>
          <a href='/dashboard/quotes' className='font-medium text-blue-600 hover:text-blue-700'>
            Ver cotizaciones →
          </a>
        </div>

        <div className='rounded-lg border bg-white p-6 shadow-sm'>
          <h3 className='mb-2 text-lg font-semibold text-gray-900'>Pagos</h3>
          <p className='mb-4 text-sm text-gray-600'>Gestiona pagos y facturación</p>
          <a href='/dashboard/payments' className='font-medium text-blue-600 hover:text-blue-700'>
            Ver pagos →
          </a>
        </div>
      </div>

      {/* Stats placeholder */}
      <div className='rounded-lg border bg-white p-6 shadow-sm'>
        <h2 className='mb-4 text-xl font-semibold text-gray-900'>Estadísticas del Sistema</h2>
        <p className='text-gray-600'>
          Las estadísticas detalladas se mostrarán aquí una vez que el sistema esté completamente
          configurado.
        </p>
      </div>
    </div>
  );
}
