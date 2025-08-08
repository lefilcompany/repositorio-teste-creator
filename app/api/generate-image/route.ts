// app/api/generate-image/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

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
function cleanInput(text: string | undefined | null): string {
  if (!text) return '';
  // Remove apenas caracteres potencialmente perigosos para a sintaxe do prompt.
  let cleanedText = text.replace(/[<>{}[\]"'`]/g, '');
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
  const tone = cleanInput(formData.tone);
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
  if (tone) {
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
    const mappedTone = toneMap[tone.toLowerCase()] || `com uma estética ${tone}`;
    promptParts.push(`O clima da imagem é ${mappedTone}`);
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
  if (additionalInfo) promptParts.push(`Incorporando os seguintes elementos visuais: ${additionalInfo}`);

  // 7. Palavras-chave de Reforço e "Prompt Negativo"
  promptParts.push("Qualidade final: resolução 8K, UHD, iluminação cinematográfica e volumétrica. Importante: evite texto, marcas d'água, logotipos (a menos que solicitado na descrição), artefatos digitais e desfoque. A imagem deve ter qualidade de premiação e ser adequada para Getty Images e Behance.");

  const finalPrompt = promptParts.join('. ');
  return finalPrompt.length > MAX_PROMPT_LENGTH ? finalPrompt.substring(0, MAX_PROMPT_LENGTH) : finalPrompt;
}

/**
 * Prompt alternativo mais conservador.
 */
function buildConservativePrompt(formData: any): string {
  const description = cleanInput(formData.prompt);
  const brand = cleanInput(formData.brand);
  const platform = cleanInput(formData.platform);

  let prompt = "Fotografia comercial profissional, fundo limpo, iluminação natural suave, alta qualidade, realista, pronta para marketing";
  if (description) prompt += `, apresentando uma visão de: ${description.split(' ').slice(0, 25).join(' ')}`;
  if (brand) prompt += ` para a marca ${brand}`;
  if (platform) prompt += ` otimizado para a plataforma ${platform}`;
  prompt += ", estética moderna e visualmente agradável.";
  return prompt;
}

/**
 * Prompt de emergência ultra-conservador.
 */
function buildFallbackPrompt(): string {
  return "Fotografia comercial profissional, fundo minimalista e limpo, iluminação natural suave, alta resolução, foco no produto, pronto para marketing, composição simples e clara.";
}

/**
 * Interface para parâmetros específicos do GPT-Image-1
 */
interface GPTImage1Params {
  prompt: string;
  model: 'gpt-image-1';
  background?: 'auto' | 'transparent' | 'opaque';
  quality?: 'low' | 'medium' | 'high' | 'auto';
  size?: '1024x1024' | '1792x1024' | '1024x1792';
  output_format?: 'png' | 'jpeg';
  moderation?: 'auto' | 'low';
  n?: number;
}

/**
 * Função específica para gerar imagens com GPT-Image-1
 */
async function generateImageWithGPTImage1(prompt: string, quality: 'low' | 'medium' | 'high' | 'auto' = 'high'): Promise<any> {
  try {
    console.log(`Gerando imagem com GPT-Image-1, prompt: "${prompt.substring(0, 100)}..."`);
    const imageParams: GPTImage1Params = {
      model: 'gpt-image-1',
      prompt,
      background: 'transparent',
      n: 1,
      quality,
      size: '1024x1024',
      output_format: 'png',
      moderation: 'auto',
    };
    const response = await openai.images.generate(imageParams);
    return response;
  } catch (error) {
    console.error('Erro na geração com GPT-Image-1:', error);
    throw error;
  }
}

/**
 * Tenta gerar a imagem com diferentes estratégias de prompt, usando GPT-Image-1.
 */
async function generateImageWithFallbacks(formData: any) {
  const prompts = [
    buildDetailedImagePrompt(formData),
    buildConservativePrompt(formData),
    buildFallbackPrompt()
  ];

  console.log('Tentando gerar imagem com GPT-Image-1...');

  for (let i = 0; i < prompts.length; i++) {
    const currentPrompt = prompts[i];
    try {
      console.log(`Tentativa ${i + 1} com GPT-Image-1, prompt: "${currentPrompt.substring(0, 100)}..."`);
      const quality: 'low' | 'medium' | 'high' | 'auto' = 'medium';
      const response = await generateImageWithGPTImage1(currentPrompt, quality);
      const base64 = response.data[0]?.b64_json;
      if (base64) {
        const imageUrl = `data:image/png;base64,${base64}`;
        console.log(`Sucesso na tentativa ${i + 1} com GPT-Image-1!`);
        return {
          success: true,
          imageUrl,
          promptUsed: currentPrompt,
          attemptNumber: i + 1,
          model: 'gpt-image-1',
          background: 'transparent',
          quality,
          size: '1024x1024',
          output_format: 'png',
          moderation: 'auto'
        };
      }
    } catch (error) {
      console.warn(`Falha na tentativa ${i + 1} com GPT-Image-1.`);
      if (error instanceof OpenAI.APIError) {
        console.warn(`Erro da API GPT-Image-1: ${error.status} - ${error.message}`);
        if (error.code === 'content_policy_violation' || (error.status === 400 && error.message?.includes('content policy'))) {
          console.log('Violação de política de conteúdo detectada. Tentando próximo prompt de fallback...');
          continue; // Tenta o próximo prompt. Esta é a nossa principal defesa agora.
        }
        if (error.status === 429) throw new Error('Limite de requisições excedido. Tente novamente em alguns minutos.');
        if (error.status === 401) throw new Error('Chave da API inválida ou não autorizada para GPT-Image-1.');
        if (error.status === 404) throw new Error('Modelo GPT-Image-1 não encontrado. Verifique se sua conta tem acesso.');
        throw new Error(`Erro da API GPT-Image-1: ${error.message}`);
      }
      throw error;
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
# Persona: Copywriter e Estrategista de Conteúdo Sênior especializado em ${cleanInput(formData.platform) || 'redes sociais'}.
## Missão: Criar conteúdo textual para um post de mídia social altamente engajador e estratégico.
## Contexto:
- **Marca**: ${cleanInput(formData.brand)}
- **Tema**: ${cleanInput(formData.theme)}
- **Plataforma**: ${cleanInput(formData.platform)}
- **Objetivo**: ${cleanInput(formData.objective)}
- **Descrição Visual da Imagem Gerada**: ${cleanInput(formData.prompt)}
- **Público**: ${cleanInput(formData.audience)}
- **Tom**: ${cleanInput(formData.tone)}
## Tarefa:
Responda ESTRITAMENTE em formato JSON com as chaves "title", "body", e "hashtags" (um array de 6 a 8 strings, cada uma sem o caractere '#').
A legenda ("body") deve ter quebras de linha (use \\n), ser envolvente e incluir um CTA (Call to Action) claro.
As hashtags devem ser específicas, relevantes para o conteúdo e em português.
`;

  try {
    const chatCompletion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: textPrompt }],
      response_format: { type: "json_object" },
      temperature: 0.8,
      max_tokens: 1500
    });

    const rawContent = chatCompletion.choices[0].message.content;
    const postContent = JSON.parse(rawContent || '{}');

    if (!postContent.title || !postContent.body || !Array.isArray(postContent.hashtags)) {
      throw new Error("Formato de JSON inválido recebido do GPT-4o-mini.");
    }
    return postContent;
  } catch (parseError) {
    console.warn('Erro ao gerar/parsear conteúdo com GPT-4o-mini:', parseError);
    return {
      title: `Conteúdo para ${cleanInput(formData.brand) || 'Sua Marca'}`,
      body: `Aqui está uma sugestão de conteúdo para sua campanha sobre "${cleanInput(formData.theme) || 'novidades'}".\n\nDescubra mais sobre nossos produtos e serviços!\n\n#VemConhecer`,
      hashtags: ["marketingdigital", "conteudo", "estrategia", "suamarca", "inovacao", "qualidade"]
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

    // --- 1. GERAÇÃO DA IMAGEM COM GPT-IMAGE-1 E FALLBACKS ---
    console.log('Iniciando geração de imagem com GPT-Image-1...');
    const imageResult = await generateImageWithFallbacks(formData);

    if (!imageResult.success) {
      return NextResponse.json({
        error: imageResult.error || 'Não foi possível gerar a imagem com GPT-Image-1. Tente uma descrição diferente.'
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
        background: imageResult.background,
        quality: imageResult.quality,
        size: imageResult.size,
        output_format: imageResult.output_format,
        moderation: imageResult.moderation,
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
      model: 'gpt-image-1',
      timestamp: new Date().toISOString()
    }, { status: statusCode });
  }
}