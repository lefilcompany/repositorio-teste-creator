import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const data = await req.json();
  try {
    const brand = await prisma.brand.update({ where: { id: params.id }, data });
    return NextResponse.json(brand);
  } catch (error) {
    console.error('Update brand error', error);
    return NextResponse.json({ error: 'Failed to update brand' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.brand.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Delete brand error', error);
    return NextResponse.json({ error: 'Failed to delete brand' }, { status: 500 });
  }
}
