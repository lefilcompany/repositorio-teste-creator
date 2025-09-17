// app/(app)/layout.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Sidebar from '@/components/sidebar';
import TopBar from '@/components/topbar';
import Tutorial from '@/components/tutorial';
import { Toaster } from "@/components/ui/sonner"
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Fecha o menu mobile ao navegar para uma nova página
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

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

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-background via-background to-muted/10">
      {/* Sidebar */}
      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      
      {/* Overlay para o menu mobile com transição suave */}
      <div 
        className={cn(
          "fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden transition-all duration-500 ease-out",
          isMobileMenuOpen 
            ? "opacity-100 visible" 
            : "opacity-0 invisible"
        )}
        onClick={() => setIsMobileMenuOpen(false)}
      />
      
      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <TopBar toggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gradient-to-b from-background/50 to-background">
          <div className="max-w-8xl mx-auto">
            {children}
          </div>
        </main>
        <Toaster richColors />
      </div>
      <Tutorial />
    </div>
  );
}