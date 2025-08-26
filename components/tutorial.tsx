'use client';

import { useEffect, useState } from 'react';

interface Step {
  selector: string;
  title: string;
  description: string;
}

const steps: Step[] = [
  { selector: '#nav-home', title: 'Página inicial', description: 'Visão geral com atalhos para todas as áreas da plataforma.' },
  { selector: '#nav-marcas', title: 'Marcas', description: 'Cadastre e gerencie marcas que utilizarão o Creator.' },
  { selector: '#nav-temas', title: 'Temas estratégicos', description: 'Organize os principais assuntos que guiam sua produção.' },
  { selector: '#nav-personas', title: 'Personas', description: 'Defina o público-alvo para personalizar o conteúdo.' },
  { selector: '#nav-historico', title: 'Histórico', description: 'Acompanhe o que já foi produzido e revise trabalhos anteriores.' },
  { selector: '#nav-criar', title: 'Criar conteúdo', description: 'Gere novos textos e imagens com auxílio de IA.' },
  { selector: '#nav-revisar', title: 'Revisar conteúdo', description: 'Faça ajustes e aprove conteúdo antes de publicar.' },
  { selector: '#nav-planejar', title: 'Planejar conteúdo', description: 'Monte o cronograma de publicações de forma simples.' },
  { selector: '#topbar-search', title: 'Busca rápida', description: 'Encontre marcas, temas ou personas em instantes.' },
  { selector: '#topbar-notifications', title: 'Notificações', description: 'Fique atento às novidades e alertas do sistema.' },
  { selector: '#topbar-settings', title: 'Configurações', description: 'Ajuste preferências e acesse informações do Creator.' },
  { selector: '#topbar-profile', title: 'Perfil', description: 'Visualize e edite os dados da sua conta.' },
];

export default function Tutorial() {
  const [stepIndex, setStepIndex] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const seen = localStorage.getItem('hasSeenTutorial');
    if (!seen) {
      setIsActive(true);
    }
  }, []);

  useEffect(() => {
    if (!isActive) return;
    const step = steps[stepIndex];
    const element = document.querySelector(step.selector) as HTMLElement | null;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    setPosition({ top: rect.bottom + 8, left: rect.left });

    element.classList.add('tutorial-highlight');
    element.style.pointerEvents = 'none';
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });

    return () => {
      element.classList.remove('tutorial-highlight');
      element.style.pointerEvents = '';
    };
  }, [isActive, stepIndex]);

  const nextStep = () => {
    if (stepIndex < steps.length - 1) {
      setStepIndex((i) => i + 1);
    } else {
      setIsActive(false);
      if (typeof window !== 'undefined') {
        localStorage.setItem('hasSeenTutorial', 'true');
      }
    }
  };

  if (!isActive) return null;
  const step = steps[stepIndex];

  return (
    <div className="fixed inset-0 z-40 pointer-events-none">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        style={{ top: position.top, left: position.left }}
        className="absolute z-50 max-w-xs rounded-xl bg-popover text-popover-foreground p-4 shadow-lg pointer-events-auto"
      >
        <h3 className="font-semibold mb-2">{step.title}</h3>
        <p className="text-sm mb-4">{step.description}</p>
        <button
          onClick={nextStep}
          className="ml-auto block rounded-md bg-primary px-4 py-2 text-primary-foreground text-sm"
        >
          {stepIndex === steps.length - 1 ? 'Finalizar' : 'Próximo'}
        </button>
      </div>
    </div>
  );
}

