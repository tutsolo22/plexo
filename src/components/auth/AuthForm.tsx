'use client';

import { useState, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { PlexoBranding } from '@/components/plexo-branding';

interface AuthFormProps {
  title: string;
  description: string;
  buttonText: string;
  onSubmit: (email: string, password: string) => Promise<void>;
  error?: { message: string; isUnverified?: boolean } | null;
  children?: ReactNode;
  formContent?: ReactNode;
}

export function AuthForm({ title, description, buttonText, onSubmit, error, children, formContent }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<{ message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email.trim()) {
      setFormError({ message: 'El correo electrónico es requerido' });
      return;
    }

    if (!password.trim()) {
      setFormError({ message: 'La contraseña es requerida' });
      return;
    }

    if (password.length < 6) {
      setFormError({ message: 'La contraseña debe tener al menos 6 caracteres' });
      return;
    }

    setIsLoading(true);
    await onSubmit(email, password);
    setIsLoading(false);
  };

  const displayError = error || formError;

  return (
    <div className='flex min-h-screen items-center justify-center bg-background p-4'>
      <div className='w-full max-w-md space-y-6'>
        <div className='text-center'>
          <PlexoBranding />
        </div>

        <Card className='w-full bg-card/90 backdrop-blur-sm border shadow-2xl'>
          <CardHeader className='space-y-4 text-center'>
            <div>
              <CardTitle className='text-2xl font-bold text-primary'>
                {title}
              </CardTitle>
              <CardDescription className='text-muted-foreground'>
                {description}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            {displayError && (
              <Alert variant='destructive' className='mb-4'>
                <AlertCircle className='h-4 w-4' />
                <AlertDescription>
                  {displayError.message}
                  {error?.isUnverified && (
                    <a href='/auth/resend-activation' className='ml-2 underline'>
                      Reenviar correo de activación
                    </a>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='email' className='text-primary font-medium'>
                  Correo Electrónico
                </Label>
                <Input
                  id='email'
                  type='email'
                  placeholder='tu@email.com'
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                  autoComplete='email'
                  className='w-full bg-background focus:border-primary'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='password' className='text-primary font-medium'>
                  Contraseña
                </Label>
                <div className='relative'>
                  <Input
                    id='password'
                    type={showPassword ? 'text' : 'password'}
                    placeholder='Tu contraseña'
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    disabled={isLoading}
                    required
                    autoComplete='current-password'
                    className='w-full pr-10 bg-background focus:border-primary'
                    minLength={6}
                  />
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className='h-4 w-4 text-muted-foreground' />
                    ) : (
                      <Eye className='h-4 w-4 text-muted-foreground' />
                    )}
                  </Button>
                </div>
              </div>

              {formContent}

              <Button 
                type='submit' 
                className='w-full bg-primary hover:bg-primary/90 text-primary-foreground' 
                size='lg' 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Procesando...
                  </>
                ) : (
                  buttonText
                )}
              </Button>
            </form>

            {children && (
              <div className='mt-6 space-y-2 text-center text-sm'>
                {children}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}