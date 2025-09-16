// app/api/refatorar-image/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Modality } from '@google/genai';
import { prisma } from '@/lib/prisma';
import { ActionType, Brand, StrategicTheme } from '@prisma/client';

const MAX_PROMPT_LENGTH = 3950;

function cleanInput(text: string | undefined | null): string {
  if (!text) return '';
  let cleanedText = text.replace(/[<>{}\[\]"`]/g, '');
  cleanedText = cleanedText.replace(/\s+/g, ' ').trim();
  return cleanedText;
}

/**
 * Constrói um prompt de revisão detalhado, incorporando dados completos da marca e do tema.
 * @param adjustment - A solicitação de ajuste do usuário.
 * @param brand - O objeto completo da marca, vindo do banco de dados.
 * @param theme - O objeto completo do tema estratégico, vindo do banco de dados.
 * @returns Um prompt otimizado e rico em contexto para a IA.
 */
function buildRevisionPrompt(adjustment: string, brand?: Brand | null, theme?: StrategicTheme | null): string {
  let promptParts: string[] = [
    "Atue como um diretor de arte e especialista em design para mídias sociais. Sua tarefa é refinar a imagem fornecida, mantendo a composição original, mas aplicando os ajustes solicitados e garantindo total alinhamento com a identidade da marca e as diretrizes do tema estratégico.",
    `Ajuste solicitado pelo usuário: "${cleanInput(adjustment)}". Aplique esta alteração de forma sutil e integrada à imagem.`
  ];

  if (brand?.logo) {
    promptParts.push(
      "\n--- INSTRUÇÃO DE LOGO (PRIORIDADE MÁXIMA) ---",
      "A segunda imagem fornecida é o logo oficial da marca. Você DEVE inserir este logo na imagem final. Posicione o logo de forma natural e esteticamente agradável, geralmente em um dos cantos ou em um local que não cubra elementos importantes. O logo não deve ser modificado, distorcido, recortado ou ter suas cores alteradas de forma alguma. Mantenha sua integridade."
    );
  }

  if (brand) {
    promptParts.push("\n--- DIRETRIZES DE IDENTIDADE DA MARCA (OBRIGATÓRIO SEGUIR) ---");
    const brandDetails = {
      "Nome da Marca": { value: brand.name, required: true },
      "Valores": { value: brand.values, required: true },
      "Segmento": { value: brand.segment, required: true },
      "Promessa Única": { value: brand.promise, required: true },
      "Restrições (o que NÃO fazer)": { value: brand.restrictions, required: true },
      "Palavras-chave": { value: brand.keywords, required: false },
      "Metas de negócio": { value: brand.goals, required: true },
      "Indicadores de sucesso": { value: brand.successMetrics, required: true },
      "Inspirações": { value: brand.inspirations, required: false },
    };

    for (const [key, { value, required }] of Object.entries(brandDetails)) {
      if (value) {
        promptParts.push(`${key}${required ? " (Obrigatório)" : ""}: ${cleanInput(value as string)}`);
      }
    }
    // Adiciona informações sobre assets visuais
    if (brand.logo) promptParts.push("A marca possui um logo definido. Mantenha a estética alinhada a ele.");
    if (brand.colorPalette) promptParts.push(`Paleta de Cores da Marca: ${JSON.stringify(brand.colorPalette)}. Use estas cores de forma harmoniosa.`);
    if (brand.moodboard) promptParts.push("A marca possui um moodboard. Siga a direção visual e o sentimento que ele transmite.");
  }

  // Seção de Tema Estratégico
  if (theme) {
    promptParts.push("\n--- DIRETRIZES DO TEMA ESTRATÉGICO (OBRIGATÓRIO SEGUIR) ---");
    const themeDetails = {
      "Título do Tema": { value: theme.title, required: true },
      "Descrição": { value: theme.description, required: false },
      "Tom de Voz": { value: theme.toneOfVoice, required: true },
      "Objetivos do Tema": { value: theme.objectives, required: true },
      "Formatos de Conteúdo": { value: theme.contentFormat, required: true },
      "Ação Esperada do Público": { value: theme.expectedAction, required: true },
      "Público-alvo": { value: theme.targetAudience, required: false },
      "Hashtags": { value: theme.hashtags, required: false },
    };

    for (const [key, { value, required }] of Object.entries(themeDetails)) {
      if (value) {
        promptParts.push(`${key}${required ? " (Obrigatório)" : ""}: ${cleanInput(value as string)}`);
      }
    }
    if (theme.colorPalette) promptParts.push(`Paleta de Cores do Tema: ${theme.colorPalette}. Priorize estas cores, se aplicável.`);
  }

  promptParts.push("\n--- INSTRUÇÃO FINAL ---");
  promptParts.push("Refine a imagem com alta qualidade, realismo e impacto visual, mantendo os elementos principais da imagem original, mas garantindo que as diretrizes de marca e tema acima sejam perfeitamente refletidas no resultado final.");

  const finalPrompt = promptParts.join('\n');
  return finalPrompt.length > MAX_PROMPT_LENGTH ? finalPrompt.substring(0, MAX_PROMPT_LENGTH) : finalPrompt;
}


const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API,
});

