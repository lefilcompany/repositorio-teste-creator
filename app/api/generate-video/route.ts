import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActionType } from '@prisma/client';
import OpenAI from 'openai';

// OpenAI client for caption generation (same model/approach as image API)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function cleanInput(text: any): string {
  if (!text) return '';
  if (Array.isArray(text)) return text.map(cleanInput).join(', ');
  const s = String(text);
  return s.replace(/[<>{}[]"'`]/g, '').replace(/\s+/g, ' ').trim();
}

async function generateTextContent(formData: any) {
  const cleanedTones = Array.isArray(formData.tone)
    ? formData.tone.map(cleanInput).join(', ')
    : cleanInput(formData.tone);

  const textPrompt = `
# CONTEXTO ESTRATÉGICO
- **Marca/Empresa**: ${cleanInput(formData.brand)}
- **Tema Central**: ${cleanInput(formData.theme)}
- **Plataforma de Publicação**: ${cleanInput(formData.platform)}
- **Objetivo Estratégico**: ${cleanInput(formData.objective)}
- **Descrição Visual do Vídeo**: ${cleanInput(formData.prompt)}
- **Público-Alvo**: ${cleanInput(formData.audience)}
- **Persona Específica**: ${cleanInput(formData.persona) || 'Não especificada'}
- **Tom de Voz/Comunicação**: ${cleanedTones || 'Não especificado'}
- **Informações Complementares**: ${cleanInput(formData.additionalInfo) || 'Não informado'}

# SUA MISSÃO COMO COPYWRITER ESPECIALISTA
Você criará uma LEGENDA COMPLETA (para um vídeo social) seguindo as mesmas regras do gerador de imagens:
Responda apenas JSON válido com {"title","body","hashtags"}.

## ESPECIFICAÇÕES:
- "title": 45-60 caracteres, estilo headline
- "body": 800-1500 caracteres, com CTAs e perguntas; use \\n\\n
- "hashtags": 8-12 itens (sem # no início), misto de nicho e populares
`;

  try {
    const chat = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: textPrompt }],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 1000,
    });
    const raw = chat.choices[0].message.content;
    if (!raw) throw new Error('Resposta vazia do modelo de texto');
    const parsed = JSON.parse(raw);

    if (typeof parsed.hashtags === 'string') {
      parsed.hashtags = parsed.hashtags.replace(/#/g, '').split(/[\s,]+/).filter(Boolean);
    }
    if (!Array.isArray(parsed.hashtags) || parsed.hashtags.length === 0) {
      throw new Error('Hashtags ausentes ou inválidas');
    }
    parsed.hashtags = parsed.hashtags
      .map((t: any) => String(t).replace(/[^a-zA-Z0-9áéíóúàèìòùâêîôûãõçÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÃÕÇ]/g, '').toLowerCase())
      .filter((t: string) => t.length > 0);
    return parsed;
  } catch (error) {
    const brandName = cleanInput(formData.brand) || 'nossa marca';
    const themeName = cleanInput(formData.theme) || 'novidades';
    return {
      title: `${brandName}: ${themeName} em movimento 🚀`,
      body:
        `Assista a esta criação e sinta a essência da ${brandName}.\n\n` +
        `Este vídeo traduz ${themeName} em ação, com narrativa envolvente e ritmo pensado para ` +
        `prender a atenção do início ao fim.\n\nO que mais chamou sua atenção? Comente abaixo!\n\n` +
        `Pronto para dar o próximo passo? Clique e descubra como transformar sua presença nas redes.`,
      hashtags: [
        brandName.toLowerCase().replace(/\s+/g, '').slice(0, 15),
        themeName.toLowerCase().replace(/\s+/g, '').slice(0, 15),
        'video',
        'reels',
        'tiktok',
        'marketingdigital',
        'conteudocriativo',
        'engajamento',
        'branding',
      ],
    };
  }
}

function extractVideoUrl(data: any): string | null {
  // Try common locations/structures
  const candidates: any[] = [];
  if (data?.result?.output) candidates.push(data.result.output);
  if (data?.output) candidates.push(data.output);
  if (data?.result) candidates.push(data.result);
  if (data?.assets) candidates.push(data.assets);
  candidates.push(data);

  const flat: any[] = [];
  const stack: any[] = [...candidates];
  while (stack.length) {
    const item = stack.pop();
    if (!item) continue;
    if (typeof item === 'string') flat.push(item);
    else if (Array.isArray(item)) stack.push(...item);
    else if (typeof item === 'object') stack.push(...Object.values(item));
  }
  const url = flat.find((s) => typeof s === 'string' && /https?:\/\/\S+\.(mp4|webm)(\?\S*)?$/i.test(s));
  return url || null;
}

export async function POST(req: NextRequest) {
  try {
    const {
      prompt,
      transformationType,
      referenceFile,
      teamId,
      userId,
      brandId,
      brand,
      theme,
      platform,
      objective,
      audience,
      persona,
      tone,
      additionalInfo,
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

    // Extract a usable video URL
    const videoUrl = extractVideoUrl(data) || data?.videoUri || data?.result?.videoUri || '';

    // Generate caption content similarly to image API
    let postContent = { title: '', body: '', hashtags: [] as string[] } as any;
    if (process.env.OPENAI_API_KEY) {
      postContent = await generateTextContent({
        prompt,
        brand,
        theme,
        platform,
        objective,
        audience,
        persona,
        tone,
        additionalInfo,
      });
    }

    let actionId: string | undefined;
    if (teamId && userId && brandId) {
      try {
        const action = await prisma.action.create({
          data: {
            type: ActionType.CRIAR_CONTEUDO,
            teamId,
            userId,
            brandId,
            details: { prompt, transformationType, brand, theme, platform, objective, audience, persona, tone, additionalInfo },
            result: {
              videoUrl,
              title: postContent.title,
              body: postContent.body,
              hashtags: postContent.hashtags,
              providerRaw: data,
            },
            status: 'Em revisão',
            approved: false,
            revisions: 0,
          },
        });
        actionId = action.id;
      } catch (e) {
        // ignore
      }
    }

    return NextResponse.json({
      videoUrl,
      title: postContent.title,
      body: postContent.body,
      hashtags: postContent.hashtags,
      actionId,
      providerRaw: data,
    });
  } catch (error: any) {
    console.error('[API generate-video ERROR]', error);
    return NextResponse.json({ error: error?.message || JSON.stringify(error) || 'Erro interno' }, { status: 500 });
  }
}
