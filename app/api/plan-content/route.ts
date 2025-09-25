import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActionType } from '@prisma/client';

const apiKey = process.env.OPENAI_API_KEY;

// --- CSS AJUSTADO PARA A NOVA ESTRUTURA DE TABELA E CONTROLE DE PAGINAÇÃO ---
const HTML_STRUCTURE_START = `
<div class="content-plan">
  <style>
    .content-plan {
      font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #334155;
      background-color: #f8fafc;
      padding: 1rem;
    }
    .content-plan h1 {
      font-size: 1.75rem;
      font-weight: 700;
      color: #4f46e5;
      border-bottom: 2px solid #a5b4fc;
      padding-bottom: 0.5rem;
      margin-bottom: 1.5rem;
    }
    .content-plan h2 {
        font-size: 1.5rem;
        font-weight: 600;
        margin-top: 2rem;
        color: #1e293b;
    }
    .post-suggestion {
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.5rem;
      margin-top: 1.5rem;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
      /* --- REGRA CHAVE: Evita que o post seja dividido entre páginas --- */
      page-break-inside: avoid;
    }
    .post-suggestion h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #4f46e5;
      margin: 0 0 1rem;
    }
    /* --- ESTILOS PARA A NOVA ESTRUTURA DE TABELA --- */
    .post-suggestion table {
        width: 100%;
        border-collapse: collapse;
    }
    .post-suggestion td {
        padding: 0.75rem 0;
        border-bottom: 1px solid #f1f5f9;
        text-align: left;
        vertical-align: top; /* Garante alinhamento no topo */
    }
    .post-suggestion tr:last-child td {
        border-bottom: none;
    }
    .post-suggestion td:first-child {
        width: 150px; /* Largura fixa para a coluna de labels */
        font-weight: 600;
        color: #1e293b;
    }
    .post-suggestion .copy-block {
        background-color: #f8fafc;
        padding: 0.75rem;
        border-radius: 6px;
        font-style: italic;
        border-left: 3px solid #a5b4fc;
        /* --- REGRA CHAVE: Garante a quebra de linha do texto --- */
        white-space: pre-wrap;
        word-break: break-word;
    }
    .hashtags-list span {
        display: inline-block;
        background-color: #eef2ff;
        color: #4f46e5;
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.875rem;
        margin: 0.25rem;
        font-weight: 500;
    }
    .meta-header {
        background: #fff;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 1.5rem;
        margin-bottom: 2rem;
    }
    .meta-header ul {
        list-style: none; padding: 0;
    }
    .meta-header li {
       display: flex;
       justify-content: space-between;
       padding: 0.5rem 0;
       border-bottom: 1px solid #f1f5f9;
    }
    .meta-header li:last-child { border: none; }
    .meta-header strong { font-weight: 600; color: #334155; }
    .meta-header span { color: #64748b; }
  </style>
`;
const HTML_STRUCTURE_END = `</div>`;

