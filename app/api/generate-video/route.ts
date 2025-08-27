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

    let model = '';
    let ratio = '1280:720';
    let endpoint = '';
    let body: any = {};
    if (transformationType === 'image_to_video') {
      model = 'gen4_turbo';
      endpoint = 'https://api.dev.runwayml.com/v1/image_to_video';
      body = {
        model,
        promptImage: referenceFile,
        promptText: prompt,
        ratio,
        ...rest
      };
    } else if (transformationType === 'video_to_video') {
      model = 'gen4_aleph';
      endpoint = 'https://api.dev.runwayml.com/v1/video_to_video';
      body = {
        model,
        videoUri: referenceFile,
        promptText: prompt,
        ratio,
        ...rest
      };
    } else {
      model = 'gen4_aleph';
      endpoint = 'https://api.dev.runwayml.com/v1/text_to_video';
      body = {
        model,
        promptText: prompt,
        ratio,
        ...rest
      };
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${runwayKey}`,
        'X-Runway-Version': '2024-11-06',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[RunwayML Error]', err);
      return NextResponse.json({ error: 'Falha ao gerar vídeo', details: typeof err === 'string' ? err : JSON.stringify(err) }, { status: 500 });
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
    console.error('[API generate-video ERROR]', error);
    return NextResponse.json({ error: error?.message || JSON.stringify(error) || 'Erro interno' }, { status: 500 });
  }
}
