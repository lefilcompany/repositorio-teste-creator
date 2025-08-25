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

    // --- PROMPT DE PLANEJAMENTO PREMIUM ULTRA-DETALHADO ---
    const planningPrompt = `
🚀 **PLANO ESTRATÉGICO DE CONTEÚDO DE ALTA PERFORMANCE** 🚀

## 🎭 **PERSONA ESTRATÉGICA**
**Diretor Criativo Sênior + Estrategista de Conteúdo Premium**
Especialista em campanhas virais, storytelling magnético e conversão através de conteúdo visual impactante.

---

## 📋 **CONTEXTO DETALHADO DA CAMPANHA**

🏢 **Marca:** \`${brand}\`
🎨 **Tema Estratégico:** \`${theme}\`  
📱 **Plataforma Principal:** \`${platform}\`
📊 **Quantidade de Posts:** \`${quantity} posts\`
🎯 **Objetivo de Conversão:** \`${objective}\`
💡 **Insights Adicionais:** ${additionalInfo || '*Nenhuma informação adicional fornecida*'}

---

## 🎯 **MISSÃO ESTRATÉGICA**

Desenvolver um plano de conteúdo **excepcional e ultra-detalhado** para ${platform}, que sirva como **briefing completo premium** para toda a equipe criativa (designers, copywriters e social media).

### 💡 **DIRETRIZES PRINCIPAIS:**
✨ **Criatividade Inovadora:** Cada post deve ter abordagem única e memorável
🎨 **Coesão Visual:** Identidade visual consistente e impactante
🎯 **Foco em Resultados:** Otimização total para "${objective}"
📈 **Engajamento Máximo:** Conteúdo otimizado para interação e viralização

---

## 📝 **ESTRUTURA ULTRA-DETALHADA DOS POSTS**

Para cada um dos **${quantity} posts**, desenvolva seguindo esta estrutura premium:

${Array.from({length: parseInt(quantity)}, (_, i) => `

---

# 🌟 **POST ${i + 1}** - *Campanha ${theme}*

## 🎨 **CONCEITO CRIATIVO DETALHADO**
**📝 Desenvolva uma descrição completa (mínimo 150 palavras) incluindo:**

✅ **Ideia Central:** Qual é o conceito principal que queremos comunicar?
💫 **Mensagem Emocional:** Que sentimento específico queremos despertar?
⭐ **Diferencial Único:** O que torna este post especial e memorável?
🏢 **Conexão com a Marca:** Como fortalece a identidade de "${brand}"?
📊 **Impacto Esperado:** Qual reação específica esperamos do público?

**🎯 Exemplo de Qualidade Premium:**
*"Apresentar o novo sabor de café premium com foco na experiência sensorial completa - desde o aroma envolvente até a textura cremosa única, criando uma jornada emocional que conecta o consumidor com momentos de prazer e sofisticação, posicionando a marca como símbolo de qualidade excepcional e estilo de vida aspiracional."*

---

## 📸 **BRIEFING VISUAL ULTRA-COMPLETO**
**🎨 Descrição mega-detalhada (mínimo 250 palavras) incluindo:**

