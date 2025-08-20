import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { userId, currentPassword } = await req.json();
    
    if (!userId || !currentPassword) {
      return NextResponse.json({ error: 'userId and currentPassword are required' }, { status: 400 });
    }

    // Buscar o usuário
    const user = await prisma.user.findUnique({ 
      where: { id: userId },
      select: { id: true, password: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verificar se a senha atual está correta
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    
    return NextResponse.json({ isValid: isPasswordValid });
  } catch (error) {
    console.error('Password verification error:', error);
    return NextResponse.json({ error: 'Password verification failed' }, { status: 500 });
  }
}
