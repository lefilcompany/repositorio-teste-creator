// app/api/refatorar-text/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
    if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json({ error: 'Chave da API OpenAI não configurada.' }, { status: 500 });
    }

    try {
        const { prompt, originalTitle, originalBody, originalHashtags, brand, theme } = await req.json();

        if (!prompt || !originalTitle || !originalBody || !originalHashtags) {
            return NextResponse.json({ error: 'Dados insuficientes para a revisão.' }, { status: 400 });
        }

        const textPrompt = `
            # Tarefa: Refinar um post de mídia social.
            ## Contexto Original:
            - **Marca**: ${brand || 'N/A'}
            - **Tema**: ${theme || 'N/A'}
            - **Título Original**: ${originalTitle}
            - **Legenda Original**: ${originalBody}
            - **Hashtags Originais**: ${originalHashtags.join(', ')}

            ## Instrução de Ajuste do Usuário:
            "${prompt}"

            ## Sua Missão:
            Com base na instrução do usuário, gere uma nova versão do post.
            Responda ESTRITAMENTE em formato JSON com as chaves "title", "body" (legenda com quebras de linha \\n), e "hashtags" (um array de strings sem '#'). Mantenha a estrutura, mas aplique as melhorias solicitadas.
        `;

        const maxRetries = 5;
        let retryCount = 0;
        let success = false;
        let revisedContent;

        while (!success && retryCount < maxRetries) {
            try {
                console.log(`Tentativa ${retryCount + 1} de refatoração de texto...`);

                const response = await openai.chat.completions.create({
                    model: 'gpt-4o-mini',
                    messages: [{ role: 'user', content: textPrompt }],
                    response_format: { type: "json_object" },
                    temperature: 0.7,
                });

                const rawContent = response.choices[0].message.content;
                revisedContent = JSON.parse(rawContent || '{}');

                if (!revisedContent.title || !revisedContent.body || !Array.isArray(revisedContent.hashtags)) {
                    throw new Error("Formato de JSON inválido recebido da IA.");
                }

                success = true;
                console.log(`Refatoração de texto bem-sucedida na tentativa ${retryCount + 1}`);

            } catch (error: any) {
                retryCount++;
                console.warn(`Falha na tentativa ${retryCount} de refatoração de texto:`, error.message);

                // Aguarda meio segundo entre tentativas
                await new Promise(resolve => setTimeout(resolve, 500));
                
                if (error.status === 503 ||
                    error.message?.includes('overloaded') ||
                    error.message?.includes('rate limit') ||
                    error.message?.includes('too many requests')) {

                    if (retryCount < maxRetries) {
                        const delay = Math.min(1000 * Math.pow(2, retryCount), 30000);
                        console.log(`Aguardando ${delay}ms adicional antes da próxima tentativa...`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                } else {
                    throw error;
                }
            }
        }

        if (!success) {
            throw new Error(`Falha ao refatorar texto após ${maxRetries} tentativas. O modelo pode estar sobrecarregado.`);
        }

        return NextResponse.json(revisedContent);

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro desconhecido';
        console.error('Erro ao refatorar texto:', error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}