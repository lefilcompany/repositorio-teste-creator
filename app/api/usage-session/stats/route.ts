import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/jwt';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = await verifyJWT(token);
    
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // Verificar se é admin (opcional - pode ser removido se quisermos permitir para todos)
    const user = await prisma.user.findUnique({
      where: { id: payload.userId }
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Construir filtros
    const whereConditions: any = {
      active: false, // Apenas sessões finalizadas
      duration: { not: null }
    };

    if (userId) {
      whereConditions.userId = userId;
    }

    if (startDate) {
      whereConditions.date = {
        gte: new Date(startDate)
      };
    }

    if (endDate) {
      whereConditions.date = {
        ...whereConditions.date,
        lte: new Date(endDate)
      };
    }

    // Buscar sessões
    const sessions = await prisma.usageSession.findMany({
      where: whereConditions,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        loginTime: 'desc'
      }
    });

    // Calcular estatísticas
    const totalSessions = sessions.length;
    const totalTimeInSeconds = sessions.reduce((sum, session) => sum + (session.duration || 0), 0);
    const averageSessionTime = totalSessions > 0 ? Math.round(totalTimeInSeconds / totalSessions) : 0;

    // Agrupar por usuário
    const userStats = sessions.reduce((acc: any, session) => {
      const userId = session.userId;
      if (!acc[userId]) {
        acc[userId] = {
          user: session.user,
          totalSessions: 0,
          totalTime: 0,
          averageTime: 0
        };
      }
      acc[userId].totalSessions++;
      acc[userId].totalTime += session.duration || 0;
      acc[userId].averageTime = Math.round(acc[userId].totalTime / acc[userId].totalSessions);
      return acc;
    }, {});

    // Agrupar por dia
    const dailyStats = sessions.reduce((acc: any, session) => {
      const date = session.date.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = {
          date,
          sessions: 0,
          totalTime: 0,
          uniqueUsers: new Set()
        };
      }
      acc[date].sessions++;
      acc[date].totalTime += session.duration || 0;
      acc[date].uniqueUsers.add(session.userId);
      return acc;
    }, {});

    // Converter sets para números
    const dailyStatsArray = Object.values(dailyStats).map((day: any) => ({
      ...day,
      uniqueUsers: day.uniqueUsers.size
    }));

    return NextResponse.json({
      totalSessions,
      totalTimeInSeconds,
      totalTimeFormatted: formatTime(totalTimeInSeconds),
      averageSessionTime,
      averageSessionTimeFormatted: formatTime(averageSessionTime),
      userStats: Object.values(userStats),
      dailyStats: dailyStatsArray,
      sessions: sessions.map(session => ({
        ...session,
        durationFormatted: formatTime(session.duration || 0)
      }))
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas de uso:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${remainingSeconds}s`;
  }
}
