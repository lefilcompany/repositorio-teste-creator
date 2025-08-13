import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const teamId = params.id;
    
    const joinRequests = await prisma.joinRequest.findMany({
      where: { 
        teamId,
        status: 'PENDING'
      },
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
        createdAt: 'desc'
      }
    });

    return NextResponse.json(joinRequests);
  } catch (error) {
    console.error('Fetch join requests error', error);
    return NextResponse.json({ error: 'Failed to fetch join requests' }, { status: 500 });
  }
}
