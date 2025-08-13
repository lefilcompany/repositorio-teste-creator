import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const data = await req.json();
  try {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
    }

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone,
        state: data.state,
        city: data.city,
        status: 'PENDING',
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Register error', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
