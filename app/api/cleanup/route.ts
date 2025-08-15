import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    // Remove conteúdo temporário expirado
    const result = await prisma.temporaryContent.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    });

    return NextResponse.json({ 
      message: 'Cleanup completed', 
      deletedCount: result.count 
    });
  } catch (error) {
    console.error('Cleanup error', error);
    return NextResponse.json({ 
      error: 'Failed to cleanup expired content' 
    }, { status: 500 });
  }
}
