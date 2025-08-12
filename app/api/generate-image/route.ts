// app/api/generate-image/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { GoogleGenAI, Modality } from '@google/genai';
import path from 'path';
import fs from 'fs';

// Inicializa o cliente da OpenAI com suas configurações.
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MAX_PROMPT_LENGTH = 3950;

/**
 * Limpa o texto de entrada de forma mínima, removendo apenas caracteres
 * que podem corromper a sintaxe do prompt e normalizando espaços em branco.
 * NÃO remove palavras nem faz substituições, preservando a intenção original do usuário.
 */
function cleanInput(text: string | string[] | undefined | null): string {
  if (!text) return '';
  
  // Se for um array, junta os elementos com vírgula
  if (Array.isArray(text)) {
    return text.map(item => cleanInput(item)).join(', ');
  }
  
  // Converte para string se não for
  const textStr = String(text);
  
  // Remove apenas caracteres potencialmente perigosos para a sintaxe do prompt.
  let cleanedText = textStr.replace(/[<>{}[\]"'`]/g, '');
  // Normaliza múltiplos espaços para apenas um e remove espaços nas pontas.
  cleanedText = cleanedText.replace(/\s+/g, ' ').trim();
  return cleanedText;
}

/**
 * Constrói um prompt detalhado e otimizado para GPT-Image-1 (VERSÃO MELHORADA).
 * Esta versão utiliza o input do usuário de forma direta, sem sanitização de palavras.
 */
function buildDetailedImagePrompt(formData: any): string {
  const description = cleanInput(formData.prompt);
  const brand = cleanInput(formData.brand);
  const theme = cleanInput(formData.theme);
  const objective = cleanInput(formData.objective);
  const platform = cleanInput(formData.platform);
  const audience = cleanInput(formData.audience);
  const tones = Array.isArray(formData.tone) ? formData.tone : (formData.tone ? [formData.tone] : []); // Garante que seja um array
  const persona = cleanInput(formData.persona);
  const additionalInfo = cleanInput(formData.additionalInfo);

  let promptParts: string[] = [];

  // 1. Assunto Principal e Qualidade Central
  if (description) {
    promptParts.push(`Uma obra-prima de fotografia comercial, hiper-detalhada e fotorrealista de: ${description}`);
  }

  // 2. Contexto Estratégico (Marca, Tema, Objetivo)
  if (brand || theme || objective) {
    let strategicContext = "A imagem deve incorporar a identidade";
    if (brand) strategicContext += ` da marca ${brand}`;
    if (theme) strategicContext += ` através do tema de ${theme}`;
    if (objective) strategicContext += `, projetada para ${objective}`;
    promptParts.push(strategicContext);
  }

  // 3. Tom e Atmosfera
  if (tones.length > 0) {
    const toneMap: { [key: string]: string } = {
      'inspirador': 'banhado em uma luz quente da golden hour, criando uma atmosfera edificante e motivacional, com sombras suaves',
      'motivacional': 'energia dinâmica capturada com cores vibrantes e um leve motion blur para encorajar a ação',
      'profissional': 'estética corporativa limpa, com iluminação de estúdio neutra e foco nítido, transmitindo confiança e expertise',
      'casual': 'atmosfera relaxada com iluminação natural e suave, como a de uma janela, criando um ambiente amigável e convidativo',
      'elegante': 'estilo sofisticado com uma paleta de cores refinada, iluminação suave e composição minimalista para um toque luxuoso',
      'moderno': 'design contemporâneo com linhas arrojadas, iluminação de alto contraste e uma estética de vanguarda',
      'tradicional': 'apelo atemporal com cores clássicas, iluminação equilibrada e composição simétrica, transmitindo herança e confiabilidade',
      'divertido': 'humor divertido capturado com cores saturadas, iluminação brilhante e uma composição lúdica e energética',
      'sério': 'tom formal com iluminação dramática (chiaroscuro), sombras profundas e uma apresentação imponente para transmitir gravidade'
    };
    const mappedTones = tones.map(tone => {
      const cleanTone = cleanInput(tone);
      return toneMap[cleanTone.toLowerCase()] || `com uma estética ${cleanTone}`;
    }).join(', ');
    promptParts.push(`O clima da imagem é uma combinação de: ${mappedTones}`);
  }

  // 4. Detalhes Técnicos da Câmera
  promptParts.push("Detalhes técnicos: foto tirada com uma câmera DSLR profissional (como uma Canon EOS R5) e uma lente de 85mm f/1.4, resultando em uma profundidade de campo rasa e um belo efeito bokeh no fundo");

  // 5. Otimização para Plataforma
  const platformStyles: { [key: string]: string } = {
    'instagram': 'formato quadrado 1:1, cores vibrantes, otimizado para feed do Instagram',
    'facebook': 'composição envolvente, focada na comunidade, otimizada para compartilhamento social',
    'linkedin': 'estética profissional e corporativa, ideal para posts de negócios',
    'twitter': 'design limpo e chamativo, otimizado para visibilidade no Twitter/X',
    'x': 'design limpo e chamativo, otimizado para visibilidade no Twitter/X',
    'tiktok': 'formato vertical 9:16, composição dinâmica e energia jovem, perfeito para TikTok',
    'youtube': 'estilo thumbnail de alto contraste, otimizado para taxas de clique no YouTube'
  };
  if (platform && platformStyles[platform.toLowerCase()]) {
    promptParts.push(`Otimizado para a plataforma: ${platformStyles[platform.toLowerCase()]}`);
  }

  // 6. Público-Alvo e Informações Adicionais
  if (audience) promptParts.push(`Direcionado especificamente para ${audience}`);
  if (persona) promptParts.push(`Conectando-se com a persona de ${persona}`);
  if (additionalInfo) promptParts.push(`Incorporando os seguintes elementos visuais: ${additionalInfo}`);

  // 7. Palavras-chave de Reforço e "Prompt Negativo"
  promptParts.push("Você é um gerador de posts para Instagram que aplica princípios avançados de design e marketing digital para criar artes de alto impacto visual e alta taxa de engajamento.Siga as diretrizes abaixo: - Utilize teorias de design como a Regra dos Terços, Gestalt, contraste de cores e tipografia legível. - Aplique psicologia das cores para gerar a emoção desejada no público-alvo. - Otimize a composição para retenção visual, considerando a taxa média de atenção de 3 segundos no feed. - Formato da arte: 1080x1080 pixels (padrão Instagram feed) ou 1080x1920 (stories), mantendo proporção 1:1 ou 9:16. - Utilize hierarquia visual clara para guiar o olhar do espectador. - Considere métricas de performance: taxa de engajamento >5%, CTR elevado, aumento de alcance orgânico. - Inclua elementos gráficos modernos e consistentes com identidade visual da marca. - Adicione espaço estratégico para inserção de textos curtos de impacto (até 5 palavras principais). - Mantenha equilíbrio entre elementos visuais e áreas de respiro para não sobrecarregar a composição. - Estilo e tom adaptados ao público-alvo, alinhados às tendências atuais de conteúdo visual no Instagram. - A imagem final deve ser realista, de alta qualidade, com iluminação e cores ajustadas para destacar no feed.");

  const finalPrompt = promptParts.join('. ');
  return finalPrompt.length > MAX_PROMPT_LENGTH ? finalPrompt.substring(0, MAX_PROMPT_LENGTH) : finalPrompt;
}

/**
 * Prompt alternativo mais conservador.
 */
// function buildConservativePrompt(formData: any): string {
//   const description = cleanInput(formData.prompt);
//   const brand = cleanInput(formData.brand);
//   const platform = cleanInput(formData.platform);

//   let prompt = "Fotografia comercial profissional, fundo limpo, iluminação natural suave, alta qualidade, realista, pronta para marketing";
//   if (description) prompt += `, apresentando uma visão de: ${description.split(' ').slice(0, 25).join(' ')}`;
//   if (brand) prompt += ` para a marca ${brand}`;
//   if (platform) prompt += ` otimizado para a plataforma ${platform}`;
//   prompt += ", estética moderna e visualmente agradável.";
//   return prompt;
// }

// /**
//  * Prompt de emergência ultra-conservador.
//  */
// function buildFallbackPrompt(): string {
//   return "Fotografia comercial profissional, fundo minimalista e limpo, iluminação natural suave, alta resolução, foco no produto, pronto para marketing, composição simples e clara.";
// }

// /**
//  * Interface para parâmetros específicos do GPT-Image-1
//  */
// interface GPTImage1Params {
//   prompt: string;
//   model: 'gpt-image-1';
//   background?: 'auto' | 'transparent' | 'opaque';
//   quality?: 'low' | 'medium' | 'high' | 'auto';
//   size?: '1024x1024' | '1792x1024' | '1024x1792';
//   output_format?: 'png' | 'jpeg';
//   moderation?: 'auto' | 'low';
//   n?: number;
// }

// /**
//  * Função específica para gerar imagens com GPT-Image-1
//  */
// async function generateImageWithGPTImage1(prompt: string, quality: 'low' | 'medium' | 'high' | 'auto' = 'high'): Promise<any> {
//   try {
//     console.log(`Gerando imagem com GPT-Image-1, prompt: "${prompt.substring(0, 100)}..."`);
//     const imageParams: GPTImage1Params = {
//       model: 'gpt-image-1',
//       prompt,
//       background: 'transparent',
//       n: 1,
//       quality,
//       size: '1024x1024',
//       output_format: 'png',
//       moderation: 'auto',
//     };
//     const response = await openai.images.generate(imageParams);
//     return response;
//   } catch (error) {
//     console.error('Erro na geração com GPT-Image-1:', error);
//     throw error;
//   }
// }

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API,
});

