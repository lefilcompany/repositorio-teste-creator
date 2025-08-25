// app/api/plan-content/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActionType } from '@prisma/client';

const apiKey = process.env.OPENAI_API_KEY;

export async function POST(req: NextRequest) {
  if (!apiKey) {
    return NextResponse.json({ error: 'A chave da API da OpenAI não está configurada.' }, { status: 500 });
  }

  try {
    const body = await req.json();
    console.log('Dados recebidos na API plan-content:', body); // Debug log
    const {
      brand,
      theme,
      platform,
      quantity,
      objective,
      additionalInfo,
      teamId,
      brandId,
      userId,
    } = body;

    // Validações específicas com mensagens mais detalhadas
    if (!brand) {
      return NextResponse.json({ error: 'O campo "marca" é obrigatório.' }, { status: 400 });
    }
    if (!theme) {
      return NextResponse.json({ error: 'O campo "tema" é obrigatório.' }, { status: 400 });
    }
    if (!platform) {
      return NextResponse.json({ error: 'O campo "plataforma" é obrigatório.' }, { status: 400 });
    }
    if (!quantity || quantity < 1) {
      return NextResponse.json({ error: 'O campo "quantidade" deve ser um número maior que zero.' }, { status: 400 });
    }
    if (!objective) {
      return NextResponse.json({ error: 'O campo "objetivo" é obrigatório.' }, { status: 400 });
    }
    if (!teamId) {
      return NextResponse.json({ error: 'ID da equipe não fornecido.' }, { status: 400 });
    }
    if (!brandId) {
      return NextResponse.json({ error: 'ID da marca não fornecido.' }, { status: 400 });
    }
    if (!userId) {
      return NextResponse.json({ error: 'ID do usuário não fornecido.' }, { status: 400 });
    }

    // --- PROMPT DE PLANEJAMENTO APRIMORADO ---
    console.log('Criando prompt para OpenAI...'); // Debug log
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

    console.log('Fazendo requisição para OpenAI...'); // Debug log
    let response;
    try {
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo', // Mudando para um modelo mais confiável
          messages: [
            {
              role: 'user',
              content: planningPrompt,
            },
          ],
          max_tokens: 3000, // Aumentado para acomodar planos maiores  
          temperature: 0.8, // Um pouco mais criativo
        }),
      });
    } catch (fetchError) {
      console.error('Erro na requisição para OpenAI:', fetchError);
      throw new Error('Falha na conexão com a OpenAI');
    }

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erro da OpenAI:', errorData); // Debug log
      throw new Error(errorData.error?.message || 'Falha ao gerar o planejamento.');
    }

    console.log('Resposta da OpenAI recebida com sucesso'); // Debug log
    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error('Erro ao fazer parse da resposta da OpenAI:', jsonError);
      throw new Error('Resposta inválida da OpenAI');
    }

    const planContent = data.choices[0]?.message?.content;
    if (!planContent) {
      console.error('Conteúdo vazio da OpenAI:', data);
      throw new Error('Conteúdo do plano não foi gerado');
    }

    console.log('Criando ação no banco de dados...'); // Debug log
    let action;
    try {
      action = await prisma.action.create({
        data: {
          type: ActionType.PLANEJAR_CONTEUDO,
          teamId,
          brandId,
          userId,
          details: { brand, theme, platform, quantity, objective, additionalInfo },
          result: { plan: planContent },
        },
      });
    } catch (dbError) {
      console.error('Erro ao criar ação no banco:', dbError);
      throw new Error('Falha ao salvar no banco de dados');
    }

    console.log('Ação criada com sucesso no banco:', action.id); // Debug log
    return NextResponse.json({ plan: planContent, actionId: action.id });

  } catch (error) {
    console.error('Erro na API plan-content:', error); // Debug log
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: 'Falha ao processar o planejamento de conteúdo.', details: errorMessage }, { status: 500 });
  }
}
