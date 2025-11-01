import { redirect } from 'next/navigation';

export default function ResourcesPage() {
  // Redirigir a la nueva ubicación de configuraciones
  redirect('/dashboard/settings');
}
