'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { FaGoogle, FaApple, FaFacebook } from 'react-icons/fa';
import { toast } from 'sonner';
import TeamDialog from '@/components/teamDialog';
import ForgotPasswordDialog from '@/components/auth/ForgotPasswordDialog';
import { User } from '@/types/user';

// Use imagens locais para garantir o carregamento
// Crie uma pasta 'assets' dentro da pasta 'public' e coloque suas imagens lá.
const carouselItems = [
  {
    imageSrc: "/assets/placeholder.png", // Exemplo: public/assets/placeholder-1.png
    altText: "Showcase do Histórico de Ações",
  },
  {
    imageSrc: "/assets/placeholder.png", // Exemplo: public/assets/placeholder-2.png
    altText: "Showcase da Criação de Conteúdo",
  },
  {
    imageSrc: "/assets/placeholder.png", // Exemplo: public/assets/placeholder-3.png
    altText: "Showcase do Planejamento",
  },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const { login, pendingNoTeamUser } = useAuth();

  const plugin = useRef(
    Autoplay({ delay: 4000, stopOnInteraction: true }) // Delay de 4 segundos
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    if (!email || !password) {
      toast.error('Por favor, preencha todos os campos');
      setIsLoading(false);
      return;
    }
    
    const result = await login({ email, password, rememberMe });
    if (result === 'invalid') {
      setError('E-mail ou senha inválidos.');
      toast.error('E-mail ou senha inválidos');
    } else if (result === 'pending') {
      setError('Aguardando aprovação do administrador da equipe.');
      toast.warning('Aguardando aprovação do administrador da equipe');
    } else if (result === 'no_team') {
      // Usuário precisa escolher equipe
      setTeamDialogOpen(true);
      toast.info('Escolha uma equipe para continuar');
    } else if (result === 'trial_expired') {
      setError('O período de teste da sua equipe terminou. Escolha um novo plano para voltar a usar o Creator.');
      toast.error('Período de teste encerrado. Selecione um plano para continuar.');
    } else if (result === 'success') {
      toast.success('Login realizado com sucesso!');
    }
    setIsLoading(false);
  };

  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
      {/* Header mobile com logo e texto */}
      <div className="lg:hidden bg-gradient-to-br from-primary to-secondary text-white p-6 text-center">
        <Image
          src="/assets/logoCreatorBranca.png"
          alt="Creator Logo"
          width={150}
          height={41}
          className="mx-auto mb-4"
        />
        <h2 className="text-xl font-bold">Bem-vindo de volta!</h2>
        <p className="mt-2 text-white/80 text-sm">Acesse sua conta e continue criando.</p>
      </div>

      <div className="hidden lg:flex flex-col items-center justify-center p-12 bg-gradient-to-br from-primary to-secondary text-white relative">
        <div className="flex flex-col items-center justify-center gap-16 w-full">
          <Carousel
            plugins={[plugin.current]}
            className="w-full max-w-lg"
            opts={{ loop: true }}
            onMouseEnter={() => plugin.current.stop()}
            onMouseLeave={() => plugin.current.play()}
          >
            <CarouselContent>
              {carouselItems.map((item, index) => (
                <CarouselItem key={index}>
                  <div className="p-1">
                    <Image
                      src={item.imageSrc}
                      alt={item.altText}
                      width={1024}
                      height={768}
                      className="rounded-xl shadow-2xl w-full object-contain"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
          <div className="max-w-md text-center">
            <h2 className="text-3xl font-bold">Aqui, suas ideias ganham forma com a força da inteligência artificial.</h2>
            <p className="mt-4 text-white/80">Crie, planeje e transforme conteúdos com autonomia e estratégia.</p>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center p-6 lg:p-8 bg-background">
        <div className="w-full max-w-sm space-y-6 lg:space-y-8">
          <div className="text-center lg:block hidden">
            <Image
              src="/assets/logoCreatorPreta.png"
              alt="Creator Logo"
              width={200}
              height={55}
              className="mx-auto mb-6"
            />
            <h1 className="text-3xl font-bold text-foreground">Acesse sua Conta</h1>
            <p className="text-muted-foreground mt-2">
              Bem-vindo de volta! Por favor, insira seus dados.
            </p>
          </div>
          
          {/* Título mobile mais compacto */}
          <div className="text-center lg:hidden">
            <h1 className="text-2xl font-bold text-foreground mb-2">Acesse sua Conta</h1>
            <p className="text-muted-foreground text-sm">
              Insira seus dados para continuar.
            </p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-5 lg:space-y-6">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="E-mail"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
            
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Senha"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 h-12"
              />
              <Button type="button" variant="ghost" size="icon" className="absolute top-1/2 -translate-y-1/2 right-1 h-10 w-10 text-muted-foreground" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="remember-me" 
                  className="rounded-[4px]" 
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <Label htmlFor="remember-me" className="text-sm font-medium leading-none text-muted-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Mantenha-me conectado</Label>
              </div>
              <button
                type="button"
                onClick={() => setForgotPasswordOpen(true)}
                className="text-sm text-primary hover:underline"
              >
                Esqueceu a senha?
              </button>
            </div>

            {error && <p className="text-sm text-destructive text-center">{error}</p>}

            <Button type="submit" className="w-full rounded-lg text-base py-5 lg:py-6 bg-gradient-to-r from-primary to-secondary font-bold tracking-wider" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" /> : 'LOGIN'}
            </Button>
          </form>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Não tem uma conta? </span>
            <Link href="/cadastro" className="font-semibold text-primary hover:underline">
              Registre-se
            </Link>
          </div>
        </div>
      </div>
      
      <TeamDialog 
        isOpen={teamDialogOpen} 
        onClose={() => setTeamDialogOpen(false)} 
        user={pendingNoTeamUser} 
        isFromLogin={true}
      />
      
      <ForgotPasswordDialog 
        isOpen={forgotPasswordOpen}
        onOpenChange={setForgotPasswordOpen}
      />
    </div>
  );
}