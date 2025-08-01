// app/api/plan-content/route.ts
import { NextRequest, NextResponse } from 'next/server';

const apiKey = process.env.OPENAI_API_KEY;

export async function POST(req: NextRequest) {
  if (!apiKey) {
    return NextResponse.json({ error: 'A chave da API da OpenAI não está configurada.' }, { status: 500 });
  }

  try {
    const { brand, theme, platform, quantity, objective, additionalInfo } = await req.json();

    if (!brand || !theme || !platform || !quantity || !objective) {
      return NextResponse.json({ error: 'Todos os campos são obrigatórios.' }, { status: 400 });
    }

    const planningPrompt = `
      Você é um planejador de conteúdo especialista em mídias sociais. Sua tarefa é criar um plano de conteúdo para a marca "${brand}" com base no tema estratégico "${theme}".

      **Plataforma:** ${platform}
      **Quantidade de Posts:** ${quantity}
      **Objetivo Principal:** ${objective}
      **Informações Adicionais:** ${additionalInfo || 'Nenhuma'}

      Crie um plano detalhado para cada um dos ${quantity} posts. Para cada post, descreva:
      1.  **Conceito do Post:** Uma breve descrição da ideia principal.
      2.  **Sugestão de Legenda:** Um texto para a legenda, incluindo uma chamada para ação (CTA).
      3.  **Sugestão de Imagem/Vídeo:** Descreva o tipo de visual que acompanharia o post.
      4.  **Hashtags:** Uma lista de 5 a 7 hashtags relevantes.

      Estruture sua resposta em um formato de texto claro e organizado, com cada post bem definido.
      A resposta deve ser um único texto, formatado com quebras de linha (\\n) para facilitar a leitura.
    `;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: planningPrompt,
          },
        ],
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erro da API da OpenAI:', errorData);
      throw new Error(errorData.error?.message || 'Falha ao gerar o planejamento.');
    }

    const data = await response.json();
    const planContent = data.choices[0].message.content;

    return NextResponse.json({ plan: planContent });

  } catch (error) {
    console.error('Erro ao chamar a API da OpenAI:', error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: 'Falha ao processar o planejamento de conteúdo.', details: errorMessage }, { status: 500 });
  }
}