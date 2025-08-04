'use client';

import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import Carousel from '@/components/ui/carousel';
import { supabase } from '@/lib/supabase';

const formSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

type FormValues = z.infer<typeof formSchema>;

export default function LoginPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(formSchema) });

  const onSubmit = async (values: FormValues) => {
    const { data, error } = await supabase.auth.signInWithPassword(values);
    if (error) {
      alert(error.message);
      return;
    }
    const token = data.session?.access_token;
    if (token) {
      localStorage.setItem('token', token);
      // redirect user or update state here
    }
  };

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) {
      alert(error.message);
    }
  };

  const images = [
    'https://picsum.photos/800/1200?1',
    'https://picsum.photos/800/1200?2',
    'https://picsum.photos/800/1200?3',
  ];

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 lg:block">
        <Carousel images={images} />
      </div>
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md space-y-6">
          <div className="flex justify-center">
            <Image
              src="/assets/logoCreatorPreta.png"
              alt="Creator Logo"
              width={180}
              height={60}
            />
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" placeholder="seuemail@exemplo.com" {...register('email')} />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" {...register('password')} />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full">Entrar</Button>
          </form>
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">ou</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <Button variant="outline" onClick={loginWithGoogle} className="w-full">
            Entrar com Google
          </Button>
        </div>
      </div>
    </div>
  );
}
