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

    // --- PROMPT DE PLANEJAMENTO APRIMORADO ---
    const planningPrompt = `
      # Persona: Estrategista de Conteúdo de Alta Performance.

      ## Missão:
      Desenvolver um plano de conteúdo detalhado e estratégico para ${platform}, que sirva como um briefing completo para a equipe de design e copywriting. O plano deve ser criativo, coeso e focado em atingir os objetivos de negócio.

      ## Contexto da Campanha:
      - **Marca:** "${brand}"
      - **Tema Estratégico da Campanha:** "${theme}"
      - **Plataforma de Foco:** ${platform}
      - **Quantidade de Posts a Planejar:** ${quantity}
      - **Objetivo Principal da Campanha:** "${objective}"
      - **Informações Adicionais Relevantes:** ${additionalInfo || 'Nenhuma'}

      ## Tarefa Detalhada:
      Crie um plano de conteúdo para ${quantity} post(s). Para cada post, estruture a resposta de forma clara, utilizando a seguinte formatação:

      **Post [Número do Post]**

      1.  **Conceito Criativo:** Descreva a ideia central do post. Qual é a mensagem principal que queremos passar? (Ex: "Apresentar o novo sabor de café com foco na cremosidade e no aroma.")
      2.  **Diretrizes Visuais (Briefing para o Designer):** Descreva em detalhes a imagem ou vídeo que deve ser criado. Inclua estilo (realista, ilustrado), composição, paleta de cores, elementos essenciais e o sentimento a ser evocado. (Ex: "Fotografia macro de uma xícara de café, com a espuma cremosa em destaque. Vapor subindo. Fundo desfocado com tons quentes.")
      3.  **Sugestão de Legenda (Briefing para o Copywriter):** Crie uma legenda envolvente que complemente o visual. A legenda deve incluir um gancho inicial, desenvolver a ideia e terminar com uma chamada para ação (CTA) clara que incentive o usuário a cumprir o objetivo de "${objective}".
      4.  **Hashtags Estratégicas:** Liste de 5 a 7 hashtags relevantes, misturando hashtags populares, de nicho e da marca.

      ---
      Repita essa estrutura para todos os ${quantity} posts. A resposta final deve ser um único texto, bem formatado com quebras de linha (\\n) para fácil leitura.
    `;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Modelo atualizado
        messages: [
          {
            role: 'user',
            content: planningPrompt,
          },
        ],
        max_tokens: 2000, // Aumentado para acomodar planos maiores
        temperature: 0.8, // Um pouco mais criativo
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