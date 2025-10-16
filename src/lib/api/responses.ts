import { NextRequest, NextResponse } from 'next/server';

export class ApiResponses {
  static success(data: any, message?: string) {
    return NextResponse.json({
      success: true,
      message: message || 'Operación exitosa',
      data,
      timestamp: new Date().toISOString(),
    }, { status: 200 });
  }

  static created(data: any, message?: string) {
    return NextResponse.json({
      success: true,
      message: message || 'Recurso creado exitosamente',
      data,
      timestamp: new Date().toISOString(),
    }, { status: 201 });
  }

  static badRequest(message: string, errors?: any) {
    return NextResponse.json({
      success: false,
      error: 'BAD_REQUEST',
      message,
      errors,
      timestamp: new Date().toISOString(),
    }, { status: 400 });
  }

  static unauthorized(message = 'No autorizado') {
    return NextResponse.json({
      success: false,
      error: 'UNAUTHORIZED',
      message,
      timestamp: new Date().toISOString(),
    }, { status: 401 });
  }

  static forbidden(message = 'Acceso prohibido') {
    return NextResponse.json({
      success: false,
      error: 'FORBIDDEN',
      message,
      timestamp: new Date().toISOString(),
    }, { status: 403 });
  }

  static notFound(message = 'Recurso no encontrado') {
    return NextResponse.json({
      success: false,
      error: 'NOT_FOUND',
      message,
      timestamp: new Date().toISOString(),
    }, { status: 404 });
  }

  static conflict(message: string, details?: any) {
    return NextResponse.json({
      success: false,
      error: 'CONFLICT',
      message,
      details,
      timestamp: new Date().toISOString(),
    }, { status: 409 });
  }

  static unprocessableEntity(message: string, errors?: any) {
    return NextResponse.json({
      success: false,
      error: 'UNPROCESSABLE_ENTITY',
      message,
      errors,
      timestamp: new Date().toISOString(),
    }, { status: 422 });
  }

  static tooManyRequests(message = 'Demasiadas solicitudes') {
    return NextResponse.json({
      success: false,
      error: 'TOO_MANY_REQUESTS',
      message,
      timestamp: new Date().toISOString(),
    }, { status: 429 });
  }

  static internalError(message = 'Error interno del servidor', details?: any) {
    return NextResponse.json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message,
      details: process.env.NODE_ENV === 'development' ? details : undefined,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }

  static serviceUnavailable(message = 'Servicio no disponible') {
    return NextResponse.json({
      success: false,
      error: 'SERVICE_UNAVAILABLE',
      message,
      timestamp: new Date().toISOString(),
    }, { status: 503 });
  }
}