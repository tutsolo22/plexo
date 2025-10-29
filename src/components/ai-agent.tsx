'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Send, Bot, User, Minimize2, Maximize2 } from 'lucide-react'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp?: string
}

interface AIAgentProps {
  isMinimized?: boolean
  onToggleMinimize?: () => void
}

export function AIAgent({ isMinimized = false, onToggleMinimize }: AIAgentProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const lastMessageRef = useRef<HTMLDivElement | null>(null)
  const initializedRef = useRef(false)
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null)
  const draggingRef = useRef<{ active: boolean; startX: number; startY: number; origLeft: number; origTop: number } | null>(null)

  const getFormattedTime = () => {
    return new Date().toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  useEffect(() => {
    setIsClient(true)

    // Cargar mensajes previos desde localStorage si existen (evita reset en remounts en Dev StrictMode)
    try {
      const saved = localStorage.getItem('plexo_ai_messages')
      if (saved) {
        setMessages(JSON.parse(saved))
      } else if (!initializedRef.current) {
        // Solo inicializar saludo la primera vez
        const greeting: Message = {
          id: '1',
          content: '¡Hola! Soy tu asistente de IA para Plexo. ¿En qué puedo ayudarte hoy? Puedo ayudarte con información sobre eventos, cotizaciones, clientes y más.',
          role: 'assistant',
          timestamp: getFormattedTime(),
        }
        setMessages([greeting])
        initializedRef.current = true
      }
    } catch (e) {
      // si localStorage falla, seguimos con saludo por defecto
      if (!initializedRef.current) {
        setMessages([
          {
            id: '1',
            content: '¡Hola! Soy tu asistente de IA para Plexo. ¿En qué puedo ayudarte hoy? Puedo ayudarte con información sobre eventos, cotizaciones, clientes y más.',
            role: 'assistant',
            timestamp: getFormattedTime(),
          },
        ])
        initializedRef.current = true
      }
    }
  }, [])

  // establecer posición inicial (bottom-right) una vez en cliente
  useEffect(() => {
    if (!isClient) return
    if (position) return
    const w = window.innerWidth
    const h = window.innerHeight
    const defaultWidth = 420
    const left = Math.max(12, w - defaultWidth - 24)
    const top = Math.max(80, h - 520 - 24)
    setPosition({ left, top })
  }, [isClient, position])

  const startDrag = (e: React.MouseEvent) => {
    if (!position) return
    draggingRef.current = { active: true, startX: e.clientX, startY: e.clientY, origLeft: position.left, origTop: position.top }
    window.addEventListener('mousemove', onDrag)
    window.addEventListener('mouseup', endDrag)
  }

  const onDrag = (e: MouseEvent) => {
    const d = draggingRef.current
    if (!d || !position) return
    const dx = e.clientX - d.startX
    const dy = e.clientY - d.startY
    setPosition({ left: Math.max(8, d.origLeft + dx), top: Math.max(8, d.origTop + dy) })
  }

  const endDrag = () => {
    draggingRef.current = null
    window.removeEventListener('mousemove', onDrag)
    window.removeEventListener('mouseup', endDrag)
  }

  useEffect(() => {
    // Intentar desplazar el último mensaje a la vista
    try {
      if (lastMessageRef.current) {
        lastMessageRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
      } else if (scrollAreaRef.current) {
        // fallback: desplazar el contenedor
        (scrollAreaRef.current as any).scrollTop = (scrollAreaRef.current as any).scrollHeight
      }
    } catch (e) {
      // ignore
    }
    try {
      // Persistir conversación para evitar pérdida en remounts de React StrictMode
      if (isClient) {
        localStorage.setItem('plexo_ai_messages', JSON.stringify(messages))
      }
    } catch (e) {
      // ignore
    }
  }, [messages])

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: getFormattedTime(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: generateAIResponse(input),
        role: 'assistant',
        timestamp: getFormattedTime(),
      }

  setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error enviando mensaje:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Lo siento, hubo un error procesando tu mensaje. Por favor intenta de nuevo.',
        role: 'assistant',
        timestamp: getFormattedTime(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      // Volver a enfocar el input para continuar la conversación
      setTimeout(() => {
        try {
          inputRef.current?.focus()
        } catch (e) {
          // ignore
        }
      }, 50)
    }
  }

  const clearConversation = () => {
    try {
      localStorage.removeItem('plexo_ai_messages')
    } catch (e) {}
    initializedRef.current = false
    const greeting: Message = {
      id: Date.now().toString(),
      content: '¡Hola! Soy tu asistente de IA para Plexo. ¿En qué puedo ayudarte hoy? Puedo ayudarte con información sobre eventos, cotizaciones, clientes y más.',
      role: 'assistant',
      timestamp: getFormattedTime(),
    }
    setMessages([greeting])
  }

  const generateAIResponse = (userInput: string): string => {
    const lowerInput = userInput.toLowerCase()
    
    if (lowerInput.includes('evento') || lowerInput.includes('eventos')) {
      return 'Puedo ayudarte con la gestión de eventos en Plexo. Puedes crear nuevos eventos, ver el calendario, gestionar cotizaciones y mucho más. ¿Qué necesitas hacer específicamente con los eventos?'
    }
    
    if (lowerInput.includes('cliente') || lowerInput.includes('clientes')) {
      return 'En Plexo puedes gestionar toda la información de tus clientes, crear nuevos registros, ver su historial de eventos y cotizaciones. ¿Te gustaría que te ayude con algo específico sobre los clientes?'
    }
    
    if (lowerInput.includes('cotización') || lowerInput.includes('cotizaciones') || lowerInput.includes('presupuesto')) {
      return 'Las cotizaciones en Plexo te permiten crear presupuestos detallados para tus eventos. Puedes incluir servicios, costos, descuentos y generar documentos profesionales. ¿Necesitas ayuda creando una cotización?'
    }
    
    if (lowerInput.includes('dashboard') || lowerInput.includes('panel')) {
      return 'El dashboard de Plexo te da una vista completa de tu negocio: eventos próximos, cotizaciones pendientes, estadísticas de ventas y más. ¿Qué información específica te gustaría ver?'
    }
    
    if (lowerInput.includes('ayuda') || lowerInput.includes('help')) {
      return 'Estoy aquí para ayudarte con todo lo relacionado a Plexo. Puedo asistirte con:\n\n• Gestión de eventos y calendario\n• Creación y seguimiento de cotizaciones\n• Administración de clientes\n• Configuración del sistema\n• Reportes y estadísticas\n\n¿Con qué te gustaría empezar?'
    }
    
    return 'Entiendo tu consulta. Como asistente de Plexo, puedo ayudarte con la gestión de eventos, cotizaciones, clientes y más. ¿Podrías ser más específico sobre lo que necesitas para poder asistirte mejor?'
  }

  if (!isClient) {
    return null
  }

  if (isMinimized) {
    // minimized as a small draggable button to avoid covering UI
    return (
      <div style={position ? { position: 'fixed', left: position.left, top: position.top, zIndex: 60 } : { position: 'fixed', right: 16, bottom: 16, zIndex: 60 }}>
        <div onMouseDown={startDrag} className="flex items-center gap-2 cursor-grab select-none bg-primary text-primary-foreground rounded-full shadow p-2">
          <Bot size={16} />
          <button onClick={(e)=>{ e.stopPropagation(); onToggleMinimize?.() }} aria-label="Maximize" className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center ml-2">
            <Maximize2 size={14} />
          </button>
          <button onClick={(e)=>{ e.stopPropagation(); clearConversation() }} aria-label="Clear" className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center ml-2">
            C
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={position ? { position: 'fixed', left: position.left, top: position.top, zIndex: 60 } : { position: 'fixed', right: 16, bottom: 16, zIndex: 60 }}>
      <Card className="w-full max-w-[420px] max-h-[65vh] h-[520px] shadow-lg border-primary/20 flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-primary text-primary-foreground">
        <div onMouseDown={startDrag} className="flex-1 cursor-grab">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Bot size={16} />
            Asistente IA de Plexo
          </CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={clearConversation} className="h-6 w-6 p-0 text-primary-foreground hover:bg-black/20">C</Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleMinimize}
            className="h-6 w-6 p-0 text-primary-foreground hover:bg-black/20"
          >
            <Minimize2 size={14} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-0 overflow-hidden">
        <div ref={scrollAreaRef} className="h-full p-4 overflow-y-auto">
          <div className="space-y-4">
            {messages.map((message, idx) => (
              <div
                key={message.id}
                ref={idx === messages.length - 1 ? lastMessageRef : null}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`flex gap-2 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div
                    className={`rounded-full p-1 ${message.role === 'user' ? 'bg-primary/10' : 'bg-accent/10'}`}
                  >
                    {message.role === 'user' ? (
                      <User size={12} className="text-primary" />
                    ) : (
                      <Bot size={12} className="text-accent" />
                    )}
                  </div>
                  <div
                    className={`rounded-lg px-3 py-2 text-sm ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    {isClient && message.timestamp && (
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="flex gap-2">
                  <div className="rounded-full p-1 bg-accent/10">
                    <Bot size={12} className="text-accent" />
                  </div>
                  <div className="bg-secondary rounded-lg px-3 py-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-3 border-t">
        <div className="flex gap-2 w-full">
          <Input
            ref={(el) => { inputRef.current = el }}
            placeholder="Escribe tu mensaje..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !(e as any).shiftKey) { e.preventDefault(); handleSendMessage() } }}
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            size="sm"
            className="bg-primary hover:bg-primary/90"
          >
            <Send size={14} />
          </Button>
        </div>
      </CardFooter>
    </Card>
    </div>
  )
}