async function generateImage(prompt: string, base64Image: string, mimeType: string) {
  const contents: any[] = [
    { inlineData: { data: base64Image, mimeType } },
    { text: prompt },
  ];

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image-preview', // Confirme se este é o modelo mais adequado para edição
    contents,
    config: {
      responseModalities: [Modality.TEXT, Modality.IMAGE],
      candidateCount: 1,
    },
  });

  if (response.candidates && response.candidates.length > 0) {
    const candidate = response.candidates[0];
    if (candidate.content && Array.isArray(candidate.content.parts)) {
      const part = candidate.content.parts.find((p: any) => p.inlineData);
      if (part && part.inlineData) {
        return {
          base64Data: part.inlineData.data,
          mimeType: part.inlineData.mimeType || 'image/png',
        };
      }
    }
  }
  throw new Error('Falha ao gerar a imagem revisada pela IA.');
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const imageFile = formData.get('image') as File | null;
    const prompt = formData.get('prompt') as string | null;
    // Agora recebemos os IDs
    const brandId = formData.get('brandId') as string | null;
    const themeId = formData.get('themeId') as string | null;
    const teamId = formData.get('teamId') as string | null;
    const userId = formData.get('userId') as string | null;

    if (!imageFile || !prompt || !teamId || !brandId || !userId) {
      return NextResponse.json({ error: 'Imagem, prompt, teamId, brandId e userId são obrigatórios.' }, { status: 400 });
    }

    // 1. Buscar dados completos da marca e do tema no banco de dados
    const brandData = await prisma.brand.findUnique({
      where: { id: brandId }
    });

    const themeData = themeId ? await prisma.strategicTheme.findUnique({
      where: { id: themeId }
    }) : null;

    if (!brandData) {
      return NextResponse.json({ error: 'Marca não encontrada.' }, { status: 404 });
    }

    // 2. Construir o prompt com os dados completos
    const revisionPrompt = buildRevisionPrompt(prompt, brandData, themeData);

    const buffer = Buffer.from(await imageFile.arrayBuffer());
    const base64Image = buffer.toString('base64');
    const mimeType = imageFile.type || 'image/png';

    const action = await prisma.action.create({
      data: {
        type: ActionType.REVISAR_CONTEUDO,
        userId,
        teamId,
        brandId,
        result: {},
        status: 'PROCESSING',
      },  
    });

    const result = await generateImage(revisionPrompt, base64Image, mimeType);

    await prisma.action.update({
      where: { id: action.id },
      data: {
        result: {
          imageUrl: `/api/image/${action.id}`,
          base64Data: result.base64Data,
          mimeType: result.mimeType,
          promptUsed: revisionPrompt,
          model: 'gemini-2.5-flash-image-preview',
        },
        status: 'COMPLETED',
      },
    });

    // Retornamos a imagem como data URL para exibição imediata no front-end
    const imageUrl = `data:${result.mimeType};base64,${result.base64Data}`;

    return NextResponse.json({
      imageUrl,
      debug: {
        promptUsed: revisionPrompt,
        model: 'gemini-2.5-flash-image-preview',
        actionId: action.id,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}