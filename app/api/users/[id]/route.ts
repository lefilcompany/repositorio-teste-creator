import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const data = await req.json();
  try {
    const user = await prisma.user.update({ where: { id: params.id }, data });
    const { password, ...safe } = user;
    return NextResponse.json(safe);
  } catch (error) {
    console.error('Update user error', error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}
