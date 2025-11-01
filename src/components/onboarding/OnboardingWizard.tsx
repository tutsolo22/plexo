'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CheckCircle2, 
  Circle, 
  ChevronRight, 
  Building2, 
  MapPin, 
  Clock, 
  DollarSign, 
  Zap,
  X,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
  href: string;
}

interface OnboardingProgress {
  completed: number;
  total: number;
  required: number;
  requiredCompleted: number;
  percentage: number;
  isComplete: boolean;
}

interface OnboardingData {
  tenant: {
    id: string;
    name: string;
    onboardingCompleted: boolean;
    onboardingStep: number;
  };
  steps: OnboardingStep[];
  progress: OnboardingProgress;
}

const stepIcons: Record<number, any> = {
  1: Building2,
  2: MapPin,
  3: Clock,
  4: DollarSign,
  5: Zap,
};

export default function OnboardingWizard() {
  const router = useRouter();
  const [data, setData] = useState<OnboardingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Verificar si el usuario ya dismissó el onboarding
    const dismissed = localStorage.getItem('onboarding-dismissed');
    if (dismissed === 'true') {
      setDismissed(true);
      setLoading(false);
      return;
    }

    fetchOnboardingStatus();
  }, []);

  const fetchOnboardingStatus = async () => {
    try {
      const response = await fetch('/api/onboarding');
      if (response.ok) {
        const result = await response.json();
        setData(result.data);
        
        // Si el onboarding está completo, no mostrar
        if (result.data.progress.isComplete) {
          setDismissed(true);
          await markAsCompleted();
        }
      }
    } catch (error) {
      console.error('Error al obtener estado de onboarding:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsCompleted = async () => {
    try {
      await fetch('/api/onboarding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true }),
      });
    } catch (error) {
      console.error('Error al marcar onboarding como completado:', error);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('onboarding-dismissed', 'true');
  };

  const handleSkip = async () => {
    await markAsCompleted();
    handleDismiss();
  };

  const handleStepClick = (step: OnboardingStep) => {
    router.push(step.href);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (dismissed || !data || data.progress.isComplete) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">
              ¡Bienvenido a Plexo! 🎉
            </h2>
            <p className="text-muted-foreground">
              Configuremos tu cuenta en unos simples pasos para empezar a gestionar tus eventos
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">
              Progreso General
            </span>
            <span className="text-sm text-muted-foreground">
              {data.progress.completed} de {data.progress.total} completados
            </span>
          </div>
          <Progress value={data.progress.percentage} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {data.progress.requiredCompleted} de {data.progress.required} pasos requeridos completados
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-3 mb-6">
          {data.steps.map((step) => {
            const Icon = stepIcons[step.id] || Circle;
            
            return (
              <button
                key={step.id}
                onClick={() => handleStepClick(step)}
                className="w-full text-left transition-all hover:scale-[1.02]"
              >
                <div
                  className={`flex items-start gap-4 p-4 rounded-lg border-2 transition-all ${
                    step.completed
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-border bg-card hover:border-primary/50'
                  }`}
                >
                  {/* Icon */}
                  <div
                    className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                      step.completed
                        ? 'bg-green-500 text-white'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {step.completed ? (
                      <CheckCircle2 className="h-6 w-6" />
                    ) : (
                      <Icon className="h-6 w-6" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">
                        {step.title}
                      </h3>
                      {step.required && (
                        <span className="text-xs bg-orange-500/20 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded">
                          Requerido
                        </span>
                      )}
                      {!step.required && (
                        <span className="text-xs bg-blue-500/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded">
                          Opcional
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {step.description}
                    </p>
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="flex-shrink-0 h-5 w-5 text-muted-foreground" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="text-muted-foreground"
          >
            Omitir por ahora
          </Button>
          
          {data.progress.isComplete ? (
            <Button onClick={handleDismiss}>
              ¡Comenzar! 🚀
            </Button>
          ) : (
            <Button
              onClick={() => {
                const nextIncomplete = data.steps.find(s => !s.completed);
                if (nextIncomplete) {
                  handleStepClick(nextIncomplete);
                }
              }}
            >
              Continuar configuración
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
