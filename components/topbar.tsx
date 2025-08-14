// components/topbar.tsx
'use client';

import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Search, Bell, Settings, User, LogOut, Info, FileText, Shield } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function TopBar() {
  const { logout } = useAuth();

  return (
    <header className="flex h-20 items-center justify-between shadow-sm shadow-primary/10 bg-card px-4 md:px-8 flex-shrink-0">
      <div className="relative flex-1 max-w-2xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Pesquisar projetos, marcas, temas..."
          className="w-full rounded-2xl pl-12 pr-6 py-3 text-base border-2 border-border/50 bg-background/50 hover:border-primary/30 focus:border-primary/50 transition-all duration-300"
        />
      </div>
      <div className="flex items-center gap-3 md:gap-4 ml-6">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-2xl h-12 w-12 hover:bg-primary/10 transition-all duration-300 hover:scale-105 border border-transparent hover:border-primary/20"
        >
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notificações</span>
        </Button>

        <Dialog>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-2xl h-12 w-12 hover:bg-primary/10 transition-all duration-300 hover:scale-105 border border-transparent hover:border-primary/20"
              >
                <Settings className="h-5 w-5" />
                <span className="sr-only">Configurações</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 border-border/20 shadow-xl">
              <DropdownMenuItem className="p-3">
                <Info className="mr-3 h-4 w-4" />
                <span>Sobre o Creator</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="p-3">
                <FileText className="mr-3 h-4 w-4" />
                <span>Termos de Serviço</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="p-3">
                <Shield className="mr-3 h-4 w-4" />
                <span>Política de Privacidade</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DialogTrigger asChild>
                <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10 p-3">
                  <LogOut className="mr-3 h-4 w-4" />
                  <span>Sair da Conta</span>
                </DropdownMenuItem>
              </DialogTrigger>
            </DropdownMenuContent>
          </DropdownMenu>

          <DialogContent className="border-border/20 shadow-2xl">
            <DialogHeader className="items-center text-center">
              <Image
                src="/assets/logoCreatorPreta.png"
                alt="Logo Creator"
                width={130}
                height={35}
                className="mb-6"
              />
              <DialogTitle className="text-2xl font-bold">Você tem certeza que deseja sair?</DialogTitle>
              <DialogDescription className="text-base mt-2">
                Você precisará fazer login novamente para acessar sua conta e continuar criando conteúdo.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-col-reverse sm:flex-row gap-3 mt-6">
              <DialogClose asChild>
                <Button type="button" variant="outline" className="w-full rounded-2xl hover:border-accent border-2 h-12">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="button" variant="destructive" className="w-full rounded-2xl h-12" onClick={logout}>
                Sair da Conta
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Link
          href="/perfil"
          className="flex h-12 w-12 items-center justify-center rounded-2xl 
            bg-gradient-to-br from-primary via-purple-600 to-secondary text-white font-bold text-lg
            transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/25
            border-2 border-transparent hover:border-white/20"
        >
          <User className="h-6 w-6" />
          <span className="sr-only">Perfil</span>
        </Link>
      </div>
    </header>
  );
}