'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Bell, Settings, LogOut, User } from 'lucide-react';

export default function TopBar() {
  return (
    <header className="flex h-20 items-center justify-between shadow-sm shadow-primary/10 bg-card px-4 md:px-8 flex-shrink-0">
      <div className="relative flex-1 max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Pesquisar..."
          className="w-full rounded-full pl-10 pr-4 py-2 text-base"
        />
      </div>
      <div className="flex items-center gap-3 md:gap-4">
        <Button variant="ghost" size="icon" className="rounded-full">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notificações</span>
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Settings className="h-5 w-5" />
          <span className="sr-only">Configurações</span>
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full">
          <LogOut className="h-5 w-5" />
          <span className="sr-only">Sair</span>
        </Button>
        <button className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-white font-bold text-lg">
          <User className="h-6 w-6" />
          <span className="sr-only">Perfil</span>
        </button>
      </div>
    </header>
  );
}