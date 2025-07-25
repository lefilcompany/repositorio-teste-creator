// app/api/generate-image/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;

  // Extrai o prompt já construído e os outros dados do corpo da requisição
  const { prompt: imagePrompt, ...formData } = await req.json();

  if (!apiKey) {
    return NextResponse.json({ error: 'A chave da API da OpenAI não foi configurada.' }, { status: 500 });
  }

  if (!imagePrompt) {
    return NextResponse.json({ error: 'O prompt da imagem é obrigatório.' }, { status: 400 });
  }

  // Constrói um prompt para a geração de texto (post)
  const textPrompt = `
    Com base nas seguintes informações, crie um post para a plataforma ${formData.platform}:
    - Marca/Tema: ${formData.brandTheme}
    - Objetivo do Post: ${formData.objective}
    - Descrição da Ideia: ${formData.description}
    - Público-alvo: ${formData.audience}
    - Tom de Voz: ${formData.tone}

    Responda em formato JSON com as seguintes chaves: "title" (um título criativo e curto), "body" (a legenda do post, com quebras de linha representadas por \\n), e "hashtags" (um array de 5 a 7 hashtags relevantes, sem o caractere '#').
  `;

  try {
    // Geração da Imagem
    const imageResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: imagePrompt,
        n: 1,
        size: '1024x1024',
        quality: 'hd',
      }),
    });

    if (!imageResponse.ok) {
      const errorData = await imageResponse.json();
      console.error('Erro da API de Imagem da OpenAI:', errorData);
      return NextResponse.json({ error: 'Falha ao gerar a imagem.', details: errorData }, { status: imageResponse.status });
    }

    const imageData = await imageResponse.json();
    const imageUrl = imageData.data[0].url;

    // Geração do Texto
    const textResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
            model: 'gpt-4-turbo',
            messages: [{ role: 'user', content: textPrompt }],
            response_format: { type: "json_object" },
            temperature: 0.7,
        }),
    });

    if (!textResponse.ok) {
        const errorData = await textResponse.json();
        console.error('Erro da API de Texto da OpenAI:', errorData);
        // Mesmo que o texto falhe, vamos retornar a imagem para o usuário
        return NextResponse.json({ imageUrl, title: "Erro ao gerar legenda", body: "Não foi possível gerar o conteúdo do post, mas sua imagem está pronta!", hashtags: [] });
    }

    const textData = await textResponse.json();
    const postContent = JSON.parse(textData.choices[0].message.content);

    return NextResponse.json({
      imageUrl,
      title: postContent.title,
      body: postContent.body,
      hashtags: postContent.hashtags,
    });

  } catch (error) {
    console.error('Erro ao chamar a API da OpenAI:', error);
    return NextResponse.json({ error: 'Ocorreu um erro interno no servidor.' }, { status: 500 });
  }
}