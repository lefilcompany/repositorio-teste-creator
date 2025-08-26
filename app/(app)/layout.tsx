// app/(app)/layout.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Sidebar from '@/components/sidebar';
import TopBar from '@/components/topbar';
import { Toaster } from "@/components/ui/sonner"
import { Loader2 } from 'lucide-react';
import Tutorial from '@/components/tutorial';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Só redirecionar quando terminar de carregar E não estiver autenticado
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Mostrar loading enquanto carrega
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se não está autenticado, não renderizar (useEffect vai redirecionar)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-background via-background to-muted/10">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-background/50 to-background">
          <div className="max-w-8xl mx-auto">
            {children}
          </div>
        </main>
        <Toaster richColors />
        <Tutorial />
      </div>
    </div>
  );
}