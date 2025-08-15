'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  Home,
  Sparkles,
  CheckCircle,
  Tag,
  Palette,
  Users,
  Calendar,
  Rocket,
  History
} from 'lucide-react';
import { cn } from '@/lib/utils';

// --- DATA DEFINITIONS ---
const navLinks = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/marcas', icon: Tag, label: 'Marcas' },
  { href: '/temas', icon: Palette, label: 'Temas Estratégicos' },
  { href: '/personas', icon: Users, label: 'Personas' },
  { href: '/historico', icon: History, label: 'Histórico' },
];

const contentAction = {
  href: '/content',
  icon: Sparkles,
  label: 'Criar Conteúdo',
}

const reviewAction = {
  href: '/revisar',
  icon: CheckCircle,
  label: 'Revisar Conteúdo',
}

const planAction = {
  href: '/planejamento',
  icon: Calendar,
  label: 'Planejar Conteúdo',
}

const navFooter = [
  { href: '/equipe', icon: Rocket, label: 'Equipe' },
];

function NavItem({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-4 p-3 rounded-lg transition-colors duration-200 group",
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="font-medium text-sm">{label}</span>
    </Link>
  );
}

function ContentAction({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
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

function ReviewAction({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
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

function PlanAction({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 bg-border",
        isActive
          ? 'bg-background border border-border text-secondary shadow-lg scale-105'
          : 'text-background hover:bg-background hover:text-border hover:border hover:border-border'
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="font-medium text-sm">{label}</span>
    </Link>
  );
}

function TeamPlanSection({ item, teamName, planName, isAdmin }: { item: { href: string; icon: React.ElementType; label: string }; teamName: string; planName: string; isAdmin: boolean }) {
  const { href, icon: Icon } = item;

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
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return <div className={classes}>{content}</div>;
}

export default function Sidebar() {
  const { user, team } = useAuth();

  const teamName = team?.name || '';
  const isAdmin = user && team ? user.email === team.admin : false;
  const planName = team?.plan?.name || '';

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
          <TeamPlanSection item={navFooter[0]} teamName={teamName} planName={planName} isAdmin={!!isAdmin} />
        </div>
      </nav>
    </aside>
  );
}