async function generateImage(prompt: string): Promise<any> {
  try {
    // O prompt com a descrição solicitada
    const fullPrompt = `${prompt}. Você é um gerador de posts para Instagram que aplica princípios avançados de design e marketing digital para criar artes de alto impacto visual e alta taxa de engajamento. Siga as diretrizes abaixo: - Utilize teorias de design como a Regra dos Terços, Gestalt, contraste de cores e tipografia legível. - Aplique psicologia das cores para gerar a emoção desejada no público-alvo. - Otimize a composição para retenção visual, considerando a taxa média de atenção de 3 segundos no feed. - Formato da arte: 1080x1080 pixels (padrão Instagram feed) ou 1080x1920 (stories), mantendo proporção 1:1 ou 9:16. - Utilize hierarquia visual clara para guiar o olhar do espectador. - Considere métricas de performance: taxa de engajamento >5%, CTR elevado, aumento de alcance orgânico. - Inclua elementos gráficos modernos e consistentes com identidade visual da marca. - Adicione espaço estratégico para inserção de textos curtos de impacto (até 5 palavras principais). - Mantenha equilíbrio entre elementos visuais e áreas de respiro para não sobrecarregar a composição. - Estilo e tom adaptados ao público-alvo, alinhados às tendências atuais de conteúdo visual no Instagram. - A imagem final deve ser realista, de alta qualidade, com iluminação e cores ajustadas para destacar no feed.`;

    // Enviar a imagem base64 como referência e o prompt
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-preview-image-generation",
      contents: [
        {
          text: fullPrompt,
        },
      ],
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });

    if (response.candidates && response.candidates.length > 0) {
      const candidate = response.candidates[0];

      if (
        candidate.content &&
        Array.isArray(candidate.content.parts) &&
        candidate.content.parts.length > 0
      ) {
        const part = candidate.content.parts.find((p) => p.inlineData);

        if (part && part.inlineData) {
          const imageData = part.inlineData.data;
          const buffer = Buffer.from(imageData, "base64");

          const imagePath = path.resolve(
            process.cwd(),
            "public",
            "generated-image.png"
          );
          fs.writeFileSync(imagePath, buffer);
          console.log("Image saved as generated-image.png");

          return { imageUrl: "/generated-image.png" };
        } else {
          throw new Error("Image data is missing in the response");
        }
      } else {
        throw new Error("No valid parts found in the response");
      }
    } else {
      throw new Error("No candidates returned from the model");
    }
  } catch (error) {
    console.error("Erro ao gerar imagem:", error);
    throw error;
  }
}
/**
 * Tenta gerar a imagem com diferentes estratégias de prompt, usando GPT-Image-1.
 */
