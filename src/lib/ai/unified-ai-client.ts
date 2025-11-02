/**
 * Cliente unificado de IA que usa el proveedor configurado
 * Soporta tanto Google Gemini como OpenAI de manera transparente
 */

import { detectServerProvider, getProviderConfig } from './provider-config';
import { GoogleAIClient } from './google-ai-client';
import OpenAI from 'openai';

export interface UnifiedAIResponse {
  text: string;
  finishReason?: string;
  provider: 'google' | 'openai';
  tokensUsed?: number;
}

export interface UnifiedAIConfig {
  temperature?: number;
  topK?: number;
  topP?: number;
  maxOutputTokens?: number;
  preferredProvider?: 'google' | 'openai';
}

/**
 * Cliente unificado que detecta y usa el proveedor de IA configurado
 */
export class UnifiedAIClient {
  private config: Required<UnifiedAIConfig>;
  private googleClient?: GoogleAIClient;
  private openaiClient?: OpenAI;
  private activeProvider: 'google' | 'openai' | null = null;

  constructor(config?: UnifiedAIConfig) {
    this.config = {
      temperature: config?.temperature ?? 0.7,
      topK: config?.topK ?? 40,
      topP: config?.topP ?? 0.9,
      maxOutputTokens: config?.maxOutputTokens ?? 2048,
      preferredProvider: config?.preferredProvider ?? 'google',
    };
  }

  /**
   * Inicializa el cliente con el proveedor detectado
   */
  private async initialize(): Promise<void> {
    if (this.activeProvider) return; // Ya inicializado

    console.log('🔍 UnifiedAIClient: Inicializando cliente de IA...');

    // Si hay proveedor preferido, intentar usarlo primero
    if (this.config.preferredProvider) {
      console.log(`🎯 Intentando usar proveedor preferido: ${this.config.preferredProvider}`);
      const providerConfig = getProviderConfig(this.config.preferredProvider);
      console.log('📋 Configuración del proveedor:', {
        provider: this.config.preferredProvider,
        isConfigured: providerConfig?.isConfigured,
        hasApiKey: !!providerConfig?.apiKey,
        model: providerConfig?.model,
      });
      
      if (providerConfig?.isConfigured) {
        this.activeProvider = this.config.preferredProvider;
        this.initializeProvider(this.config.preferredProvider);
        console.log(`✅ Proveedor ${this.config.preferredProvider} inicializado correctamente`);
        return;
      } else {
        console.warn(`⚠️ Proveedor preferido ${this.config.preferredProvider} no está configurado`);
      }
    }

    // Auto-detectar proveedor disponible
    console.log('🔍 Auto-detectando proveedores disponibles...');
    const detectedConfig = await detectServerProvider();
    console.log('📋 Proveedor detectado:', {
      provider: detectedConfig.provider,
      isConfigured: detectedConfig.isConfigured,
    });
    
    if (!detectedConfig.isConfigured || !detectedConfig.provider) {
      const errorMsg = 'No hay un proveedor de IA configurado. Por favor configura GOOGLE_API_KEY o OPENAI_API_KEY en las variables de entorno.';
      console.error('❌', errorMsg);
      console.error('Variables de entorno disponibles:', {
        hasGoogleKey: !!(process.env['GOOGLE_API_KEY'] || process.env['GOOGLE_AI_API_KEY']),
        hasOpenAIKey: !!process.env['OPENAI_API_KEY'],
      });
      throw new Error(errorMsg);
    }

    this.activeProvider = detectedConfig.provider;
    this.initializeProvider(detectedConfig.provider);
    console.log(`✅ Proveedor ${detectedConfig.provider} inicializado por auto-detección`);
  }

