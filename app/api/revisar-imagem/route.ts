// app/api/revisar-imagem/route.ts
import { NextRequest, NextResponse } from 'next/server';

const apiKey = process.env.OPENAI_API_KEY;

export async function POST(req: NextRequest) {
  if (!apiKey) {
    return NextResponse.json({ error: 'A chave da API da OpenAI não está configurada.' }, { status: 500 });
  }

  try {
    const formData = await req.formData();
    const imageFile = formData.get('image') as File | null;
    const prompt = formData.get('prompt') as string | null;
    const brand = formData.get('brand') as string | null;
    const theme = formData.get('theme') as string | null;

    if (!imageFile || !prompt) {
      return NextResponse.json({ error: 'Imagem e prompt de ajuste são obrigatórios.' }, { status: 400 });
    }

    const imageBuffer = await imageFile.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const mimeType = imageFile.type;
    const dataURI = `data:${mimeType};base64,${base64Image}`;

    // --- PROMPT DE REVISÃO APRIMORADO ---
    const analysisPrompt = `
      # Persona: Diretor de Arte Sênior e Especialista em Mídias Sociais.

      ## Missão:
      Analisar a imagem fornecida e fornecer um feedback técnico e estratégico, detalhado e acionável para o designer. O objetivo é aprimorar a imagem para maximizar seu impacto.

      ## Contexto da Análise:
      - **Marca:** ${brand || 'Não especificada'}
      - **Tema Estratégico:** ${theme || 'Não especificado'}
      - **Solicitação do Designer:** "${prompt}"

      ## Instruções de Análise:
      1.  **Entenda o Pedido:** Considere a solicitação principal do designer como o guia da sua análise.
      2.  **Análise Técnica:** Avalie a imagem nos seguintes pilares:
          - **Composição:** Enquadramento, foco, equilíbrio, regra dos terços.
          - **Cores e Contraste:** Paleta de cores, saturação, harmonia, contraste e como se alinham com a marca.
          - **Iluminação:** Qualidade da luz, sombras, realces e como isso afeta o "mood" da imagem.
          - **Qualidade Geral:** Nitidez, ruído, e possíveis artefatos de compressão.
      3.  **Análise Estratégica:** Avalie se a imagem:
          - Comunica efetivamente o tema "${theme}".
          - Está alinhada com a identidade da marca "${brand}".
          - É adequada para o público-alvo implícito.
      4.  **Estrutura do Feedback:** Organize sua resposta em um texto claro. Comece com um parágrafo de resumo e, em seguida, use tópicos (bullet points) para detalhar cada ponto de melhoria. Ofereça sugestões práticas e construtivas.

      ## Formato de Saída:
      Sua resposta deve ser um único texto formatado com quebras de linha (\\n). Comece com uma saudação profissional e siga a estrutura de análise.
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
            content: [
              { type: 'text', text: analysisPrompt },
              {
                type: 'image_url',
                image_url: {
                  url: dataURI,
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erro da API da OpenAI:', errorData);
      throw new Error(errorData.error?.message || 'Falha ao analisar a imagem.');
    }

    const data = await response.json();
    const analysisContent = data.choices[0].message.content;

    return NextResponse.json({ feedback: analysisContent });

  } catch (error) {
    console.error('Erro ao chamar a API da OpenAI:', error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: 'Falha ao processar a análise da imagem.', details: errorMessage }, { status: 500 });
  }
}