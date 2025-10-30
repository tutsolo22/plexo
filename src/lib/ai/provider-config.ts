/**
 * Configuración centralizada de proveedores de IA
 * Todos los agentes deben usar este módulo para obtener el proveedor configurado
 */

export type AIProvider = 'google' | 'openai' | null;

export interface ProviderConfig {
  provider: AIProvider;
  isConfigured: boolean;
  apiKey?: string;
  model?: string;
}

/**
 * Detecta el proveedor de IA configurado en el servidor
 * Este método SOLO funciona en el servidor (API routes)
 */
export async function detectServerProvider(): Promise<ProviderConfig> {
  // Verificar variables de entorno en el servidor
  const googleApiKey = process.env['GOOGLE_API_KEY'] || process.env['GOOGLE_AI_API_KEY'];
  const openaiApiKey = process.env['OPENAI_API_KEY'];
  
  const googleModel = process.env['GOOGLE_AI_MODEL'] || 'gemini-2.5-flash';
  const openaiModel = process.env['OPENAI_MODEL'] || 'gpt-4o-mini';

  console.log('🔍 detectServerProvider: Verificando variables de entorno...', {
    hasGoogleKey: !!googleApiKey,
    googleKeyPrefix: googleApiKey ? `${googleApiKey.substring(0, 10)}...` : 'NO CONFIGURADA',
    hasOpenAIKey: !!openaiApiKey,
    openaiKeyPrefix: openaiApiKey ? `${openaiApiKey.substring(0, 10)}...` : 'NO CONFIGURADA',
  });

  // Verificar qué proveedores están configurados
  const hasGoogle = !!googleApiKey;
  const hasOpenAI = !!openaiApiKey;

  // Intentar obtener preferencia guardada (esto requiere una llamada al API desde el cliente)
  // En el servidor, priorizamos Google si ambos están disponibles
  if (hasGoogle) {
    console.log('✅ Google Gemini detectado como proveedor principal');
    return {
      provider: 'google',
      isConfigured: true,
      apiKey: googleApiKey,
      model: googleModel,
    };
  }

  if (hasOpenAI) {
    console.log('✅ OpenAI detectado como proveedor principal');
    return {
      provider: 'openai',
      isConfigured: true,
      apiKey: openaiApiKey,
      model: openaiModel,
    };
  }

  console.error('❌ No se encontró ningún proveedor de IA configurado');
  return {
    provider: null,
    isConfigured: false,
  };
}

/**
 * Verifica si un proveedor específico está configurado
 */
export function isProviderConfigured(provider: 'google' | 'openai'): boolean {
  if (provider === 'google') {
    return !!(process.env['GOOGLE_API_KEY'] || process.env['GOOGLE_AI_API_KEY']);
  }
  if (provider === 'openai') {
    return !!process.env['OPENAI_API_KEY'];
  }
  return false;
}

/**
 * Obtiene la configuración de un proveedor específico
 */
export function getProviderConfig(provider: 'google' | 'openai'): ProviderConfig | null {
  if (provider === 'google') {
    const apiKey = process.env['GOOGLE_API_KEY'] || process.env['GOOGLE_AI_API_KEY'];
    const model = process.env['GOOGLE_AI_MODEL'] || 'gemini-2.5-flash';
    
    if (!apiKey) return null;
    
    return {
      provider: 'google',
      isConfigured: true,
      apiKey,
      model,
    };
  }

  if (provider === 'openai') {
    const apiKey = process.env['OPENAI_API_KEY'];
    const model = process.env['OPENAI_MODEL'] || 'gpt-4o-mini';
    
    if (!apiKey) return null;
    
    return {
      provider: 'openai',
      isConfigured: true,
      apiKey,
      model,
    };
  }

  return null;
}
