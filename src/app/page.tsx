export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎉 Sistema de Gestión de Eventos V3
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Sistema profesional de gestión de eventos empresariales
          </p>
          <div className="bg-white rounded-lg shadow-md p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              ¡Proyecto Inicializado Correctamente!
            </h2>
            <div className="text-left space-y-2">
              <p className="text-green-600">✅ Next.js 14 configurado</p>
              <p className="text-green-600">✅ TypeScript habilitado</p>
              <p className="text-green-600">✅ Tailwind CSS funcionando</p>
              <p className="text-green-600">✅ ESLint y Prettier configurados</p>
              <p className="text-green-600">✅ Dependencias instaladas</p>
            </div>
            <div className="mt-6 text-sm text-gray-500">
              <p>Próximo paso: Configurar Prisma y base de datos</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}