// app/api/notifications/[id]/read/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { NotificationService } from '@/lib/notifications/notification-service';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const { id } = params;
    const success = await NotificationService.markAsRead(session.user.id, id);

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Error marcando notificación como leída' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Notificación marcada como leída',
    });
  } catch (error) {
    console.error('Error marcando notificación como leída:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
