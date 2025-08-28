import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActionType } from '@prisma/client';
import OpenAI from 'openai';

// ============================================================================
// CLIENT OPENAI E FUNÇÕES AUXILIARES
// ============================================================================
// (Nenhuma mudança aqui)

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
- Marca/Empresa: ${cleanInput(formData.brand)}
- Tema Central: ${cleanInput(formData.theme)}
- Plataforma de Publicação: ${cleanInput(formData.platform)}
- Objetivo de Comunicação: ${cleanInput(formData.objective)}
- Descrição Visual do Vídeo: ${cleanInput(formData.prompt)}
- Público-Alvo: ${cleanInput(formData.audience)}
- Persona: ${cleanInput(formData.persona) || 'Não especificada'}
- Tom de Voz: ${cleanedTones || 'Não especificado'}
- Informações Adicionais: ${cleanInput(formData.additionalInfo) || 'Não informado'}

# BRIEFING DE COPY PROFISSIONAL
Você é um copywriter sênior. Escreva uma legenda envolvente para um vídeo social em português do Brasil.
Responda somente com JSON válido contendo {"title","body","hashtags"}.

## Diretrizes
- "title": 45-60 caracteres, headline persuasiva
- "body": 800-1500 caracteres, parágrafos curtos com CTAs claros e perguntas; use \\n\\n para quebras de parágrafo
- "hashtags": 8-12 termos sem #, misture nicho e tendências
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
    if (!Array.isArray(parsed.hashtags)) {
      parsed.hashtags = [];
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
        'video', 'reels', 'tiktok', 'marketingdigital', 'conteudocriativo', 'engajamento', 'branding',
      ],
    };
  }
}

// ============================================================================
// FUNÇÃO DE POLLING PARA A API RUNWAY
// ============================================================================

const RUNWAY_API_BASE_URL = 'https://api.dev.runwayml.com';

async function pollForVideoResult(taskId: string, runwayKey: string) {
  const pollEndpoint = `${RUNWAY_API_BASE_URL}/v1/tasks/${taskId}`;
  
  // CORREÇÃO: Aumentando o tempo de espera para 5 minutos (60 tentativas * 5 segundos).
  const maxAttempts = 60;
  let attempt = 0;

  while (attempt < maxAttempts) {
    try {
      console.log(`[Polling Runway] Tentativa ${attempt + 1}/${maxAttempts} para a tarefa: ${taskId}`);
      
      const res = await fetch(pollEndpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${runwayKey}`,
          'Content-Type': 'application/json',
          'X-Runway-Version': '2024-11-06',
        },
      });

      if (!res.ok) {
        throw new Error(`Erro ao consultar status: ${res.statusText}`);
      }

      const taskData = await res.json();
      
      if (taskData.status === 'succeeded') {
        console.log(`[Polling Runway] Sucesso! Tarefa ${taskId} concluída.`);
        return taskData.output;
      }
      
      if (taskData.status === 'failed') {
        throw new Error(`A geração do vídeo falhou. Motivo: ${taskData.error || 'desconhecido'}`);
      }

      await new Promise(resolve => setTimeout(resolve, 5000));
      attempt++;

    } catch (error) {
      console.error('[Polling Runway] Erro na tentativa de polling:', error);
      throw error;
    }
  }

  throw new Error('Tempo de espera para geração do vídeo excedido (timeout).');
}


// ============================================================================
// FUNÇÃO PRINCIPAL DA API (POST)
// ============================================================================

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
    
    let startGenerationEndpoint = '';
    let body: any = {};
    const { ratio = '1280:720', duration, seed = Math.floor(Math.random() * 4294967296) } = rest;

    if (transformationType === 'image_to_video') {
      startGenerationEndpoint = `${RUNWAY_API_BASE_URL}/v1/image_to_video`;
      body = {
        model: 'gen4_turbo',
        promptImage: referenceFile,
        promptText: prompt,
        ratio,
        ...(duration ? { duration: Number(duration) } : {}),
        seed,
      };
    } else if (transformationType === 'video_to_video') {
      startGenerationEndpoint = `${RUNWAY_API_BASE_URL}/v1/video_to_video`;
      body = {
        model: 'gen4_aleph',
        videoUri: referenceFile,
        promptText: prompt,
        ratio,
        seed,
      };
    } else {
        return NextResponse.json({ error: 'Tipo de transformação de vídeo inválido' }, { status: 400 });
    }

    const initialRes = await fetch(startGenerationEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${runwayKey}`,
        'Content-Type': 'application/json',
        'X-Runway-Version': '2024-11-06',
      },
      body: JSON.stringify(body),
    });

    if (!initialRes.ok) {
      const err = await initialRes.text();
      console.error('[RunwayML Error] Falha ao iniciar a geração:', err);
      return NextResponse.json({ error: 'Falha ao iniciar a geração do vídeo', details: err }, { status: 500 });
    }

    const initialData = await initialRes.json();
    
    const taskId = initialData.id || initialData.uuid;

    if (!taskId) {
      console.error('[RunwayML Error] Não foi possível obter o ID da tarefa:', JSON.stringify(initialData, null, 2));
      throw new Error('Não foi possível obter o ID da tarefa da Runway.');
    }
    
    const finalOutput = await pollForVideoResult(taskId, runwayKey);

    const videoUrl = finalOutput?.videoUrl || '';

    if (!videoUrl) {
      console.error('[RunwayML Error] Vídeo concluído, mas a URL não foi encontrada na saída:', JSON.stringify(finalOutput, null, 2));
      throw new Error('A URL do vídeo não foi encontrada na resposta final da API.');
    }

    const postContent = await generateTextContent({
        prompt, brand, theme, platform, objective, audience, persona, tone, additionalInfo,
    });
    
    let actionId: string | undefined;
    if (teamId && userId && brandId) {
      const action = await prisma.action.create({
        data: {
          type: ActionType.CRIAR_CONTEUDO,
          teamId,
          userId,
          brandId,
          details: { prompt, transformationType, brand, theme, platform, objective, audience, persona, tone, additionalInfo },
          result: {
            videoUrl,
            imageUrl: transformationType === 'image_to_video' ? referenceFile : undefined,
            title: postContent.title,
            body: postContent.body,
            hashtags: postContent.hashtags,
            providerRaw: { task: taskId, output: finalOutput },
          },
          status: 'Em revisão',
          approved: false,
          revisions: 0,
        },
      });
      actionId = action.id;
    }

    return NextResponse.json({
      videoUrl,
      title: postContent.title,
      body: postContent.body,
      hashtags: postContent.hashtags,
      actionId,
    });

  } catch (error: any) {
    console.error('[API generate-video ERROR]', error);
    return NextResponse.json({ error: error?.message || 'Erro interno do servidor' }, { status: 500 });
  }
}