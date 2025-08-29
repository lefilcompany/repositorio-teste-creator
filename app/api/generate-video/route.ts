// app/api/generate-video/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActionType } from '@prisma/client';
import OpenAI from 'openai';

// ============================================================================
// CONFIGURAÇÃO DO CLIENTE OPENAI
// ============================================================================

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

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

    // Processamento de hashtags
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
    console.error('[OpenAI Error] Erro ao gerar conteúdo de texto:', error);

    // Fallback para conteúdo padrão
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
// FUNÇÕES PARA INTEGRAÇÃO COM RUNWAY API
// ============================================================================

const RUNWAY_API_BASE_URL = 'https://api.dev.runwayml.com';

// Helper robusto para extrair a URL do vídeo
function extractVideoUrl(task: any): string | null {
  const out = task?.output ?? task?.result ?? task;

  if (typeof out === 'string') return out;
  if (Array.isArray(out) && out.length && typeof out[0] === 'string') return out[0];
  if (Array.isArray(out) && out.length && typeof out[0] === 'object') {
    const cand = out.find((o: any) => o?.asset_url || o?.url);
    return cand?.asset_url || cand?.url || null;
  }
  if (out && typeof out === 'object') {
    if (out.asset_url) return out.asset_url;
    if (out.url) return out.url;
    const v = out.assets?.video;
    if (typeof v === 'string') return v;
    if (Array.isArray(v) && v.length && typeof v[0] === 'string') return v[0];
  }
  return null;
}

