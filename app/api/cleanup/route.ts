import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    // Como não usamos mais TemporaryContent, este endpoint agora serve apenas
    // para compatibilidade. Pode ser removido futuramente.
    
    return NextResponse.json({ 
      message: 'Cleanup completed - TemporaryContent table no longer used', 
      deletedCount: 0 
    });
  } catch (error) {
    console.error('Cleanup error', error);
    return NextResponse.json({ 
      error: 'Failed to cleanup expired content' 
    }, { status: 500 });
  }
}