export async function POST(req: NextRequest) {
  if (!apiKey) {
    return NextResponse.json({ error: 'A chave da API da OpenAI não está configurada.' }, { status: 500 });
  }

  try {
    const body = await req.json();
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
      moodboard,
    } = body;

    const themes: string[] = Array.isArray(theme) ? theme.map(String).filter(Boolean) : (theme ? [String(theme)] : []);
    const themeList = themes.join(', ');

    if (!brand || themes.length === 0 || !platform || quantity < 1 || !objective || !teamId || !brandId || !userId) {
      return NextResponse.json({ error: 'Todos os campos obrigatórios devem ser preenchidos.' }, { status: 400 });
    }

    // Verificar créditos disponíveis
    const team = await prisma.team.findUnique({
      where: { id: teamId }
    });

    if (!team) {
      return NextResponse.json({ error: 'Equipe não encontrada.' }, { status: 404 });
    }

    const teamCredits = (team as any).credits;
    const availableCredits = teamCredits?.contentPlans || 0;

    if (availableCredits <= 0) {
      return NextResponse.json({ error: 'Créditos insuficientes para gerar planejamento.' }, { status: 403 });
    }

    const selectedThemes = await prisma.strategicTheme.findMany({
      where: { teamId, brandId, title: { in: themes } },
      select: { title: true, toneOfVoice: true, description: true },
    });

    const themesContext = selectedThemes.map(t => `- TEMA: ${t.title}\n  - TOM DE VOZ: ${t.toneOfVoice}\n  - RESUMO: ${t.description}`).join('\n\n');

    // --- PROMPT ATUALIZADO PARA USAR A ESTRUTURA DE TABELA E O MOODBOARD ---
    let moodboardContext = '';
    if (moodboard && moodboard.content) {
      // Se for PDF, DOCX ou TXT, apenas informe o nome e tipo e inclua um trecho do texto se possível
      let moodboardText = '';
      if (moodboard.type?.includes('text') && typeof moodboard.content === 'string') {
        // TXT: decodifica base64
        try {
          const base64 = moodboard.content.split(',')[1] || moodboard.content;
          moodboardText = Buffer.from(base64, 'base64').toString('utf-8').slice(0, 1000);
        } catch {}
      } else if (moodboard.type?.includes('pdf')) {
        moodboardText = '[Arquivo PDF enviado: ' + moodboard.name + ']';
      } else if (moodboard.type?.includes('word') || moodboard.name?.endsWith('.docx')) {
        moodboardText = '[Arquivo DOCX enviado: ' + moodboard.name + ']';
      } else {
        moodboardText = '[Arquivo enviado: ' + moodboard.name + ']';
      }
      moodboardContext = `\n7.  **Moodboard/Referências Visuais:** ${moodboardText}`;
    }

    const planningPrompt = `
Você é um Estrategista de Conteúdo Sênior, especialista em criar planos de conteúdo B2B e B2C alinhados a objetivos de negócio. Sua tarefa é gerar um planejamento de conteúdo em HTML com ${quantity} sugestões de posts para a marca "${brand}".

--- CONTEXTO E DIRETRIZES OBRIGATÓRIAS ---
1.  **Objetivo Principal da Campanha:** "${objective}"
2.  **Plataforma Foco:** ${platform}
3.  **Temas Estratégicos e Tom de Voz (Fonte da Verdade):**
    ${themesContext || "Nenhum tema detalhado fornecido."}
4.  **Informações Adicionais do Cliente:** ${additionalInfo || "Nenhuma."}
5.  **Metodologia (OBRIGATÓRIO):** Crie um plano de conteúdo balanceado. Distribua as ${quantity} sugestões de posts de forma inteligente entre os diferentes estágios do funil de marketing e os pilares editoriais, inspirado no modelo 70/20/10:
    * **Funil:** Crie posts para Topo (Awareness/Educação), Meio (Consideração/Prova Social) e Fundo (Decisão/Conversão).
    * **Pilares Editoriais:**
        * **70% Educação/Autoridade:** Conteúdos que ensinam, informam e constroem autoridade sobre os temas.
        * **20% Prova Social/Produto:** Cases de sucesso, depoimentos, demos e conteúdo focado nas soluções.
        * **10% Cultura/Marca:** Bastidores, valores da empresa, equipe.
    * **Garantia de Variedade:** Não repita a mesma ideia. Cada post deve ter um objetivo, formato e ângulo únicos.
6.  **Restrição Importante:** É estritamente proibido o uso de emojis em qualquer parte do conteúdo gerado. O texto deve ser limpo e profissional.
${moodboardContext}

--- ESTRUTURA DE SAÍDA (HTML OBRIGATÓRIO) ---
Gere o conteúdo HTML INTERNO, começando com a tag <h1> e terminando após a última tag </article>. Siga RIGOROSAMENTE a estrutura de TABELA abaixo para CADA uma das ${quantity} sugestões de post.

**EXEMPLO DE UMA SUGESTÃO DE POST (USAR TABELA):**
<article class="post-suggestion">
  <h3>Post 1: [Título Criativo e Descritivo do Post]</h3>
  <table>
    <tr>
      <td>Objetivo:</td>
      <td>[Ex: Prova Social, Autoridade, Geração de Demanda]</td>
    </tr>
    <tr>
      <td>Funil:</td>
      <td>[Topo, Meio ou Fundo]</td>
    </tr>
    <tr>
      <td>Persona:</td>
      <td>[Ex: Diretores de Marketing, C-level, PMEs]</td>
    </tr>
    <tr>
      <td>Grande Ideia:</td>
      <td>[A mensagem central do post em uma única frase impactante.]</td>
    </tr>
    <tr>
      <td>Formato:</td>
      <td>[Ex: Carrossel para LinkedIn (8 cards), Reels (45s), Artigo Curto]</td>
    </tr>
    <tr>
      <td>Estrutura/Roteiro:</td>
      <td><div class="copy-block">[Descreva em bullet points ou passos. Ex: 1. Hook (Problema), 2. Solução (Estratégia), 3. KPIs de resultado, 4. CTA.]</div></td>
    </tr>
    <tr>
      <td>Legenda/Copy:</td>
      <td><div class="copy-block">[Escreva uma sugestão de legenda completa e persuasiva, aplicando o tom de voz definido. NÃO USE EMOJIS.]</div></td>
    </tr>
    <tr>
      <td>CTA (Call to Action):</td>
      <td>[Ex: "Agende uma demo de 15 min.", "Baixe nosso e-book gratuito.", "Comente sua opinião!"]</td>
    </tr>
    <tr>
      <td>Brief de Arte:</td>
      <td>[Diretrizes claras para o designer. Ex: "Usar gráficos simples para dados, fotos reais da equipe, tipografia forte. Paleta de cores: #4f46e5, #ffffff."]</td>
    </tr>
    <tr>
      <td>Hashtags:</td>
      <td><div class="hashtags-list"><span>#MarketingDoFuturo</span> <span>#CommunityLedGrowth</span> <span>#DataDriven</span></div></td>
    </tr>
    <tr>
      <td>Distribuição:</td>
      <td>[Estratégia de promoção. Ex: "Impulsionar para decisores no LinkedIn.", "Remarketing para visitantes do site."]</td>
    </tr>
    <tr>
      <td>Métrica-chave:</td>
      <td>[O KPI principal para medir o sucesso. Ex: "Downloads do material (MQLs)", "Cliques no link da bio", "Taxa de Engajamento"]</td>
    </tr>
  </table>
</article>
--- FIM DO EXEMPLO ---

Agora, gere o plano de conteúdo completo.
`;
    const headerHtml = `
      <h1>Plano de Conteúdo Estratégico</h1>
      <div class="meta-header">
        <ul>
            <li><strong>Marca:</strong> <span>${brand}</span></li>
            <li><strong>Tema(s):</strong> <span>${themeList}</span></li>
            <li><strong>Plataforma:</strong> <span>${platform}</span></li>
            <li><strong>Quantidade de Posts:</strong> <span>${quantity}</span></li>
            <li><strong>Objetivo Principal:</strong> <span>${objective}</span></li>
        </ul>
      </div>
      <h2>Sugestões de Posts</h2>
    `;

    console.log('Gerando prompt estratégico para a OpenAI...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o', // Usando um modelo mais robusto para instruções complexas
        messages: [
          {
            role: 'system',
            content: 'Você é um Estrategista de Conteúdo Sênior. Sua especialidade é criar planos de conteúdo detalhados em formato HTML, seguindo rigorosamente a estrutura solicitada pelo usuário.'
          },
          {
            role: 'user',
            content: planningPrompt,
          },
        ],
        max_tokens: 4096,
        temperature: 0.75,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Falha ao se comunicar com a OpenAI.');
    }

    const data = await response.json();
    const planContent = data.choices[0]?.message?.content;

    if (!planContent) {
      throw new Error('A IA não retornou conteúdo para o plano.');
    }

    const cleanPlanContent = planContent.replace(/^```html\n?/, '').replace(/\n?```$/, '').trim();

    // Combina o CSS, o cabeçalho gerado localmente e o conteúdo da IA
    const finalHtml = HTML_STRUCTURE_START + headerHtml + cleanPlanContent + HTML_STRUCTURE_END;

    // Salva a ação no banco de dados
    const action = await prisma.action.create({
      data: {
        type: ActionType.PLANEJAR_CONTEUDO,
        teamId,
        brandId,
        userId,
        details: {
          brand,
          themes,
          platform,
          quantity,
          objective,
          additionalInfo,
        },
        result: { plan: finalHtml },
        approved: true,
        status: 'Aprovado'
      },
    });

    // Decrementar créditos após sucesso
    const updatedCredits = {
      ...teamCredits,
      contentPlans: Math.max(0, (teamCredits?.contentPlans || 0) - 1)
    };

    await prisma.$executeRaw`
      UPDATE "Team" 
      SET credits = ${JSON.stringify(updatedCredits)}::jsonb
      WHERE id = ${teamId}
    `;

    return NextResponse.json({ plan: finalHtml, actionId: action.id });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Erro no endpoint /api/plan-content:", error);
    return NextResponse.json({ error: 'Falha ao processar o planejamento de conteúdo.', details: errorMessage }, { status: 500 });
  }
}