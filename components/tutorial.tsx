'use client';

import { useEffect, useState } from 'react';

interface Step {
  selector: string;
  title: string;
  description: string;
}

// Passos detalhados para o tutorial de onboarding de novo usuário
const steps: Step[] = [
  {
    selector: '#nav-home',
    title: 'Página inicial',
    description:
      'Aqui você encontra uma visão geral da plataforma, com atalhos para todas as áreas principais. Use este espaço para se orientar rapidamente e acessar funcionalidades importantes do Creator.'
  },
  {
    selector: '#nav-marcas',
    title: 'Marcas',
    description:
      'Cadastre e gerencie todas as marcas que utilizarão o Creator. Cada marca pode ter suas próprias personas, temas e conteúdos. Clique aqui para adicionar uma nova marca, editar informações ou visualizar detalhes.'
  },
  {
    selector: '#nav-temas',
    title: 'Temas estratégicos',
    description:
      'Organize os principais assuntos que guiam sua produção de conteúdo. Temas ajudam a manter o foco nas estratégias da marca e facilitam o planejamento de publicações.'
  },
  {
    selector: '#nav-personas',
    title: 'Personas',
    description:
      'Defina o público-alvo de cada marca. Personas permitem personalizar o conteúdo para diferentes perfis, aumentando a efetividade das campanhas e comunicações.'
  },
  {
    selector: '#nav-historico',
    title: 'Histórico',
    description:
      'Acompanhe tudo o que já foi produzido, revise trabalhos anteriores, recupere conteúdos e monitore o progresso das suas ações. Ideal para manter o controle e garantir qualidade.'
  },
  {
    selector: '#nav-criar',
    title: 'Criar conteúdo',
    description:
      'Gere novos textos e imagens com auxílio de inteligência artificial. Aqui você pode criar posts, campanhas, imagens e outros materiais de forma rápida e personalizada.'
  },
  {
    selector: '#nav-revisar',
    title: 'Revisar conteúdo',
    description:
      'Faça ajustes, revisões e aprove conteúdos antes de publicar. O fluxo de revisão garante que tudo esteja de acordo com as diretrizes da marca e pronto para ser divulgado.'
  },
  {
    selector: '#nav-planejar',
    title: 'Planejar conteúdo',
    description:
      'Monte o cronograma de publicações de forma simples e visual. Planeje datas, horários e temas para manter uma presença digital consistente e estratégica.'
  },
  {
    selector: '#nav-equipe',
    title: 'Equipe',
    description:
      'Gerencie os membros da equipe que terão acesso à plataforma. Convide, remova ou altere permissões de colaboradores para cada marca.'
  },
  {
    selector: '#topbar-search',
    title: 'Busca rápida',
    description:
      'Encontre marcas, temas, personas ou conteúdos em instantes. Use a busca para navegar rapidamente entre diferentes áreas do sistema.'
  },
  {
    selector: '#topbar-notifications',
    title: 'Notificações',
    description:
      'Fique atento às novidades, alertas e atualizações do sistema. As notificações ajudam a não perder prazos e acompanhar mudanças importantes.'
  },
  {
    selector: '#topbar-settings',
    title: 'Configurações',
    description:
      'Ajuste preferências da plataforma, como idioma, notificações e integrações. Aqui também é possível acessar informações sobre o Creator e suporte.'
  },
  {
    selector: '#topbar-profile',
    title: 'Perfil',
    description:
      'Visualize e edite os dados da sua conta, altere senha, foto de perfil e informações pessoais. Mantenha seus dados sempre atualizados.'
  },
];

const whiteBgSelectors = new Set([
  '#nav-home',
  '#nav-marcas',
  '#nav-temas',
  '#nav-personas',
  '#nav-historico',
  '#topbar-settings',
  '#topbar-notifications',
]);

import { useAuth } from '@/hooks/useAuth';