  /**
   * Inicializa el cliente del proveedor específico
   */
  private initializeProvider(provider: 'google' | 'openai'): void {
    if (provider === 'google') {
      this.googleClient = new GoogleAIClient({
        temperature: this.config.temperature,
        topK: this.config.topK,
        topP: this.config.topP,
        maxOutputTokens: this.config.maxOutputTokens,
      });
    } else if (provider === 'openai') {
      const apiKey = process.env['OPENAI_API_KEY'];
      if (!apiKey) {
        throw new Error('OpenAI API Key no configurada');
      }
      this.openaiClient = new OpenAI({ apiKey });
    }
  }

  /**
   * Genera contenido usando el proveedor activo
   */
  async generateContent(prompt: string): Promise<UnifiedAIResponse> {
    await this.initialize();

    if (!this.activeProvider) {
      throw new Error('No hay proveedor de IA activo');
    }

    if (this.activeProvider === 'google') {
      if (!this.googleClient) {
        throw new Error('Google AI client no inicializado');
      }

      const response = await this.googleClient.generateContent(prompt);
      return {
        text: response.text,
        finishReason: response.finishReason || '',
        provider: 'google',
      };
    }

    if (this.activeProvider === 'openai') {
      if (!this.openaiClient) {
        throw new Error('OpenAI client no inicializado');
      }

      const response = await this.openaiClient.chat.completions.create({
        model: process.env['OPENAI_MODEL'] || 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: this.config.temperature,
        max_tokens: this.config.maxOutputTokens,
      });

      const finishReason = response.choices[0]?.finish_reason;
      const tokensUsed = response.usage?.total_tokens;
      const result: UnifiedAIResponse = {
        text: response.choices[0]?.message?.content || '',
        finishReason: finishReason || 'unknown',
        provider: 'openai',
      };
      if (tokensUsed !== undefined) {
        result.tokensUsed = tokensUsed;
      }
      return result;
    }

    throw new Error('Proveedor no soportado');
  }

  /**
   * Genera contenido con historial de conversación
   */
  async generateContentWithHistory(
    prompt: string,
    history: Array<{ role: 'user' | 'assistant' | 'model'; text: string }>
  ): Promise<UnifiedAIResponse> {
    await this.initialize();

    if (!this.activeProvider) {
      throw new Error('No hay proveedor de IA activo');
    }

    if (this.activeProvider === 'google') {
      if (!this.googleClient) {
        throw new Error('Google AI client no inicializado');
      }

      // Convertir 'assistant' a 'model' para Google
      const googleHistory = history.map(msg => ({
        role: msg.role === 'assistant' ? ('model' as const) : (msg.role as 'user' | 'model'),
        text: msg.text,
      }));

      const response = await this.googleClient.generateContentWithHistory(
        prompt,
        googleHistory
      );

      return {
        text: response.text,
        finishReason: response.finishReason || '',
        provider: 'google',
      };
    }

    if (this.activeProvider === 'openai') {
      if (!this.openaiClient) {
        throw new Error('OpenAI client no inicializado');
      }

      // Convertir 'model' a 'assistant' para OpenAI
      const openaiMessages = history.map(msg => ({
        role: msg.role === 'model' ? ('assistant' as const) : (msg.role as 'user' | 'assistant'),
        content: msg.text,
      }));

      // Agregar mensaje actual
      openaiMessages.push({ role: 'user', content: prompt });

      const response = await this.openaiClient.chat.completions.create({
        model: process.env['OPENAI_MODEL'] || 'gpt-4o-mini',
        messages: openaiMessages,
        temperature: this.config.temperature,
        max_tokens: this.config.maxOutputTokens,
      });

      const finishReason = response.choices[0]?.finish_reason;
      const tokensUsed = response.usage?.total_tokens;
      const result: UnifiedAIResponse = {
        text: response.choices[0]?.message?.content || '',
        finishReason: finishReason || 'unknown',
        provider: 'openai',
      };
      if (tokensUsed !== undefined) {
        result.tokensUsed = tokensUsed;
      }
      return result;
    }

    throw new Error('Proveedor no soportado');
  }

  /**
   * Obtiene el proveedor activo
   */
  getActiveProvider(): 'google' | 'openai' | null {
    return this.activeProvider;
  }
}
