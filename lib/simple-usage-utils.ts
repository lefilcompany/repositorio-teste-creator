// lib/simple-usage-utils.ts
import { prisma } from '@/lib/prisma';

interface UsageStats {
  dailyUsage: number;
  monthlyUsage: number;
  lastActivity: Date | null;
}

export async function updateTeamUsage(teamId: string): Promise<void> {
  const now = new Date();
  const currentMonthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const today = now.toISOString().split('T')[0];
  
  // Buscar dados atuais do team
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { 
      currentMonthYear: true, 
      dailyUsageCount: true,
      lastActivityDate: true
    }
  });

  if (!team) return;

  // Verificar se precisa resetar contadores
  const shouldResetMonth = team.currentMonthYear !== currentMonthYear;
  const lastActivityDate = team.lastActivityDate ? team.lastActivityDate.toISOString().split('T')[0] : null;
  const shouldResetDay = lastActivityDate !== today;

  await prisma.team.update({
    where: { id: teamId },
    data: {
      dailyUsageCount: shouldResetDay ? 1 : { increment: 1 },
      monthlyUsageCount: shouldResetMonth ? 1 : { increment: 1 },
      lastActivityDate: now,
      currentMonthYear: currentMonthYear
    }
  });
}

export async function getTeamUsageStats(teamId: string): Promise<UsageStats> {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: {
      dailyUsageCount: true,
      monthlyUsageCount: true,
      lastActivityDate: true
    }
  });

  return {
    dailyUsage: team?.dailyUsageCount || 0,
    monthlyUsage: team?.monthlyUsageCount || 0,
    lastActivity: team?.lastActivityDate || null
  };
}

export async function resetDailyCounters(): Promise<void> {
  // Reset daily counters para todos os teams
  await prisma.team.updateMany({
    data: {
      dailyUsageCount: 0
    }
  });
}

export async function resetMonthlyCounters(): Promise<void> {
  const currentMonthYear = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  
  // Reset monthly counters para todos os teams
  await prisma.team.updateMany({
    data: {
      monthlyUsageCount: 0,
      currentMonthYear: currentMonthYear
    }
  });
}