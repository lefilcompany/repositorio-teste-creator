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
  Shield
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

function NavItem({ id, href, icon: Icon, label }: { id: string; href: string; icon: React.ElementType; label: string }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      id={id}
      href={href}
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

function ContentAction({ id, href, icon: Icon, label }: { id: string; href: string; icon: React.ElementType; label: string }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      id={id}
      href={href}
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

// BOTÃO DE REVISAR COM ESTILO CORRIGIDO
function ReviewAction({ id, href, icon: Icon, label }: { id: string; href: string; icon: React.ElementType; label: string }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      id={id}
      href={href}
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

// BOTÃO DE PLANEJAR COM ESTILO CORRIGIDO
function PlanAction({ id, href, icon: Icon, label }: { id: string; href: string; icon: React.ElementType; label: string }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      id={id}
      href={href}
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

function TeamPlanSection({ item, teamName, planName, isAdmin }: { item: { id?: string; href: string; icon: React.ElementType; label: string }; teamName: string; planName: string; isAdmin: boolean }) {
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
      <Link id={id} href={href} className={classes} aria-label={label}>
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

export default function Sidebar() {
  const { user, team } = useAuth();

  const teamName = team?.name || '';
  const isAdmin = user && team ? user.email === team.admin : false;
  const planName = typeof team?.plan === 'object' ? team.plan.name : team?.plan || '';

  return (
    <aside className="w-64 flex-shrink-0 shadow-sm shadow-primary/20 bg-card p-4 flex-col hidden lg:flex">
      <div className='p-2 mb-6'>
        <Link href="/">
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
            <NavItem key={link.href} {...link} />
          ))}
        </div>
        
        <div className='flex flex-col gap-4'>
          <ContentAction {...contentAction} />
          <ReviewAction {...reviewAction} />
          <PlanAction {...planAction} />
        </div>
        
        <div className="">
          <TeamPlanSection item={navFooter[0]} teamName={teamName} planName={planName.toUpperCase()} isAdmin={!!isAdmin} />
        </div>
      </nav>
    </aside>
  );
}