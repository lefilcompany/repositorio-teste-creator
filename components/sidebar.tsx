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

// Mobile NavItem (responsivo atual)
function MobileNavItem({ id, href, icon: Icon, label, onClose }: { id: string; href: string; icon: React.ElementType; label: string; onClose?: () => void }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      id={id}
      href={href}
      onClick={onClose}
      className={cn(
        "flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 group w-full",
        isActive
          ? 'bg-primary/10 text-primary border border-primary/20'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span className="font-medium text-xs truncate">{label}</span>
    </Link>
  );
}

// Desktop NavItem (novo design)
function DesktopNavItem({ id, href, icon: Icon, label }: { id: string; href: string; icon: React.ElementType; label: string }) {
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

// Mobile ContentAction (responsivo atual)
function MobileContentAction({ id, href, icon: Icon, label, onClose }: { id: string; href: string; icon: React.ElementType; label: string; onClose?: () => void }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      id={id}
      href={href}
      onClick={onClose}
      className={cn(
        "flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 transform hover:scale-[1.01] w-full",
        "bg-primary text-primary-foreground shadow-md",
        isActive
          ? 'bg-primary/90 shadow-lg scale-[1.01]'
          : 'hover:bg-primary/90 hover:shadow-lg'
      )}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span className="font-medium text-xs truncate">{label}</span>
    </Link>
  );
}

// Desktop ContentAction (novo design)
function DesktopContentAction({ id, href, icon: Icon, label }: { id: string; href: string; icon: React.ElementType; label: string }) {
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

// Mobile ReviewAction (responsivo atual)
function MobileReviewAction({ id, href, icon: Icon, label, onClose }: { id: string; href: string; icon: React.ElementType; label: string; onClose?: () => void }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      id={id}
      href={href}
      onClick={onClose}
      className={cn(
        "flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 transform hover:scale-[1.01] w-full",
        "bg-accent text-accent-foreground shadow-md",
        isActive
          ? 'bg-accent/90 shadow-lg scale-[1.01]'
          : 'hover:bg-accent/90 hover:shadow-lg'
      )}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span className="font-medium text-xs truncate">{label}</span>
    </Link>
  );
}

// Desktop ReviewAction (novo design)
function DesktopReviewAction({ id, href, icon: Icon, label }: { id: string; href: string; icon: React.ElementType; label: string }) {
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

// Mobile PlanAction (responsivo atual)
function MobilePlanAction({ id, href, icon: Icon, label, onClose }: { id: string; href: string; icon: React.ElementType; label: string; onClose?: () => void }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      id={id}
      href={href}
      onClick={onClose}
      className={cn(
        "flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 transform hover:scale-[1.01] w-full",
        "bg-secondary text-secondary-foreground shadow-md",
        isActive
          ? 'bg-secondary/90 shadow-lg scale-[1.01]'
          : 'hover:bg-secondary/90 hover:shadow-lg'
      )}
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span className="font-medium text-xs truncate">{label}</span>
    </Link>
  );
}

// Desktop PlanAction (novo design)
function DesktopPlanAction({ id, href, icon: Icon, label }: { id: string; href: string; icon: React.ElementType; label: string }) {
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

// Mobile TeamPlanSection (responsivo atual)
function MobileTeamPlanSection({ item, teamName, planName, isAdmin, onClose }: { item: { id?: string; href: string; icon: React.ElementType; label: string }; teamName: string; planName: string; isAdmin: boolean; onClose?: () => void }) {
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
      <Icon className="h-5 w-5 flex-shrink-0" />
      <div className="flex flex-col items-start leading-tight min-w-0 flex-1">
        <span className="font-bold text-xs truncate w-full">Equipe: {teamName || 'Sem equipe'}</span>
        <span className="text-xs text-primary-foreground/80 truncate w-full">Plano: {planName || 'Nenhum'}</span>
      </div>
    </>
  );

  const classes = cn(
    "flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 transform hover:scale-[1.01] w-full",
    "bg-gradient-to-r from-primary to-purple-600 text-primary-foreground shadow-md"
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

// Desktop TeamPlanSection (novo design)
function DesktopTeamPlanSection({ item, teamName, planName, isAdmin }: { item: { id?: string; href: string; icon: React.ElementType; label: string }; teamName: string; planName: string; isAdmin: boolean }) {
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

export default function Sidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const { user, team } = useAuth();

  const teamName = team?.name || '';
  const isAdmin = user && team ? user.email === team.admin : false;
  const planName = typeof team?.plan === 'object' ? team.plan.name : team?.plan || '';

  return (
    <>
      {/* Mobile Sidebar */}
      <aside className={cn(
        // Base styles
        "w-64 bg-card shadow-sm shadow-primary/20 flex flex-col",
        "lg:hidden",
        "fixed inset-y-0 left-0 z-40",
        isOpen ? "block" : "hidden", 
        "transition-all duration-500 ease-out",
        "transform",
        isOpen 
          ? "translate-x-0 opacity-100" 
          : "-translate-x-full opacity-0",
        "backdrop-blur-sm border-r border-border/20"
      )}>
        {/* Header with logo and close button */}
        <div className="p-3 border-b border-border/10 bg-background/50 backdrop-blur-sm">
          <div className="flex justify-between items-center">
            <Link href="/" onClick={onClose} className="block">
              <Image
                src="/assets/logoCreatorPreta.png"
                alt="Logo Creator"
                width={120}
                height={30}
                priority
                className="h-8 w-auto"
              />
            </Link>
            {onClose && (
              <button
                onClick={onClose}
                className="ml-3 p-1.5 hover:bg-muted rounded-lg transition-all duration-200 flex-shrink-0 hover:scale-110"
                aria-label="Fechar menu"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation content */}
        <div className="flex-1 p-3 overflow-y-auto scrollbar-thin scrollbar-thumb-muted">
          <nav className="flex flex-col gap-4 h-full">
            {/* Main navigation links */}
            <div className='flex flex-col gap-2'>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 px-1">
                Navegação
              </h3>
              {navLinks.map((link, index) => (
                <div 
                  key={link.href}
                  className={cn(
                    "transform transition-all duration-500 ease-out",
                    isOpen 
                      ? "translate-x-0 opacity-100" 
                      : "translate-x-4 opacity-0"
                  )}
                  style={{ 
                    transitionDelay: isOpen ? `${index * 50}ms` : '0ms' 
                  }}
                >
                  <MobileNavItem {...link} onClose={onClose} />
                </div>
              ))}
            </div>
            
            {/* Action buttons */}
            <div className='flex flex-col gap-4'>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 px-1">
                Ações
              </h3>
              <div 
                className={cn(
                  "transform transition-all duration-500 ease-out",
                  isOpen 
                    ? "translate-x-0 opacity-100" 
                    : "translate-x-4 opacity-0"
                )}
                style={{ transitionDelay: isOpen ? '250ms' : '0ms' }}
              >
                <MobileContentAction {...contentAction} onClose={onClose} />
              </div>
              <div 
                className={cn(
                  "transform transition-all duration-500 ease-out",
                  isOpen 
                    ? "translate-x-0 opacity-100" 
                    : "translate-x-4 opacity-0"
                )}
                style={{ transitionDelay: isOpen ? '300ms' : '0ms' }}
              >
                <MobileReviewAction {...reviewAction} onClose={onClose} />
              </div>
              <div 
                className={cn(
                  "transform transition-all duration-500 ease-out",
                  isOpen 
                    ? "translate-x-0 opacity-100" 
                    : "translate-x-4 opacity-0"
                )}
                style={{ transitionDelay: isOpen ? '350ms' : '0ms' }}
              >
                <MobilePlanAction {...planAction} onClose={onClose} />
              </div>
            </div>
            
            {/* Team section at bottom */}
            <div className="mt-auto pt-3 border-t border-border/10">
              <div 
                className={cn(
                  "transform transition-all duration-500 ease-out",
                  isOpen 
                    ? "translate-x-0 opacity-100" 
                    : "translate-x-4 opacity-0"
                )}
                style={{ transitionDelay: isOpen ? '400ms' : '0ms' }}
              >
                <MobileTeamPlanSection 
                  item={navFooter[0]} 
                  teamName={teamName} 
                  planName={planName.toUpperCase()} 
                  isAdmin={!!isAdmin} 
                  onClose={onClose} 
                />
              </div>
            </div>
          </nav>
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside className="w-64 flex-shrink-0 shadow-md shadow-primary/50 bg-card p-4 flex-col hidden lg:flex">
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
              <DesktopNavItem key={link.href} {...link} />
            ))}
          </div>
          
          <div className='flex flex-col gap-4'>
            <DesktopContentAction {...contentAction} />
            <DesktopReviewAction {...reviewAction} />
            <DesktopPlanAction {...planAction} />
          </div>
          
          <div className="">
            <DesktopTeamPlanSection item={navFooter[0]} teamName={teamName} planName={planName.toUpperCase()} isAdmin={!!isAdmin} />
          </div>
        </nav>
      </aside>
    </>
  );
}