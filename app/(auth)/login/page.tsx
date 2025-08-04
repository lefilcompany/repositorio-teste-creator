// app/(auth)/login/page.tsx
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

const carouselItems = [
  {
    imageSrc: "/assets/logoCreatorPreta.png",
    altText: "Placeholder para Feature 1",
  },
  {
    imageSrc: "/assets/logoCreatorPreta.png",
    altText: "Placeholder para Feature 2",
  },
  {
    imageSrc: "/assets/logoCreatorPreta.png",
    altText: "Placeholder para Feature 3",
  },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  // 2. Crie uma referência para o plugin
  const plugin = useRef(
    Autoplay({ delay: 3000, stopOnInteraction: false }) // Delay de 3 segundos
  );

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    setTimeout(() => {
      const success = login({ email, password });
      if (!success) {
        setError('E-mail ou senha inválidos.');
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="w-full min-h-screen lg:grid lg:grid-cols-2">
      {/* Coluna Esquerda: Carrossel e Showcase */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-primary to-secondary text-white">
        {/* Logo (precisa de uma versão branca) */}
        <Link href="/">
          <Image
            src="/assets/logoCreatorPreta.png" // Idealmente, use uma versão branca aqui: logoCreatorBranca.png
            alt="Creator Logo"
            width={140}
            height={36}
            className="invert brightness-0" // Truque de CSS para deixar o logo preto branco
          />
        </Link>
        
        {/* 3. Adicione o plugin ao Carrossel */}
        <Carousel 
          className="w-full max-w-md mx-auto" 
          opts={{ loop: true }}
          plugins={[plugin.current]}
          onMouseEnter={() => plugin.current.stop()}
          onMouseLeave={() => plugin.current.reset()}
        >
          <CarouselContent>
            {carouselItems.map((item, index) => (
              <CarouselItem key={index}>
                <div className="p-1">
                    <Image 
                        src={item.imageSrc} 
                        alt={item.altText} 
                        width={800} 
                        height={600} 
                        className="rounded-lg shadow-2xl aspect-video object-cover"
                    />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
        <div className="max-w-md">
          <h2 className="text-3xl font-bold">Aqui, suas ideias ganham forma com a força da inteligência artificial.</h2>
          <p className="mt-4 text-white/80">Crie, planeje e transforme conteúdos com autonomia e estratégia.</p>
        </div>
      </div>
      
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center">
            <Image
              src="/assets/logoCreatorPreta.png"
              alt="Creator Logo"
              width={260}
              height={60}
              className="mx-auto mb-6"
            />
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2"><Mail size={16}/> E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seuemail@exemplo.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-4"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password"  className="flex items-center gap-2"><Lock size={16}/> Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Sua senha"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-4 pr-10"
                />
                <Button type="button" variant="ghost" size="icon" className="absolute top-0 right-0 h-full w-10" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Checkbox id="remember-me" />
                    <Label htmlFor="remember-me" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Mantenha-me conectado</Label>
                </div>
                <Link href="#" className="text-sm text-primary hover:underline">Esqueceu a senha?</Link>
            </div>
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
            <Button type="submit" className="w-full rounded-full text-base py-6 bg-gradient-to-r from-primary to-secondary" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" /> : 'LOGIN'}
            </Button>
          </form>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Ou continue com</span>
            </div>
          </div>
          <div className="flex justify-center gap-4">
            <Button variant="outline" size="icon" className="rounded-full"><FaGoogle size={20} /></Button>
            <Button variant="outline" size="icon" className="rounded-full"><FaApple size={20} /></Button>
            <Button variant="outline" size="icon" className="rounded-full"><FaFacebook size={20} /></Button>
          </div>
          <div className="text-center text-sm">
            Não tem uma conta?{' '}
            <Link href="/cadastro" className="font-semibold text-primary hover:underline">
              Registre-se
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}