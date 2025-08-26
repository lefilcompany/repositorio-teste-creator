// app/(auth)/reset-password/page.tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

function ResetPasswordContent() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [step, setStep] = useState<'validating' | 'form' | 'success' | 'error'>('validating');
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStep('error');
      setIsValidating(false);
      return;
    }

    // Verificar se o token é válido
    const verifyToken = async () => {
      try {
        const response = await fetch(`/api/auth/reset-password?token=${token}`);
        const data = await response.json();
        
        if (data.valid) {
          setTokenValid(true);
          setUserEmail(data.email);
          setStep('form');
        } else {
          setStep('error');
          toast.error(data.error || 'Token inválido');
        }
      } catch (error) {
        setStep('error');
        toast.error('Erro ao verificar token');
      } finally {
        setIsValidating(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }

    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      if (response.ok) {
        setStep('success');
        toast.success('Senha redefinida com sucesso!');
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        const data = await response.json();
        toast.error(data.error || 'Erro ao redefinir senha');
      }
    } catch (error) {
      toast.error('Erro ao redefinir senha');
    } finally {
      setIsLoading(false);
    }
  };

  const passwordsMatch = password === confirmPassword && password.length > 0;
  const isPasswordValid = password.length >= 6;
  const isFormValid = isPasswordValid && passwordsMatch;

  if (step === 'validating') {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Verificando token...</p>
        </div>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-md text-center space-y-6">
          <Image
            src="/assets/logoCreatorPreta.png"
            alt="Creator Logo"
            width={200}
            height={55}
            className="mx-auto mb-8"
          />
          <div className="space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <h1 className="text-2xl font-bold">Token Inválido</h1>
            <p className="text-muted-foreground">
              O link de recuperação de senha é inválido ou expirou.
            </p>
            <Link href="/login">
              <Button className="w-full">
                Voltar ao Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-md text-center space-y-6">
          <Image
            src="/assets/logoCreatorPreta.png"
            alt="Creator Logo"
            width={200}
            height={55}
            className="mx-auto mb-8"
          />
          <div className="space-y-4">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
            <h1 className="text-2xl font-bold">Senha Redefinida!</h1>
            <p className="text-muted-foreground">
              Sua senha foi redefinida com sucesso. Você será redirecionado para o login.
            </p>
            <Link href="/login">
              <Button className="w-full">
                Ir para Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 p-8">
        <div className="text-center">
          <Image
            src="/assets/logoCreatorPreta.png"
            alt="Creator Logo"
            width={200}
            height={55}
            className="mx-auto mb-6"
          />
          <h1 className="text-3xl font-bold text-foreground">Redefinir Senha</h1>
          <p className="text-muted-foreground mt-2">
            Para redefinir sua senha da conta <span className="font-semibold text-foreground">{userEmail}</span>, preencha os campos abaixo. Sua nova senha deve ter no mínimo 6 caracteres.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Label htmlFor="password">Nova Senha</Label>
              <div className="relative mt-2">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite sua nova senha"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-12 h-12"
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="relative">
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <div className="relative mt-2">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirme sua nova senha"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-12 h-12"
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Indicadores de validação da senha */}
          {password && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg border border-green-200/50 shadow-md">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-sm">
                  <div className={`w-3 h-3 rounded-full flex items-center justify-center transition-all ${
                    isPasswordValid ? 'bg-green-500 shadow-sm' : 'bg-red-500'
                  }`}>
                    {isPasswordValid && <span className="text-white text-[10px]">✓</span>}
                  </div>
                  <span className={`font-medium transition-colors ${
                    isPasswordValid ? 'text-green-700' : 'text-red-500'
                  }`}>
                    Mínimo 6 caracteres
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className={`w-3 h-3 rounded-full flex items-center justify-center transition-all ${
                    passwordsMatch && confirmPassword ? 'bg-green-500 shadow-sm' : 'bg-red-500'
                  }`}>
                    {passwordsMatch && confirmPassword && <span className="text-white text-[10px]">✓</span>}
                  </div>
                  <span className={`font-medium transition-colors ${
                    passwordsMatch && confirmPassword ? 'text-green-700' : 'text-red-500'
                  }`}>
                    Senhas coincidem
                  </span>
                </div>
              </div>
            </div>
          )}

          <Button
            type="submit"
            className="w-full rounded-lg text-base py-6 bg-gradient-to-r from-primary to-secondary font-bold tracking-wider"
            disabled={isLoading || !isFormValid}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Redefinindo...
              </>
            ) : (
              'Redefinir Senha'
            )}
          </Button>
        </form>

        <div className="text-center text-sm">
          <Link href="/login" className="text-muted-foreground hover:text-primary">
            Voltar ao login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="w-full min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
