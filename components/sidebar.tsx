'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  Home,
  Sparkles,
  CheckCircle,
  Tag,
  Palette,
  Users,
  Calendar,
  Rocket,
  History,
  Shield,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

// --- DATA DEFINITIONS ---
const navLinks = [
  { id: 'nav-home', href: '/', icon: Home, label: 'Home' },
  { id: 'nav-marcas', href: '/marcas', icon: Tag, label: 'Marcas' },
  { id: 'nav-temas', href: '/temas', icon: Palette, label: 'Temas Estratégicos' },
  { id: 'nav-personas', href: '/personas', icon: Users, label: 'Personas' },
  { id: 'nav-historico', href: '/historico', icon: History, label: 'Histórico' },
];

const contentAction = {
  id: 'nav-criar',
  href: '/content',
  icon: Sparkles,
  label: 'Criar Conteúdo',
}

const reviewAction = {
  id: 'nav-revisar',
  href: '/revisar',
  icon: CheckCircle,
  label: 'Revisar Conteúdo',
}

const planAction = {
  id: 'nav-planejar',
  href: '/planejamento',
  icon: Calendar,
  label: 'Planejar Conteúdo',
}

const navFooter = [
  { id: 'nav-equipe', href: '/equipe', icon: Rocket, label: 'Equipe' },
];

// NavItem Unificado
function NavItem({ id, href, icon: Icon, label, onClose }: { id: string; href: string; icon: React.ElementType; label: string; onClose?: () => void }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      id={id}
      href={href}
      onClick={onClose}
      className={cn(
        "flex items-center gap-4 p-3 rounded-lg transition-colors duration-200 group",
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground bg-background hover:bg-muted hover:text-foreground'
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="font-medium text-sm">{label}</span>
    </Link>
  );
}

// ContentAction Unificado
function ContentAction({ id, href, icon: Icon, label, onClose }: { id: string; href: string; icon: React.ElementType; label: string; onClose?: () => void }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      id={id}
      href={href}
      onClick={onClose}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 bg-primary",
        isActive
          ? 'bg-background border border-primary text-primary shadow-lg scale-105'
          : 'text-background hover:bg-background hover:text-primary hover:border hover:border-primary'
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="font-medium text-sm">{label}</span>
    </Link>
  );
}

// ReviewAction Unificado
function ReviewAction({ id, href, icon: Icon, label, onClose }: { id: string; href: string; icon: React.ElementType; label: string; onClose?: () => void }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      id={id}
      href={href}
      onClick={onClose}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 bg-accent",
        isActive
          ? 'bg-background border border-accent text-accent shadow-lg scale-105'
          : 'text-background hover:bg-background hover:text-accent hover:border hover:border-accent'
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="font-medium text-sm">{label}</span>
    </Link>
  );
}

// PlanAction Unificado
function PlanAction({ id, href, icon: Icon, label, onClose }: { id: string; href: string; icon: React.ElementType; label: string; onClose?: () => void }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      id={id}
      href={href}
      onClick={onClose}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 bg-secondary",
        isActive
          ? 'bg-background border border-secondary text-secondary shadow-lg scale-105'
          : 'text-secondary-foreground hover:bg-background hover:text-secondary hover:border hover:border-secondary'
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="font-medium text-sm">{label}</span>
    </Link>
  );
}


// TeamPlanSection Unificada
function TeamPlanSection({ item, teamName, planName, isAdmin, onClose }: { item: { id?: string; href: string; icon: React.ElementType; label: string }; teamName: string; planName: string; isAdmin: boolean; onClose?: () => void }) {
  const { id, href, icon: Icon, label } = item;

  const handleNonAdminClick = () => {
    toast.warning("Acesso Restrito", {
      description: "Apenas o administrador da equipe pode acessar esta página. Entre em contato com o administrador para obter as permissões necessárias.",
      duration: 5000,
      icon: <Shield className="h-5 w-5 text-amber-500" />,
      style: {
        background: "hsl(var(--card))",
        border: "1px solid hsl(var(--accent))",
        borderLeft: "4px solid #f59e0b",
        color: "hsl(var(--foreground))",
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      },
      className: "group toast-warning",
    });
  };

  const content = (
    <>
      <Icon className="h-6 w-6 flex-shrink-0" />
      <div className="flex flex-col items-start leading-tight">
        <span className="font-bold text-sm">Equipe: {teamName || 'Sem equipe'}</span>
        <span className="text-xs text-primary-foreground/80">Plano: {planName || 'Nenhum'}</span>
      </div>
    </>
  );

  const classes = cn(
    "flex items-center gap-4 p-3 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105",
    "bg-gradient-to-tr from-primary to-fuchsia-600 text-primary-foreground shadow-lg"
  );

  if (isAdmin) {
    return (
      <Link id={id} href={href} onClick={onClose} className={classes} aria-label={label}>
        {content}
      </Link>
    );
  }

  return (
    <div
      id={id}
      className={cn(classes, "cursor-pointer")}
      aria-label={label}
      onClick={handleNonAdminClick}
    >
      {content}
    </div>
  );
}


export default function Sidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const { user, team } = useAuth();

  const teamName = team?.name || '';
  const isAdmin = user && team ? user.email === team.admin : false;
  const planName = team?.plan?.name || 'FREE';

  const sidebarContent = (isMobile = false) => (
    <>
      <div className='p-2 mb-6'>
        <Link href="/" onClick={isMobile ? onClose : undefined}>
          <Image
            src="/assets/logoCreatorPreta.png"
            alt="Logo Creator"
            width={140}
            height={36}
            priority
          />
        </Link>
      </div>

      <nav className="flex-1 flex flex-col gap-8">
        <div className='flex flex-col gap-3'>
          {navLinks.map((link) => (
            <NavItem key={link.href} {...link} onClose={isMobile ? onClose : undefined} />
          ))}
        </div>

        <div className='flex flex-col gap-4'>
          <ContentAction {...contentAction} onClose={isMobile ? onClose : undefined} />
          <ReviewAction {...reviewAction} onClose={isMobile ? onClose : undefined} />
          <PlanAction {...planAction} onClose={isMobile ? onClose : undefined} />
        </div>

        <div className="mt-auto">
          <TeamPlanSection
            item={navFooter[0]}
            teamName={teamName}
            planName={planName.toUpperCase()}
            isAdmin={!!isAdmin}
            onClose={isMobile ? onClose : undefined}
          />
        </div>
      </nav>
    </>
  );


  return (
    <>
      {/* Mobile Sidebar */}
      <div className={cn(
        "fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden transition-all duration-500 ease-out",
        isOpen
          ? "opacity-100 visible"
          : "opacity-0 invisible"
      )}
        onClick={onClose}
      />

      <aside className={cn(
        "w-64 bg-card shadow-md shadow-primary/50 p-4 flex flex-col",
        "lg:hidden",
        "fixed inset-y-0 left-0 z-40",
        "transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 ml-3 p-1.5 hover:bg-muted rounded-lg transition-all duration-200 flex-shrink-0 hover:scale-110"
          aria-label="Fechar menu"
        >
          <X className="h-4 w-4" />
        </button>
        {sidebarContent(true)}
      </aside>

      {/* Desktop Sidebar */}
      <aside className="w-64 flex-shrink-0 shadow-md shadow-primary/50 bg-card p-4 flex-col hidden lg:flex">
        {sidebarContent(false)}
      </aside>
    </>
  );
}