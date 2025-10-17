import { useState } from 'react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  title: string
  description?: string
}

let toastCounter = 0

const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = ({
    type = 'info',
    title,
    description,
  }: {
    type?: ToastType
    title: string
    description?: string
  }) => {
    const id = (++toastCounter).toString()
    const newToast: Toast = { id, type, title, ...(description && { description }) }
    
    setToasts(prev => [...prev, newToast])
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 5000)
  }

  const dismiss = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  return {
    toast,
    dismiss,
    toasts,
  }
}

export { useToast }