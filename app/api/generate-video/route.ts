import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActionType } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    const {
      prompt,
      transformationType,
      referenceFile,
      teamId,
      userId,
      brandId,
      ...rest
    } = await req.json();

    const runwayKey = process.env.RUNWAY_API_KEY;
    if (!runwayKey) {
      return NextResponse.json({ error: 'Runway API key not configured' }, { status: 500 });
    }

    let endpoint = '';
    const body: any = { prompt, ...rest };
    switch (transformationType) {
      case 'image_to_video':
        endpoint = 'https://api.runwayml.com/v1/image_to_video';
        body.image = referenceFile;
        break;
      case 'video_to_video':
        endpoint = 'https://api.runwayml.com/v1/video_to_video';
        body.video = referenceFile;
        break;
      default:
        endpoint = 'https://api.runwayml.com/v1/text_to_video';
        break;
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${runwayKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: 'Falha ao gerar vídeo', details: err }, { status: 500 });
    }

    const data = await res.json();

    // salva ação
    if (teamId && userId && brandId) {
      try {
        await prisma.action.create({
          data: {
            type: ActionType.CRIAR_CONTEUDO,
            teamId,
            userId,
            brandId,
            details: { prompt, transformationType },
            result: data
          }
        });
      } catch (e) {
        // ignore
      }
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
