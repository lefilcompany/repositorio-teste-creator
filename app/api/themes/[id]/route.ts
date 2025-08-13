import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const data = await req.json();
  try {
    const theme = await prisma.strategicTheme.update({ where: { id: params.id }, data });
    return NextResponse.json(theme);
  } catch (error) {
    console.error('Update theme error', error);
    return NextResponse.json({ error: 'Failed to update theme' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.strategicTheme.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Delete theme error', error);
    return NextResponse.json({ error: 'Failed to delete theme' }, { status: 500 });
  }
}
