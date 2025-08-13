import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const { email, password } = await req.json();
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.password !== password) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    if (user.status === 'PENDING') {
      return NextResponse.json({ status: 'pending' }, { status: 403 });
    }
    const { password: _pw, ...safeUser } = user;
    return NextResponse.json(safeUser);
  } catch (error) {
    console.error('Login error', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