async function pollForVideoResult(taskId: string, runwayKey: string): Promise<any> {
  const pollEndpoint = `${RUNWAY_API_BASE_URL}/v1/tasks/${taskId}`;

  // Tempo máximo de espera: 5 minutos (60 tentativas * 5 segundos)
  const maxAttempts = 60;
  let attempt = 0;

  while (attempt < maxAttempts) {
    try {
      console.log(`[Runway Polling] Tentativa ${attempt + 1}/${maxAttempts} para tarefa: ${taskId}`);

      const res = await fetch(pollEndpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${runwayKey}`,
          'Content-Type': 'application/json',
          'X-Runway-Version': '2024-11-06',
        },
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`[Runway Polling] Erro HTTP ${res.status}:`, errorText);
        throw new Error(`Erro ao consultar status: ${res.status} - ${errorText}`);
      }

      const taskData = await res.json();
      const status = (taskData.status || '').toLowerCase();
      console.log(`[Runway Polling] Status atual: ${taskData.status}`);

      if (status === 'succeeded') {
        console.log(`[Runway Polling] Tarefa ${taskId} concluída com sucesso!`);
        return taskData.output;
      }

      if (status === 'failed') {
        console.error(`[Runway Polling] Tarefa ${taskId} falhou:`, taskData.error);
        throw new Error(`A geração do vídeo falhou. Motivo: ${taskData.error || 'Erro desconhecido'}`);
      }

      // Aguarda 5 segundos antes da próxima tentativa
      await new Promise(resolve => setTimeout(resolve, 5000));
      attempt++;

    } catch (error) {
      console.error('[Runway Polling] Erro durante polling:', error);
      throw error;
    }
  }

  throw new Error('Tempo de espera para geração do vídeo excedido (timeout após 5 minutos).');
}

async function startImageToVideo(
  promptImage: string,
  promptText: string,
  ratio: string,
  duration: number,
  runwayKey: string
): Promise<string> {
  const endpoint = `${RUNWAY_API_BASE_URL}/v1/image_to_video`;

  const body = {
    model: 'gen3a_turbo',
    promptImage,
    promptText,
    ratio,
    duration,
    seed: Math.floor(Math.random() * 4294967295),
  };

  console.log('[Runway] Iniciando Image-to-Video com parâmetros:', {
    model: body.model,
    ratio: body.ratio,
    duration: body.duration,
    promptText: body.promptText.substring(0, 100) + '...'
  });

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${runwayKey}`,
      'Content-Type': 'application/json',
      'X-Runway-Version': '2024-11-06',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('[Runway] Erro ao iniciar Image-to-Video:', errorText);
    throw new Error(`Falha ao iniciar geração de vídeo: ${errorText}`);
  }

  const data = await res.json();
  const taskId = data.id || data.uuid;

  if (!taskId) {
    console.error('[Runway] Resposta sem ID de tarefa:', data);
    throw new Error('Não foi possível obter o ID da tarefa da Runway');
  }

  console.log(`[Runway] Tarefa Image-to-Video iniciada com ID: ${taskId}`);
  return taskId;
}

async function startVideoToVideo(
  videoUri: string,
  promptText: string,
  ratio: string,
  runwayKey: string
): Promise<string> {
  const endpoint = `${RUNWAY_API_BASE_URL}/v1/video_to_video`;

  const body = {
    model: 'gen4_aleph',
    videoUri,
    promptText,
    ratio,
    seed: Math.floor(Math.random() * 4294967295),
  };

  console.log('[Runway] Iniciando Video-to-Video com parâmetros:', {
    model: body.model,
    ratio: body.ratio,
    promptText: body.promptText.substring(0, 100) + '...'
  });

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${runwayKey}`,
      'Content-Type': 'application/json',
      'X-Runway-Version': '2024-11-06',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('[Runway] Erro ao iniciar Video-to-Video:', errorText);
    throw new Error(`Falha ao iniciar transformação de vídeo: ${errorText}`);
  }

  const data = await res.json();
  const taskId = data.id || data.uuid;

  if (!taskId) {
    console.error('[Runway] Resposta sem ID de tarefa:', data);
    throw new Error('Não foi possível obter o ID da tarefa da Runway');
  }

  console.log(`[Runway] Tarefa Video-to-Video iniciada com ID: ${taskId}`);
  return taskId;
}

// ============================================================================
// HANDLER PRINCIPAL DA API
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    console.log('[API generate-video] Iniciando processamento de requisição');

    const body = await req.json();

    let {
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
      ratio = '1280:720',
      duration = 5,
    } = body;

    // Corrige o ratio para os valores aceitos pela Runway
    const allowedRatios = ['768:1280', '1280:768'];
    if (!allowedRatios.includes(ratio)) {
      // Ajusta para o mais próximo (1280:768)
      ratio = '1280:768';
    }

    // Validação de parâmetros obrigatórios
    if (!prompt || !transformationType || !referenceFile) {
      return NextResponse.json(
        { error: 'Parâmetros obrigatórios faltando: prompt, transformationType e referenceFile são necessários' },
        { status: 400 }
      );
    }

    if (!['image_to_video', 'video_to_video'].includes(transformationType)) {
      return NextResponse.json(
        { error: 'Tipo de transformação inválido. Use "image_to_video" ou "video_to_video"' },
        { status: 400 }
      );
    }

    // Verificação da API Key da Runway
    const runwayKey = process.env.RUNWAY_API_KEY;
    if (!runwayKey) {
      console.error('[API generate-video] RUNWAY_API_KEY não configurada');
      return NextResponse.json(
        { error: 'Serviço de geração de vídeo não configurado. Entre em contato com o suporte.' },
        { status: 500 }
      );
    }

    console.log(`[API generate-video] Tipo de transformação: ${transformationType}`);
    console.log(`[API generate-video] Proporção: ${ratio}, Duração: ${duration}s`);

    let taskId: string;

    try {
      // Inicia a geração de vídeo baseado no tipo
      if (transformationType === 'image_to_video') {
        taskId = await startImageToVideo(
          referenceFile,
          prompt,
          ratio,
          Number(duration),
          runwayKey
        );
      } else {
        taskId = await startVideoToVideo(
          referenceFile,
          prompt,
          ratio,
          runwayKey
        );
      }
    } catch (error) {
      console.error('[API generate-video] Erro ao iniciar geração:', error);
      return NextResponse.json(
        {
          error: 'Falha ao iniciar geração de vídeo',
          details: error instanceof Error ? error.message : 'Erro desconhecido'
        },
        { status: 500 }
      );
    }

    // Aguarda a conclusão da geração
    let videoOutput;
    try {
      videoOutput = await pollForVideoResult(taskId, runwayKey);
    } catch (error) {
      console.error('[API generate-video] Erro durante polling:', error);

      // Se houve erro no polling mas temos um taskId, salvamos a action mesmo assim
      // para não perder o trabalho do usuário
      if (teamId && userId && brandId) {
        await prisma.action.create({
          data: {
            type: ActionType.CRIAR_CONTEUDO,
            teamId,
            userId,
            brandId,
            details: {
              prompt,
              transformationType,
              brand,
              theme,
              platform,
              objective,
              audience,
              persona,
              tone,
              additionalInfo,
              ratio,
              duration,
              error: error instanceof Error ? error.message : 'Erro durante processamento do vídeo'
            },
            result: {
              taskId,
              status: 'failed',
              error: error instanceof Error ? error.message : 'Erro desconhecido'
            },
            status: 'Rejeitada',
            approved: false,
            revisions: 0,
          },
        });
      }

      return NextResponse.json(
        {
          error: 'Erro durante processamento do vídeo',
          details: error instanceof Error ? error.message : 'Erro desconhecido',
          shouldRedirectToHistory: true
        },
        { status: 500 }
      );
    }

    // Extrai a URL do vídeo do objeto de saída da Runway
    const videoUrl = extractVideoUrl(videoOutput);
    if (!videoUrl) {
      console.error('[API generate-video] output recebido do Runway:', videoOutput);
      return NextResponse.json(
        { error: 'URL do vídeo não encontrada', raw: videoOutput },
        { status: 502 }
      );
    }

    console.log('[API generate-video] Vídeo gerado com sucesso. Gerando conteúdo de texto...');

    // Gera o conteúdo de texto (legenda, hashtags, etc)
    const postContent = await generateTextContent({
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

    // Salva a action no banco de dados
    let actionId: string | undefined;
    if (teamId && userId && brandId) {
      try {
        const action = await prisma.action.create({
          data: {
            type: ActionType.CRIAR_CONTEUDO,
            teamId,
            userId,
            brandId,
            details: {
              prompt,
              transformationType,
              brand,
              theme,
              platform,
              objective,
              audience,
              persona,
              tone,
              additionalInfo,
              ratio,
              duration: transformationType === 'image_to_video' ? duration : undefined,
            },
            result: {
              videoUrl,
              imageUrl: transformationType === 'image_to_video' ? referenceFile : undefined,
              title: postContent.title,
              body: postContent.body,
              hashtags: postContent.hashtags,
              providerData: {
                taskId,
                output: videoOutput,
              },
            },
            status: 'Em revisão',
            approved: false,
            revisions: 0,
          },
        });
        actionId = action.id;
        console.log(`[API generate-video] Action criada com ID: ${actionId}`);
      } catch (error) {
        console.error('[API generate-video] Erro ao salvar action:', error);
        // Não retorna erro aqui pois o vídeo foi gerado com sucesso
      }
    }

    console.log('[API generate-video] Processamento concluído com sucesso');

    return NextResponse.json({
      url: videoUrl,
      title: postContent.title,
      body: postContent.body,
      hashtags: postContent.hashtags,
      actionId,
    });

  } catch (error: any) {
    console.error('[API generate-video] Erro não tratado:', error);
    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
        details: error?.message || 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}