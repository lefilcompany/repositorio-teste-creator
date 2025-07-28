// app/api/revisar-imagem/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(req: NextRequest) {
  if (!process.env.REPLICATE_API_TOKEN) {
    return NextResponse.json({ error: 'A chave da API da Replicate não está configurada.' }, { status: 500 });
  }

  try {
    const formData = await req.formData();
    const imageFile = formData.get('image') as File | null;
    const prompt = formData.get('prompt') as string | null;
    const brandTheme = formData.get('brandTheme') as string | null;

    if (!imageFile || !prompt) {
      return NextResponse.json({ error: 'Imagem e prompt de ajuste são obrigatórios.' }, { status: 400 });
    }
    
    // Converte a imagem para um buffer e depois para uma data URI, que é o formato que a Replicate espera para input de imagem
    const imageBuffer = await imageFile.arrayBuffer();
    const mimeType = imageFile.type;
    const base64 = Buffer.from(imageBuffer).toString('base64');
    const dataURI = `data:${mimeType};base64,${base64}`;

    const finalPrompt = `Ajuste a imagem fornecida. ${prompt}. Tema estratégico: ${brandTheme || 'não especificado'}.`;
    
    // Usando um modelo de instrução de imagem (img2img)
    const output = await replicate.run(
      "lucataco/ip-adapter-faceid:85b232331c5f5086d49938096113b240212f5a04381861033a5953040f807df3",
      {
        input: {
          image: dataURI,
          prompt: finalPrompt,
          // Parâmetros adicionais que podem ajudar no controle da edição
          prompt_strength: 0.8, 
          negative_prompt: "desfigurado, baixa qualidade, texto borrado",
        }
      }
    );
    
    const imageUrl = (output as string[])?.[0];
    if (!imageUrl) {
      throw new Error("A API não retornou uma imagem revisada.");
    }
    
    return NextResponse.json({ imageUrl });

  } catch (error) {
    console.error('Erro ao chamar a API da Replicate:', error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: 'Falha ao processar a revisão da imagem.', details: errorMessage }, { status: 500 });
  }
}