async function generateImageWithFallbacks(formData: any) {
  const prompts = [
    buildDetailedImagePrompt(formData),
    // buildConservativePrompt(formData),
    // buildFallbackPrompt()
  ];

  console.log('Tentando gerar imagem com Gemini...');

  for (let i = 0; i < prompts.length; i++) {
    const currentPrompt = prompts[i];
    try {
      console.log(`Tentativa ${i + 1} com Gemini, prompt: "${currentPrompt.substring(0, 100)}..."`);
      const response = await generateImage(currentPrompt);

      if (response.imageUrl) {
        console.log(`Sucesso na tentativa ${i + 1} com Gemini!`);
        return {
          success: true,
          imageUrl: response.imageUrl,
          promptUsed: currentPrompt,
          attemptNumber: i + 1,
          model: 'gemini-2.0-flash-preview-image-generation',
          quality: 'high',
          size: '1080x1080',
          output_format: 'png'
        };
      }
    } catch (error) {
      console.warn(`Falha na tentativa ${i + 1} com Gemini.`);
      console.warn(`Erro: ${error.message}`);

      if (error.message?.includes('content policy') || error.message?.includes('safety')) {
        console.log('Violação de política de conteúdo detectada. Tentando próximo prompt de fallback...');
        continue;
      }
      if (error.message?.includes('quota') || error.message?.includes('limit')) {
        throw new Error('Limite de requisições excedido. Tente novamente em alguns minutos.');
      }
      if (error.message?.includes('authentication') || error.message?.includes('unauthorized')) {
        throw new Error('Chave da API inválida ou não autorizada para Gemini.');
      }
      if (error.message?.includes('not found') || error.message?.includes('model')) {
        throw new Error('Modelo Gemini não encontrado. Verifique se sua conta tem acesso.');
      }

      // Se é o último prompt, propagar o erro
      if (i === prompts.length - 1) {
        throw error;
      }
    }
  }
  return {
    success: false,
    error: 'Todos os prompts falharam. O prompt detalhado pode ter violado as políticas de conteúdo e os prompts de fallback não foram suficientes.'
  };
}

