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
    const brandTheme = formData.get('brandTheme') as string | null;

    if (!imageFile || !prompt) {
      return NextResponse.json({ error: 'Imagem e prompt de ajuste são obrigatórios.' }, { status: 400 });
    }

    // Converte a imagem para base64, que é o formato que a API da OpenAI espera.
    const imageBuffer = await imageFile.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const mimeType = imageFile.type;
    const dataURI = `data:${mimeType};base64,${base64Image}`;

    // Monta o prompt para a IA, instruindo-a a atuar como uma especialista.
    const analysisPrompt = `
      Você é um diretor de arte especialista em mídias sociais. Sua tarefa é analisar a imagem fornecida e dar um feedback construtivo para o usuário.
      O usuário deseja os seguintes ajustes: "${prompt}".
      A imagem é para a marca ou tema estratégico: "${brandTheme || 'não especificado'}".

      Com base nisso, analise a imagem e forneça uma lista de sugestões de melhoria em formato de tópicos (bullet points).
      Seja claro, objetivo e ofereça sugestões práticas que o usuário possa aplicar.
      Estruture sua resposta em um JSON com a chave "feedback", contendo o texto formatado com quebras de linha (\\n) para cada novo parágrafo ou tópico.

      Exemplo de resposta:
      {
        "feedback": "Analisando sua imagem, aqui estão alguns pontos de melhoria para alinhá-la melhor com o tema de '${brandTheme}':\\n\\n• **Composição:** O enquadramento pode ser melhorado...\\n• **Cores:** As cores estão um pouco opacas. Tente aumentar a saturação...\\n• **Iluminação:** A luz parece vir de apenas uma direção..."
      }
    `;

    // Chamada para a API do GPT-4 com capacidade de visão
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o', // Modelo com capacidade de processar imagens
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
        response_format: { type: "json_object" }, // Garantir que a resposta seja um JSON
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Erro da API da OpenAI:', errorData);
      throw new Error(errorData.error?.message || 'Falha ao analisar a imagem.');
    }

    const data = await response.json();
    const analysisContent = JSON.parse(data.choices[0].message.content);

    // Retorna o feedback em texto
    return NextResponse.json({ feedback: analysisContent.feedback });

  } catch (error) {
    console.error('Erro ao chamar a API da OpenAI:', error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: 'Falha ao processar a análise da imagem.', details: errorMessage }, { status: 500 });
  }
}