export default function Tutorial() {
  const { user, isAuthenticated } = useAuth();
  const [stepIndex, setStepIndex] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [dialogWidth, setDialogWidth] = useState(320);

  // Só mostrar para usuário autenticado e novo (primeiro acesso)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isAuthenticated || !user) return;
    // Checa se já viu tutorial para este usuário
    const seen = localStorage.getItem(`hasSeenTutorial:${user.id}`);
    if (!seen) {
      setIsActive(true);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!isActive) return;
    const step = steps[stepIndex];
    const element = document.querySelector(step.selector) as HTMLElement | null;
    if (!element) return;

    // Remove highlight de todos antes de aplicar no atual
    document.querySelectorAll('.tutorial-highlight').forEach(el => {
      el.classList.remove('tutorial-highlight');
      (el as HTMLElement).style.zIndex = '';
      (el as HTMLElement).style.pointerEvents = '';
      (el as HTMLElement).style.filter = '';
      (el as HTMLElement).style.boxShadow = '';
      (el as HTMLElement).style.backgroundColor = '';
    });

    // Aplica highlight e z-index alto; mantemos a cor original do botão
    const originalBg = element.style.backgroundColor;
    element.classList.add('tutorial-highlight');
    element.style.zIndex = '9999';
    element.style.pointerEvents = 'none';
    element.style.boxShadow = '0 6px 20px rgba(215,38,96,0.18)';
    if (whiteBgSelectors.has(step.selector)) {
      element.style.backgroundColor = '#fff';
    }

    // Centraliza o elemento na tela se não estiver visível
    const rect = element.getBoundingClientRect();
    if (
      rect.top < 0 ||
      rect.bottom > window.innerHeight ||
      rect.left < 0 ||
      rect.right > window.innerWidth
    ) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    }

    // Calcula posição do card para não sair da tela
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const margin = 24; // margem visual da viewport para não ficar colado
    const calculatedWidth = Math.min(360, viewportW - margin * 2);
    const cardHeight = 240;
    const gap = 32; // distância padrão do elemento
    const sideGap = 36; // distância quando posicionado ao lado

    setDialogWidth(calculatedWidth);

    const leftThird = viewportW * 0.33;
    let top = rect.top;
    let left = rect.left;
    const lift = 16; // sobe o card alguns pixels para evitar ficar colado no fim da tela

    if (rect.left < leftThird) {
      // Item da sidebar: posicionar à direita do elemento e centralizar verticalmente
      left = rect.right + sideGap;
      top = Math.round(rect.top + rect.height / 2 - cardHeight / 2);
      // ajustar verticalmente para caber
      top = Math.max(margin, Math.min(top, viewportH - cardHeight - margin));
      // ajustar horizontalmente se extrapolar
      if (left + calculatedWidth > viewportW - margin) {
        // tenta posicionar à esquerda do elemento
        const leftOf = rect.left - calculatedWidth - sideGap;
        if (leftOf >= margin) {
          left = leftOf;
        } else {
          left = Math.max(margin, viewportW - calculatedWidth - margin);
        }
      }
    } else {
      // posiciona abaixo por padrão
      top = rect.bottom + gap;
      left = rect.left;
      if (left + calculatedWidth > viewportW - margin) left = viewportW - calculatedWidth - margin;

      // se ao posicionar abaixo extrapolar verticalmente, preferir tentar ao lado (direita) antes de subir
      if (top + cardHeight > viewportH) {
        const tryRight = rect.right + sideGap;
        if (tryRight + calculatedWidth <= viewportW - margin) {
          left = tryRight;
          top = Math.round(rect.top + rect.height / 2 - cardHeight / 2);
          top = Math.max(margin, Math.min(top, viewportH - cardHeight - margin));
        } else {
          // posiciona acima
          const above = rect.top - cardHeight - gap;
          if (above >= margin) {
            top = above;
          } else {
            top = Math.max(margin, viewportH - cardHeight - margin);
          }
        }
      }
    }

    // aplicar deslocamento vertical (lift) para subir o diálogo um pouco
    top = top - lift;

    // centraliza em telas muito pequenas
    if (viewportW <= 420) {
      left = Math.max(margin, Math.floor((viewportW - calculatedWidth) / 2));
    }

    // Garantir que o card não exceda o bottom da viewport;
    // se estiver próximo ao fim, subir o suficiente para caber (com margem)
    const maxTop = Math.max(margin, viewportH - cardHeight - margin);
    if (top > maxTop) {
      // sobe apenas o necessário
      top = maxTop;
    }
    // garantir top mínimo
    if (top < margin) top = margin;

    setPosition({ top, left });

    return () => {
      element.classList.remove('tutorial-highlight');
      element.style.zIndex = '';
      element.style.pointerEvents = '';
      element.style.filter = '';
      element.style.boxShadow = '';
      element.style.backgroundColor = originalBg;
    };
  }, [isActive, stepIndex]);

  const nextStep = () => {
    if (stepIndex < steps.length - 1) {
      setStepIndex((i) => i + 1);
    } else {
      setIsActive(false);
      if (typeof window !== 'undefined' && user) {
        localStorage.setItem(`hasSeenTutorial:${user.id}`, 'true');
      }
    }
  };

  if (!isActive) return null;
  const step = steps[stepIndex];

  // AlertDialog: bloqueia saída até finalizar tutorial
  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center pointer-events-auto">
      {/* Overlay escurecido */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px] transition-opacity duration-300" />
      {/* Card do tutorial (AlertDialog) */}
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="tutorial-title"
        aria-describedby="tutorial-desc"
        tabIndex={0}
        style={{
          top: position.top,
          left: position.left,
          width: dialogWidth,
          maxHeight: 'calc(100vh - 48px)',
          overflowY: 'auto',
          background: 'linear-gradient(135deg, #fff 80%, #f8e6f0 100%)',
          boxShadow: '0 8px 32px 0 rgba(215,38,96,0.18)',
          border: '2px solid #d72660',
        }}
        className="absolute animate-fade-in z-[9999] rounded-2xl p-7 flex flex-col gap-2 focus:outline-none"
      >
        {/* Progresso */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold text-primary">Passo {stepIndex + 1} de {steps.length}</span>
          <div className="flex-1 h-1 bg-muted rounded ml-2">
            <div
              className="h-1 bg-primary rounded transition-all"
              style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>
        {/* Conteúdo */}
        <h3 id="tutorial-title" className="font-bold text-xl mb-1 text-primary" style={{ textShadow: '0 1px 2px #fff' }}> {step.title} </h3>
        <p id="tutorial-desc" className="text-base mb-4 whitespace-pre-line text-zinc-800 font-medium" style={{ textShadow: '0 1px 2px #fff' }}> {step.description} </p>
        <button
          onClick={nextStep}
          className="ml-auto block rounded-md bg-primary px-7 py-2 text-primary-foreground text-base font-bold shadow hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
          style={{ pointerEvents: 'auto', minWidth: 120 }}
        >
          {stepIndex === steps.length - 1 ? 'Finalizar' : 'Próximo'}
        </button>
      </div>
      <style jsx global>{`
        .tutorial-highlight {
          outline: 3px solid rgba(215,38,96,0.95);
          border-radius: 0.75rem;
          box-shadow: 0 6px 20px rgba(215,38,96,0.12);
          transition: outline 0.18s ease, box-shadow 0.18s ease, transform 0.18s;
          position: relative;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: none; }
        }
        .animate-fade-in {
          animation: fade-in 0.3s cubic-bezier(.4,0,.2,1);
        }
      `}</style>
    </div>
  );
}