📱 **Estilo Fotográfico:** Definir se será fotografia real, ilustração, 3D, mixed media
📐 **Composição Principal:** Enquadramento, ângulos, regra dos terços, pontos de fuga
🎭 **Elementos Visuais:** Todos os objetos, pessoas, props que devem aparecer
🌈 **Paleta de Cores:** Cores primárias (#hex), secundárias, acentos específicos
💡 **Iluminação Detalhada:** Tipo de luz, direção, intensidade, qualidade das sombras
🖐️ **Texturas e Materiais:** Superfícies, acabamentos, sensações táteis visuais
🌟 **Atmosfera e Mood:** Ambiente emocional, temperatura de cor, energia
⚙️ **Detalhes Técnicos:** Profundidade de campo, foco, movimento, pós-produção

**📸 Exemplo de Excelência Visual:**
*"Fotografia macro em ultra-alta resolução de xícara de porcelana premium branca com bordas douradas sutis, posicionada seguindo regra dos terços (terço direito). Latte art em formato de roseta perfeita ocupa centro visual. Vapor quente subindo em espirais delicadas, captado com velocidade 1/125s. Fundo desfocado (bokeh cinematográfico f/2.8) com tons de madeira nobre envelhecida e luz natural golden hour vinda 45° esquerda. Grãos de café arábica premium espalhados artisticamente. Paleta: marrons chocolate rico (#8B4513), dourados elegantes (#FFD700), brancos cremosos (#FFF8DC), acentos âmbar (#FFBF00). Atmosfera acolhedora luxury, evocando manhãs especiais e momentos de pausa contemplativa."*

---

## ✍️ **LEGENDA ESTRATÉGICA PREMIUM**
**📝 Desenvolva legenda completa e envolvente (mínimo 200 palavras) com:**

🎣 **Hook Magnético:** Primeira frase que para o scroll instantaneamente
💭 **Desenvolvimento Emocional:** História envolvente que conecta com audiência
💎 **Proposta de Valor Clara:** Benefícios tangíveis do produto/serviço
📚 **Storytelling Poderoso:** Narrativa que ressoa com o público-alvo
👥 **Prova Social:** Elementos de credibilidade quando aplicável
🚀 **CTA Ultra-Específico:** Call-to-action otimizado para "${objective}"
🎭 **Tom de Voz Alinhado:** Personalidade consistente com "${brand}"

**📋 ESTRUTURA RECOMENDADA:**
• **Linhas 1-2:** Hook + pergunta/afirmação impactante
• **Linhas 3-6:** Desenvolvimento da narrativa central  
• **Linhas 7-9:** Benefícios e proposta de valor clara
• **Linhas 10-11:** CTA específico e irresistível para ${objective}

---

## 🏷️ **ESTRATÉGIA AVANÇADA DE HASHTAGS**
**📊 Selecione 8-12 hashtags seguindo distribuição estratégica:**

🔥 **3-4 Hashtags Populares:** Alto volume (100K+ posts), máximo alcance
🎯 **3-4 Hashtags de Nicho:** Segmento específico (10K-50K posts), audiência qualificada
🏢 **2-3 Hashtags da Marca:** Relacionadas "${brand}" e campanha específica
📈 **1-2 Hashtags Trending:** Tendências atuais relevantes para ${platform}

**💡 Formato Esperado:** Liste em ordem de relevância com breve justificativa estratégica para cada categoria.

---
`).join('')}

## ✨ **DIRETRIZES FINAIS DE EXCELÊNCIA**

🎨 **Coerência Visual Total:** Todos os posts formam campanha visualmente coesa
📖 **Progressão Narrativa:** Sequência lógica e envolvente entre posts
📱 **Otimização para ${platform}:** Melhores práticas específicas da plataforma
📊 **Métricas de Sucesso:** KPIs alinhados com objetivo "${objective}"
🚀 **Qualidade Premium:** Padrão excepcional em todos os elementos

---

## 🎯 **RESULTADO FINAL ESPERADO**
Um plano de conteúdo **ultra-detalhado e premium** que sirva como **briefing completo** para designers e copywriters, garantindo execução de **máxima qualidade** e **impacto excepcional** na campanha.

**⚠️ IMPORTANTE:** Responda seguindo EXATAMENTE esta estrutura detalhada, usando formatação Markdown rica, emojis relevantes, texto em **negrito** para destaques, e quebras de linha adequadas para máxima legibilidade e organização profissional.
    `;

    console.log('Criando prompt premium para OpenAI...'); // Debug log
    let response;
    try {
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini', // Usando modelo mais avançado para prompts complexos
          messages: [
            {
              role: 'system',
              content: 'Você é um estrategista de conteúdo premium especializado em criar briefings ultra-detalhados e profissionais para equipes criativas. Sempre forneça respostas estruturadas, detalhadas e com alta qualidade visual na formatação.'
            },
            {
              role: 'user',
              content: planningPrompt,
            },
          ],
          max_tokens: 4000, // Aumentado significativamente para acomodar respostas mais longas
          temperature: 0.7, // Equilibrio entre criatividade e consistência
          presence_penalty: 0.1, // Leve incentivo à diversidade
          frequency_penalty: 0.1 // Evitar repetições excessivas
        }),
      });
    } catch (fetchError) {
      throw new Error('Falha na conexão com a OpenAI');
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Falha ao gerar o planejamento.');
    }

    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      throw new Error('Resposta inválida da OpenAI');
    }

    const planContent = data.choices[0]?.message?.content;
    if (!planContent) {
      throw new Error('Conteúdo do plano não foi gerado');
    }

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
          approved: true, // Aprovar automaticamente
          status: 'Aprovado' // Definir status como aprovado
        },
      });
    } catch (dbError) {
      throw new Error('Falha ao salvar no banco de dados');
    }

    return NextResponse.json({ plan: planContent, actionId: action.id });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: 'Falha ao processar o planejamento de conteúdo.', details: errorMessage }, { status: 500 });
  }
}