/**
 * Gera texto usando GPT-4o-mini
 */
async function generateTextContent(formData: any) {
  const textPrompt = `
Você é um copywriter especialista em mídias sociais. Crie conteúdo para um post baseado nas informações abaixo:

MARCA: ${cleanInput(formData.brand)}
TEMA: ${cleanInput(formData.theme)}
PLATAFORMA: ${cleanInput(formData.platform)}
OBJETIVO: ${cleanInput(formData.objective)}
DESCRIÇÃO DA IMAGEM: ${cleanInput(formData.prompt)}
PÚBLICO-ALVO: ${cleanInput(formData.audience)}
${cleanInput(formData.persona) ? `PERSONA: ${cleanInput(formData.persona)}` : ''}
TOM DE VOZ: ${cleanInput(formData.tone)}

INSTRUÇÕES:
- Crie um título chamativo (máximo 60 caracteres)
- Escreva uma legenda envolvente com quebras de linha estratégicas
- Inclua um CTA (call-to-action) claro
- Sugira 6-8 hashtags relevantes em português (sem o símbolo #)

RESPONDA APENAS COM UM JSON VÁLIDO NO SEGUINTE FORMATO:
{
  "title": "título aqui",
  "body": "legenda aqui\\ncom quebras de linha\\n\\nCTA aqui",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5", "hashtag6"]
}
`;

  try {
    console.log('Enviando prompt para GPT-4o-mini...');
    const chatCompletion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: textPrompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 1000
    });

    const rawContent = chatCompletion.choices[0].message.content;
    console.log('Resposta recebida do GPT-4o-mini:', rawContent);

    if (!rawContent) {
      throw new Error("Resposta vazia do GPT-4o-mini");
    }

    let postContent;
    try {
      postContent = JSON.parse(rawContent);
    } catch (jsonError) {
      console.error('Erro ao fazer parse do JSON:', jsonError);
      console.error('Conteúdo recebido:', rawContent);
      throw new Error("JSON inválido recebido do GPT-4o-mini");
    }

    // Validação mais robusta do conteúdo
    if (!postContent || typeof postContent !== 'object') {
      throw new Error("Conteúdo não é um objeto válido");
    }

    if (!postContent.title || typeof postContent.title !== 'string') {
      throw new Error("Título ausente ou inválido");
    }

    if (!postContent.body || typeof postContent.body !== 'string') {
      throw new Error("Corpo da mensagem ausente ou inválido");
    }

    if (!Array.isArray(postContent.hashtags) || postContent.hashtags.length === 0) {
      throw new Error("Hashtags ausentes ou inválidas");
    }

    console.log('Conteúdo validado com sucesso');
    
    // Limpa as hashtags para garantir que não tenham caracteres especiais
    postContent.hashtags = postContent.hashtags.map((tag: string) => 
      String(tag).replace(/[^a-zA-Z0-9áéíóúàèìòùâêîôûãõç]/g, '').toLowerCase()
    ).filter((tag: string) => tag.length > 0);
    
    return postContent;

  } catch (error) {
    console.error('Erro na geração de texto:', error);
    
    // Fallback com conteúdo padrão mais personalizado
    const brandName = cleanInput(formData.brand) || 'nossa marca';
    const themeName = cleanInput(formData.theme) || 'novidades';
    const platform = cleanInput(formData.platform) || 'redes sociais';
    
    return {
      title: `${brandName}: ${themeName}`,
      body: `🌟 Descubra o que preparamos especialmente para você!\n\n${cleanInput(formData.objective) || 'Conteúdo exclusivo'} no ${platform}.\n\n👉 Não perca essa oportunidade!`,
      hashtags: [
        "marketing", 
        "conteudo", 
        brandName.toLowerCase().replace(/\s+/g, ''),
        themeName.toLowerCase().replace(/\s+/g, ''),
        "inovacao", 
        "qualidade",
        "digital",
        "estrategia"
      ].filter(tag => tag.length > 0).slice(0, 8)
    };
  }
}

