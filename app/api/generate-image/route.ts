import { NextRequest, NextResponse } from 'next/server';

interface OpenAIResponse {
  data: { url: string }[];
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;

  // 1. Extrair o prompt do corpo da requisição
  const { prompt } = await req.json();

  // 2. Validações
  if (!apiKey) {
    return NextResponse.json(
      { error: 'A chave da API da OpenAI não foi configurada.' },
      { status: 500 }
    );
  }

  if (!prompt) {
    return NextResponse.json(
      { error: 'O prompt é obrigatório.' },
      { status: 400 }
    );
  }

  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        // 3. Usar o prompt fornecido pelo usuário
        prompt: prompt,
        n: 1,
        size: '1024x1024',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erro da API da OpenAI:', errorData);
      return NextResponse.json(
        { error: 'Falha ao gerar a imagem.', details: errorData },
        { status: response.status }
      );
    }

    const data: OpenAIResponse = await response.json();
    const imageUrl = data.data[0].url;

    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error('Erro ao chamar a API da OpenAI:', error);
    return NextResponse.json(
      { error: 'Ocorreu um erro interno no servidor.' },
      { status: 500 }
    );
  }
}