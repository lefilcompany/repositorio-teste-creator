'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Home, Sparkles, CheckCircle, Tag, Palette, Users, Calendar, Rocket } from 'lucide-react';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/marcas', icon: Tag, label: 'Marcas' },
  { href: '/temas', icon: Palette, label: 'Temas Estratégicos' },
  { href: '/personas', icon: Users, label: 'Personas' },
];

const contentAction = {
  href: '/creator',
  icon: Sparkles,
  label: 'Criar Conteúdo',
}

const reviewAction = {
  href: '/revisar',
  icon: CheckCircle,
  label: 'Revisar Conteúdo',
}

const planAction = {
  href: '/plan',
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
        "flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105",
        isActive
          ? 'bg-primary/10 text-primary shadow-lg scale-105'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="font-medium">{label}</span>
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
      <span className="font-medium">{label}</span>
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
      <span className="font-medium">{label}</span>
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
      <span className="font-medium">{label}</span>
    </Link>
  );
}

export default function Sidebar() {
  return (
    <aside className="w-64 flex-shrink-0 shadow-sm shadow-primary/20 bg-card p-6 flex-col hidden lg:flex">
      <Link href="/" className="mb-10">
        <Image
          src="/assets/logoCreatorPreta.png"
          alt="Logo Creator"
          width={150}
          height={40}
          priority
        />
      </Link>
      <nav className="flex flex-col gap-16">
        <div className='flex flex-col gap-4'>
          {navLinks.map((link) => (
            <NavItem key={link.href} {...link} />
          ))}
        </div>
        <div className='flex flex-col gap-4'>
            <ContentAction {...contentAction} />
            <ReviewAction {...reviewAction} />
            <PlanAction {...planAction} />
        </div>
        <div className='flex flex-col gap-4'>
          {navFooter.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}
        </div>
      </nav>
    </aside>
  );
}