/**
 * Handler da rota POST
 */
export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'Chave da API OpenAI não configurada no servidor.' }, { status: 500 });
    }

    const formData = await req.json();
    console.log('Dados recebidos:', formData);

    if (!formData.prompt) {
      return NextResponse.json({ error: 'A descrição da imagem é obrigatória.' }, { status: 400 });
    }

    // --- 1. GERAÇÃO DA IMAGEM COM GEMINI E FALLBACKS ---
    console.log('Iniciando geração de imagem com Gemini...');
    const imageResult = await generateImageWithFallbacks(formData);

    if (!imageResult.success) {
      return NextResponse.json({
        error: imageResult.error || 'Não foi possível gerar a imagem com Gemini. Tente uma descrição diferente.'
      }, { status: 400 });
    }

    // --- 2. GERAÇÃO DO TEXTO COM GPT-4O-MINI ---
    console.log('Iniciando geração de texto com GPT-4o-mini...');
    const postContent = await generateTextContent(formData);

    // --- 3. RETORNO DA RESPOSTA COMPLETA ---
    return NextResponse.json({
      imageUrl: imageResult.imageUrl,
      title: postContent.title,
      body: postContent.body,
      hashtags: postContent.hashtags,
      debug: {
        model: imageResult.model,
        quality: imageResult.quality,
        size: imageResult.size,
        output_format: imageResult.output_format,
        promptUsed: imageResult.promptUsed,
        attemptNumber: imageResult.attemptNumber,
        originalData: formData
      }
    });

  } catch (error) {
    console.error('Erro geral na rota /api/generate-image:', error);
    let errorMessage = "Ocorreu um erro interno no servidor.";
    let statusCode = 500;
    if (error instanceof Error) {
      errorMessage = error.message;
      if (error.message.includes('Limite de requisições')) statusCode = 429;
      else if (error.message.includes('não autorizada') || error.message.includes('inválida')) statusCode = 401;
      else if (error.message.includes('não encontrado')) statusCode = 404;
    }
    return NextResponse.json({
      error: errorMessage,
      model: 'gemini-2.0-flash-preview-image-generation',
      timestamp: new Date().toISOString()
    }, { status: statusCode });
  }
}