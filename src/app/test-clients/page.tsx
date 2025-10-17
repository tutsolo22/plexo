'use client';

import { useState, useEffect } from 'react';

export default function TestClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients');
      const data = await response.json();

      if (response.ok && data.success) {
        setClients(data.data);
      } else {
        setError(data.error || 'Error al cargar clientes');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const createTestClient = async () => {
    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Cliente de Prueba',
          email: 'prueba@test.com',
          phone: '12345678',
          type: 'GENERAL',
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('Cliente creado exitosamente');
        fetchClients(); // Reload list
      } else {
        alert(data.error || 'Error al crear cliente');
      }
    } catch (err) {
      alert('Error de conexión');
    }
  };

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>Prueba de APIs de Clientes</h1>

      <button
        onClick={createTestClient}
        style={{
          padding: '10px 20px',
          marginBottom: '20px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        Crear Cliente de Prueba
      </button>

      <h2>Lista de Clientes ({clients.length})</h2>

      {clients.length === 0 ? (
        <p>No hay clientes registrados</p>
      ) : (
        <ul>
          {clients.map((client: any) => (
            <li
              key={client.id}
              style={{ marginBottom: '10px', padding: '10px', border: '1px solid #ccc' }}
            >
              <strong>{client.name}</strong>
              <br />
              Email: {client.email}
              <br />
              Tipo: {client.type}
              <br />
              Activo: {client.isActive ? 'Sí' : 'No'}
              <br />
              Eventos: {client._count?.events || 0}
              <br />
              Cotizaciones: {client._count?.quotes || 0}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
