'use client';

import { useEffect, useState } from 'react';
import Joyride, { CallBackProps, Step } from 'react-joyride';

export default function Tutorial() {
  const [run, setRun] = useState(false);

  const steps: Step[] = [
    {
      target: '[data-tour="nav-home"]',
      content: 'Visão geral e destaques da plataforma.',
      disableBeacon: true,
      placement: 'right',
    },
    {
      target: '[data-tour="nav-marcas"]',
      content: 'Gerencie suas marcas e identidades.',
      placement: 'right',
    },
    {
      target: '[data-tour="nav-temas"]',
      content: 'Defina os temas estratégicos do seu conteúdo.',
      placement: 'right',
    },
    {
      target: '[data-tour="nav-personas"]',
      content: 'Cadastre personas para direcionar suas criações.',
      placement: 'right',
    },
    {
      target: '[data-tour="nav-historico"]',
      content: 'Revise conteúdos já produzidos.',
      placement: 'right',
    },
    {
      target: '[data-tour="nav-content"]',
      content: 'Crie novos conteúdos com IA.',
      placement: 'right',
    },
    {
      target: '[data-tour="nav-review"]',
      content: 'Revise e aprove os conteúdos gerados.',
      placement: 'right',
    },
    {
      target: '[data-tour="nav-plan"]',
      content: 'Planeje e organize suas publicações.',
      placement: 'right',
    },
    {
      target: '[data-tour="nav-equipe"]',
      content: 'Gerencie informações da equipe e plano.',
      placement: 'right',
    },
    {
      target: '[data-tour="top-search"]',
      content: 'Busque rapidamente por marcas, temas ou personas.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="top-notifications"]',
      content: 'Veja notificações importantes.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="top-settings"]',
      content: 'Acesse configurações e opções da conta.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="top-profile"]',
      content: 'Visualize e edite seu perfil.',
      placement: 'bottom',
    },
  ];

  useEffect(() => {
    const hasSeen = typeof window !== 'undefined' ? localStorage.getItem('creator_tutorial_done') : 'true';
    if (!hasSeen) {
      setRun(true);
    }
  }, []);

  const handleCallback = (data: CallBackProps) => {
    if (['finished', 'skipped'].includes(data.status)) {
      localStorage.setItem('creator_tutorial_done', 'true');
      setRun(false);
    }
  };

  return (
    <Joyride
      steps={steps}
      continuous
      showSkipButton
      showProgress
      run={run}
      callback={handleCallback}
      styles={{
        options: {
          primaryColor: 'hsl(var(--primary))',
          textColor: 'hsl(var(--foreground))',
          zIndex: 10000,
          overlayColor: 'rgba(0,0,0,0.4)',
          spotlightPadding: 4,
        },
        overlay: {
          backdropFilter: 'blur(4px)',
        },
        tooltipContainer: {
          borderRadius: '0.75rem',
          textAlign: 'left',
        },
        buttonNext: {
          background: 'hsl(var(--primary))',
          borderRadius: '0.5rem',
        },
        buttonBack: {
          marginRight: 10,
          color: 'hsl(var(--muted-foreground))',
        },
        buttonSkip: {
          color: 'hsl(var(--muted-foreground))',
        },
      }}
      locale={{
        back: 'Voltar',
        last: 'Finalizar',
        next: 'Próximo',
        skip: 'Pular',
      }}
    />
  );
}

