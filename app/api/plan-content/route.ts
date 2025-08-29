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

    // Support multiple themes: accept string or array
    const themes: string[] = Array.isArray(theme) ? theme.map(String).filter(Boolean) : (theme ? [String(theme)] : []);
    const themeList = themes.join(', ');

    // Validações (mantidas) — exige ao menos um tema
    if (!brand || themes.length === 0 || !platform || quantity < 1 || !objective || !teamId || !brandId || !userId) {
      return NextResponse.json({ error: 'Todos os campos obrigatórios devem ser preenchidos.' }, { status: 400 });
    }

    // Buscar os temas selecionados para obter Tom de Voz e contexto
    const selectedThemes = await prisma.strategicTheme.findMany({
      where: {
        teamId,
        brandId,
        title: { in: themes },
      },
      select: {
        title: true,
        toneOfVoice: true,
        objectives: true,
        expectedAction: true,
        description: true,
      },
    });

    const themeToneLines = selectedThemes.map(t => `• ${t.title}: ${t.toneOfVoice}`).join('\n');
    const themesContext = selectedThemes.map(t => `- ${t.title}: tom="${t.toneOfVoice}"; objetivos="${t.objectives}"; ação esperada="${t.expectedAction}"; resumo="${t.description}".`).join('\n');

    // --- PROMPT ATUALIZADO E REFINADO ---
    const planningPrompt = `
Gere um único bloco de HTML válido contendo um briefing de conteúdo estratégico (DIRECIONAMENTO PARA CRIAÇÃO). Retorne APENAS o HTML (nenhum texto fora das tags). Não use emojis nem markdown. Use marcação semântica e espaçamento legível. Inclua um pequeno bloco <style> inline para garantir leitura (margens e paddings mínimos).

--- INÍCIO DO CONTEXTO OBRIGATÓRIO ---
Estes são os temas estratégicos e seus respectivos tons de voz. Aderir a eles é a prioridade máxima.
Contexto dos temas selecionados (fornecido pelo usuário):
${themesContext || '- (sem contexto detalhado disponível)'}

Lista de Tom de Voz por tema (use esta lista como fonte única):
${themeToneLines || '• (Tom de voz não informado nos temas)'}

Prioridade de harmonização (se houver conflito de tons): ${themeList}.
--- FIM DO CONTEXTO OBRIGATÓRIO ---


Diretrizes essenciais para o redator (OBRIGATÓRIO):
  - Gere uma seção global antes dos posts com “Sugestões de Ângulos para a Legenda” (3 bullets concisos) alinhados ao objetivo “${objective}” e aos tons de voz acima.
  - Gere também a “Chamada de Ação (CTA)” principal (1 recomendação central + 1–2 variações curtas), indicando intenção e melhor posicionamento (início/meio/final).

Visão geral: o planejamento deve integrar elementos, mensagens e ganchos de todos os temas selecionados ao longo do calendário; quando adequado, atribua posts que enfatizem subtemas específicos ou combine temas em um único post com justificativa estratégica clara. Em cada seção de post, inclua um pequeno bloco "Checklist de aplicação do tom" que mostre exatamente como o tom foi aplicado (quais frases/tokens usar e evitar).

Estrutura e requisitos obrigatórios:
- Header com metadados (marca, tema(s), plataforma, quantidade, objetivo, informações adicionais e a lista consolidada dos tons de voz fornecidos).
- Missão criativa resumida (1 frase, alinhada ao objetivo e aos tons de voz fornecidos).
- Seção “Orientações gerais para o redator” (antes dos posts) com:
  * Sugestões de Ângulos para a Legenda (3 bullets, diretos e acionáveis).
  * Chamada de Ação (CTA) principal + 1–2 variações curtas, com micro-argumento e posicionamento sugerido.
- Para cada um dos ${quantity} posts, gere uma seção contendo:
  * Conceito criativo (descritivo; ~150 palavras: ideia central, mensagem emocional, diferencial, conexão com a marca e impacto esperado). Especifique quais temas influenciaram o conceito.
  * Briefing visual (detalhado; ~250 palavras: estilo fotográfico/ilustrativo, composição, elementos-chave, paleta de cores com exemplos #hex, iluminação, texturas, proporção e notas técnicas como resolução, profundidade de campo e pós-produção). Indique referências técnicas de excelência.
  * Direcionamento de texto (substitui a legenda pronta): NÃO gere a legenda final. Em vez disso, entregue orientações acionáveis para a legenda, incluindo:
    - Tom de voz aplicável: Baseado na "Lista de Tom de Voz por tema" fornecida acima, selecione 2-4 traços chave para este post. Indique qual tema originou cada traço. Para cada traço, forneça 2 palavras-chave recomendadas e 1 a ser evitada.
    - 3–5 Sugestões de ângulos/temas de abertura que conectem o post ao objetivo; para cada bullet, indique qual traço de tom o sustenta.
    - 2–3 Exemplos de linhas de abertura (curtas) — marque qual traço de tom cada linha representa.
    - Recomendações sobre voz e comprimento (ex.: tom profissional, 120–200 palavras; ou tom conciso 60–90 palavras), e quando optar por cada formato.
    - Pergunta sugerida para engajamento (1) + 2 variações mais curtas — indique o tom que deve permear a pergunta.
    - CTA(s) recomendados (2 opções) e posicionamento sugerido (final / meio) — escreva também 1 micro-argumento (10–20 palavras) alinhado ao tom para cada CTA.
    - Notas de estilo: evitar/usar (ex.: evitar emojis, usar linguagem inclusiva, incluir prova social, referências técnicas).
    - Checklist de aplicação do tom (OBRIGATÓRIO): para cada traço extraído dos temas, liste: 1) palavras-chave a usar, 2) palavras a evitar, 3) onde no texto aplicar (abertura / corpo / CTA).
  * Variações por persona: em vez de legendas prontas, forneça 2 blocos de 1–2 linhas orientando o ajuste de tom e foco para cada persona (ex.: profissional — enfatizar desempenho; jovem trend — enfatizar estilo e emoção). Não escreva a legenda inteira.
  * Estratégia de hashtags: liste 8–12 hashtags renderizadas como elementos <span class="hashtag">#exemplo</span>. Categorize por alcance/nicho/marca e inclua 1 linha explicativa por categoria.
  * Recomendações táticas e KPIs (CTA sugerido, janela de postagem sugerida, KPI principal e objetivo numérico sugerido quando aplicável).
  * Exemplo de excelência visual: descrição curta e técnica para referência criativa dentro da mesma seção.

Formato exigido: mantenha a seguinte marcação como modelo (obrigatório) e substitua o conteúdo de exemplo pelos textos gerados. Garanta que o HTML esteja bem formado e pronto para injeção em uma UI:
<div class="planning-document" data-brand="${brand}" data-themes="${themeList}" data-platform="${platform}">
  <style>
    :root{ --accent:#6b46c1; --muted:#6b6b6b; --bg:#fbfbfb }
    .planning-document{font-family:system-ui,Arial,sans-serif;line-height:1.5;color:var(--text,#111);background:transparent}
    .planning-document h1{font-size:22px;margin:0 0 14px;color:var(--accent,#222);font-weight:700}
    .planning-document h2{font-size:18px;margin:18px 0 10px;color:#222}
    .planning-document h3{font-size:15px;margin:12px 0 8px;color:#222}
    .planning-document p{margin:0 0 12px;color:var(--muted,#333)}
    .post{border-top:1px solid #eee;padding:14px 0}
    .meta p{margin:0 0 8px;color:var(--muted,#444)}
    .list-item{margin:8px 0;padding-left:0}
    .persona-var{background:var(--bg,#f7f7f7);padding:10px;border-radius:6px;margin-top:10px;border:1px solid #ececec}
    .highlight{background:linear-gradient(90deg,rgba(107,70,193,0.08),transparent);padding:6px;border-radius:4px}
    .persona-extract{font-style:italic;color:var(--muted,#666);margin-top:8px}
    .use-prose{max-width:72ch}
    .hashtags-list{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
    .hashtag{display:inline-block;background:rgba(107,70,193,0.08);color:var(--accent,#6b46c1);padding:6px 10px;border-radius:999px;font-size:13px;border:1px solid rgba(107,70,193,0.12)}
  </style>

      <header>
    <h1>DIRETIVA DE CRIAÇÃO: PLANEJAMENTO DE CONTEÚDO ESTRATÉGICO</h1>
    <ul class="meta">
      <li><strong>Marca:</strong> ${brand}</li>
      <li><strong>Tema(s):</strong> ${themeList}</li>
      <li><strong>Plataforma:</strong> ${platform}</li>
      <li><strong>Quantidade:</strong> ${quantity}</li>
      <li><strong>Objetivo:</strong> ${objective}</li>
      <li><strong>Informações adicionais:</strong> ${additionalInfo || 'Nenhuma'}</li>
      <li><strong>Tons de Voz dos Temas:</strong> <div style="padding: 8px 0 0 0; white-space: pre-wrap; font-family: inherit; font-size: 14px;">${themeToneLines || 'Não especificado'}</div></li>
    </ul>
  </header>

  <section id="guidelines">
    <h2><strong>Orientações gerais para o redator</strong></h2>
    <div class="highlight">
      <h3>Sugestões de Ângulos para a Legenda</h3>
      <p class="use-prose">Forneça 3 bullets concisos conectando os temas e o objetivo "${objective}". Ex.: enfatizar silêncio, economia de energia, inovação aplicada ao dia a dia.</p>
      <h3 style="margin-top:10px">Chamada de Ação (CTA)</h3>
      <p class="use-prose">Defina 1 CTA principal (com micro-argumento) e 1–2 variações curtas, com indicação de melhor posicionamento (início/meio/final).</p>
    </div>
  </section>

  <section id="posts">
    <h2><strong>Detalhamento por post</strong></h2>
    ${Array.from({ length: parseInt(quantity) }, (_, i) => `
    <article class="post" data-index="${i + 1}">
      <h3><strong>Post ${i + 1} / ${quantity}</strong></h3>

      <section class="concept">
        <h4><strong>Conceito criativo</strong></h4>
        <p class="use-prose">(Forneça um texto detalhado de ~150 palavras: ideia central, mensagem emocional, diferencial, conexão com a marca e impacto esperado.)</p>
        <p class="list-item">• Ideia central: (resuma em 1 frase)</p>
        <p class="list-item">• Mensagem emocional: (sentimento a evocar)</p>
        <p class="list-item">• Diferencial: (o que torna memorável)</p>
        <p class="list-item">• Conexão com a marca: (como reforça ${brand})</p>
        <p class="list-item">• Temas que influenciaram este conceito: (liste e justifique)</p>
      </section>

      <section class="visual">
        <h4><strong>Briefing visual</strong></h4>
        <p class="use-prose">(Forneça um texto técnico e descritivo de ~250 palavras incluindo: estilo fotográfico/ilustrativo, composição, elementos-chave, paleta de cores com exemplos #hex, tipo de iluminação, texturas e notas técnicas como resolução, proporção e profundidade de campo.)</p>
        <p class="list-item">• Exemplo de referência técnica: (2–4 frases com referência de excelência)</p>
      </section>

      <section class="direcionamento-texto">
        <h4><strong>Direcionamento de texto</strong></h4>
        <p>Forneça instruções práticas e acionáveis para redatores. Todas as recomendações abaixo devem demonstrar explicitamente como o Tom de Voz fornecido pelos temas foi aplicado.</p>
        <p class="list-item">• Tom de voz aplicável (2–4 traços escolhidos dos temas) e qual(is) tema(s) influenciaram cada traço — inclua 2 palavras-chave recomendadas e 1 termo a evitar por traço.</p>
        <p class="list-item">• Sugestões de ângulos/temas de abertura (3–5 bullets) e, para cada bullet, indique qual traço de tom sustenta essa sugestão.</p>
        <p class="list-item">• 2–3 Exemplos de linhas de abertura (frases curtas para inspirar a legenda) — marque qual traço de tom cada linha representa.</p>
        <p class="list-item">• Recomendações de comprimento e formato (quando usar 60–90 palavras vs 120–200 palavras) e qual tom justificaría cada formato.</p>
        <p class="list-item">• Pergunta sugerida para engajamento (1) + 2 variações mais curtas — indique o tom que deve permear a pergunta.</p>
        <p class="list-item">• CTA(s) recomendados (2 opções) e posicionamento sugerido (final / meio) — escreva também 1 micro-argumento (10–20 palavras) alinhado ao tom para cada CTA.</p>
        <p class="list-item">• Notas de estilo: evitar/usar (ex.: evitar emojis, incluir prova social, linguagem inclusiva) e termos a evitar em função do tom.</p>
        <p class="list-item">• Checklist de aplicação do tom (OBRIGATÓRIO): para cada traço extraído, liste: 1) palavras-chave a usar, 2) palavras a evitar, 3) onde no texto aplicar (abertura / corpo / CTA).</p>
      </section>

      <section class="personas">
        <h4><strong>Orientação por persona</strong></h4>
        <p>Para cada persona, entregue 1–2 linhas indicando como ajustar o foco e o tom (não escrever a legenda completa).</p>
        <div class="persona-var"><strong>Persona 1 (ex: profissional):</strong> [linha de ajuste — 1–2 linhas]</div>
        <div class="persona-var"><strong>Persona 2 (ex: jovem trend):</strong> [linha de ajuste — 1–2 linhas]</div>
      </section>
      <br />
      <section class="hashtags">
        <h4>Hashtags:</h4>
        <p>Liste 8–12 hashtags começando com o símbolo '#' e renderize cada uma como um bloco visual usando a classe <code>hashtag</code>. Categorize por alcance/nicho/marca e inclua 1 linha explicativa por categoria.</p>
        <p class="hashtags-list"><span class="hashtag">#exemplo</span>
        </p>
      </section>

      <section class="tactics">
        <h4><strong>Táticas e KPIs</strong></h4>
        <ul>
          <li><strong>• CTA recomendado:</strong> (ex: link na bio, comente)</li>
          <li><strong>• Janela de postagem sugerida:</strong> (ex: 18:00–20:00)</li>
          <li><strong>• KPI principal:</strong> (ex: taxa de engajamento, cliques). Indique objetivo numérico sugerido quando aplicável.</li>
        </ul>
      </section>

      <section class="excellence">
        <h4><strong>Exemplo de excelência visual</strong></h4>
        <p>Descrição curta e técnica para referência criativa.</p>
      </section>
    </article>
    `).join('')}
  </section>

  <footer>
    <p>Documento pronto para ser encaminhado à equipe de criação.</p>
  </footer>
</div>`;

    console.log('Criando prompt profissional (HTML) para OpenAI...');
    let response;
    try {
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'Você é um Diretor de Criação Sênior. Sua especialidade é criar briefings detalhados em formato HTML. Sua resposta deve ser um bloco de código HTML único, bem estruturado, com tópicos e parágrafos curtos para máxima legibilidade profissional.'
            },
            {
              role: 'user',
              content: planningPrompt,
            },
          ],
          max_tokens: 4000,
          temperature: 0.7,
          presence_penalty: 0.1,
          frequency_penalty: 0.1
        }),
      });
    } catch (fetchError) {
      throw new Error('Falha na conexão com a OpenAI');
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Falha ao gerar o planejamento.');
    }

    const data = await response.json();
    const planContent = data.choices[0]?.message?.content;

    if (!planContent) {
      throw new Error('Conteúdo do plano não foi gerado');
    }

    const cleanPlanContent = planContent.replace(/^```html\n?/, '').replace(/\n?```$/, '').trim();

    let action;
    try {
      action = await prisma.action.create({
        data: {
          type: ActionType.PLANEJAR_CONTEUDO,
          teamId,
          brandId,
          userId,
          details: { 
            brand, 
            themes: themes, 
            themeList, 
            platform, 
            quantity, 
            objective, 
            additionalInfo,
            selectedThemeTones: (selectedThemes || []).map(t => ({ title: t.title, toneOfVoice: t.toneOfVoice }))
          },
          result: { plan: cleanPlanContent },
          approved: true,
          status: 'Aprovado'
        },
      });
    } catch (dbError) {
      throw new Error('Falha ao salvar no banco de dados');
    }

    return NextResponse.json({ plan: cleanPlanContent, actionId: action.id });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: 'Falha ao processar o planejamento de conteúdo.', details: errorMessage }, { status: 500 });
  }
}