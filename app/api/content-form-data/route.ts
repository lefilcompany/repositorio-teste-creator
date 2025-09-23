// app/api/content-form-data/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Função de retry para operações de banco de dados
async function retryDatabaseOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      console.warn(`Tentativa ${attempt}/${maxRetries} falhou:`, error.message);
      
      // Se não é o último retry, aguarda antes de tentar novamente
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }
  
  throw lastError!;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const teamId = searchParams.get('teamId');
  const userId = searchParams.get('userId');

  if (!teamId || !userId) {
    return NextResponse.json(
      { error: 'teamId and userId are required' },
      { status: 400 }
    );
  }

  try {
    // 🚀 Executa todas as buscas no banco de dados em paralelo com retry!
    const [team, brands, themes, personas] = await retryDatabaseOperation(
      () => Promise.all([
        // Busca dados da equipe
        prisma.team.findUnique({
          where: { id: teamId },
          select: { id: true },
        }),
        // Busca apenas o essencial das marcas
        prisma.brand.findMany({
          where: { teamId },
          select: { id: true, name: true },
          orderBy: { name: 'asc' },
        }),
        // Busca apenas o essencial dos temas
        prisma.strategicTheme.findMany({
          where: { teamId },
          select: { id: true, title: true, brandId: true },
          orderBy: { title: 'asc' },
        }),
        // Busca apenas o essencial das personas
        prisma.persona.findMany({
          where: { teamId },
          select: { id: true, name: true, brandId: true },
          orderBy: { name: 'asc' },
        }),
      ])
    );

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    return NextResponse.json({
      team,
      brands,
      themes,
      personas,
    });
  } catch (error: any) {
    console.error('Failed to fetch form data after retries:', error);
    
    // Retorna erro mais específico baseado no tipo
    if (error.code === 'P1001') {
      return NextResponse.json(
        { 
          error: 'Erro de conexão com banco de dados. Tente novamente em alguns segundos.',
          code: 'DATABASE_CONNECTION_ERROR'
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor. Tente novamente.',
        code: 'INTERNAL_SERVER_ERROR'
      },
      { status: 500 }
    );
  }
}