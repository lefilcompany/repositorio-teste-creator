// components/UsageTracker.tsx
'use client';

import { useUsageTracking } from '@/hooks/useUsageTracking';

export function UsageTracker() {
  // O hook já gerencia automaticamente o tracking baseado na autenticação
  useUsageTracking();

  // Este componente não renderiza nada visualmente
  return null;
}
