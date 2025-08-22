// app/api/refatorar-image/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Modality } from '@google/genai';
import { prisma } from '@/lib/prisma';
import { ActionType } from '@prisma/client';

const MAX_PROMPT_LENGTH = 3950;

function cleanInput(text: string | undefined | null): string {
  if (!text) return '';
  let cleanedText = text.replace(/[<>{}\[\]"'`]/g, '');
  cleanedText = cleanedText.replace(/\s+/g, ' ').trim();
  return cleanedText;
}

function buildRevisionPrompt(formData: any): string {
  const adjustment = cleanInput(formData.prompt);
  const brand = cleanInput(formData.brand);
  const theme = cleanInput(formData.theme);

  let promptParts: string[] = [];

  if (adjustment) {
    promptParts.push(`Refaça a imagem fornecida aplicando os seguintes ajustes: ${adjustment}`);
  }

  if (brand || theme) {
    let strategic = 'Mantenha a identidade';
    if (brand) strategic += ` da marca ${brand}`;
    if (theme) strategic += ` com o tema ${theme}`;
    promptParts.push(strategic);
  }

  promptParts.push('Você é um gerador de posts para Instagram que aplica princípios avançados de design e marketing digital para criar artes de alto impacto visual.');

  const finalPrompt = promptParts.join('. ');
  return finalPrompt.length > MAX_PROMPT_LENGTH ? finalPrompt.substring(0, MAX_PROMPT_LENGTH) : finalPrompt;
}

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API,
});

async function generateImage(prompt: string, base64Image: string, mimeType: string, actionId?: string) {
  const fullPrompt = `${prompt}. A imagem final deve ser realista, de alta qualidade e manter os elementos principais da imagem original, destacando-se no feed.`;
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash-preview-image-generation',
    contents: [
      {
        role: 'user',
        parts: [
          { inlineData: { data: base64Image, mimeType } },
          { text: fullPrompt },
        ],
      },
    ],
    config: {
      responseModalities: [Modality.TEXT, Modality.IMAGE],
    },
  });

  if (response.candidates && response.candidates.length > 0) {
    const candidate = response.candidates[0];
    if (candidate.content && Array.isArray(candidate.content.parts)) {
      const part = candidate.content.parts.find((p) => (p as any).inlineData);
      if (part && (part as any).inlineData) {
        const imageData = (part as any).inlineData.data;
        const imageMimeType = (part as any).inlineData.mimeType || 'image/png';
        
        // Retorna os dados para armazenamento no banco de dados
        return { 
          imageUrl: `/api/image/${actionId}`,
          base64Data: imageData,
          mimeType: imageMimeType
        };
      }
    }
  }
  throw new Error('Falha ao gerar a imagem revisada');
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const imageFile = formData.get('image') as File | null;
    const prompt = formData.get('prompt') as string | null;
    const brand = formData.get('brand') as string | null;
    const theme = formData.get('theme') as string | null;
    const teamId = formData.get('teamId') as string | null;
    const brandId = formData.get('brandId') as string | null;
    const userId = formData.get('userId') as string | null;
    const actionId = formData.get('actionId') as string | null;

    if (!imageFile || !prompt || !teamId || !brandId || !userId) {
      return NextResponse.json({ error: 'Imagem, prompt, teamId, brandId e userId são obrigatórios.' }, { status: 400 });
    }

    const buffer = Buffer.from(await imageFile.arrayBuffer());
    const base64Image = buffer.toString('base64');
    const mimeType = imageFile.type || 'image/png';

    const revisionPrompt = buildRevisionPrompt({
      prompt,
      brand,
      theme,
    });

    // Criar nova action para a revisão
    const action = await prisma.action.create({
      data: {
        type: ActionType.REVISAR_CONTEUDO,
        userId,
        teamId,
        brandId,
        result: {}, // Será atualizado depois
        status: 'PROCESSING',
      },
    });

    const result = await generateImage(revisionPrompt, base64Image, mimeType, action.id);

    // Atualizar a action com os dados da imagem
    await prisma.action.update({
      where: { id: action.id },
      data: {
        result: {
          imageUrl: result.imageUrl,
          base64Data: result.base64Data,
          mimeType: result.mimeType,
          promptUsed: revisionPrompt,
          model: 'gemini-2.0-flash-preview-image-generation',
        },
        status: 'COMPLETED',
      },
    });

    console.log('Imagem de revisão gerada e salva no banco:', result.imageUrl, 'para actionId:', action.id);

    return NextResponse.json({
      imageUrl: result.imageUrl,
      debug: {
        promptUsed: revisionPrompt,
        model: 'gemini-2.0-flash-preview-image-generation',
        actionId: action.id,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro ao refatorar imagem:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

