// app/api/generate-image/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Inicializa o cliente da OpenAI com configurações específicas para GPT-Image-1
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MAX_PROMPT_LENGTH = 3950;

/**
 * Lista de palavras que podem causar problemas com o sistema de segurança da OpenAI.
 * Priorizar substituições em vez de remoção, quando possível.
 */
const RESTRICTED_WORDS = [
  // Violência explícita
  'sangue', 'morte', 'matar', 'ferimento', 'machucado',
  // Conteúdo sexual explícito
  'nude', 'nudez', 'sexual', 'sexo', 'erótico', 'provocante', 'sensual', 'íntimo',
  // Drogas ilegais
  'cocaína', 'heroína', 'maconha', 'cannabis',
  // Armas específicas
  'pistola', 'revólver', 'metralhadora', 'bomba', 'explosivo',
  // Marcas protegidas específicas
  'disney', 'marvel', 'coca-cola', 'nike', 'apple', 'google', 'microsoft',
];

/**
 * Mapa de substituições inteligentes para termos sensíveis.
 */
const WORD_REPLACEMENTS: { [key: string]: string } = {
  'criança': 'jovem pessoa',
  'crianças': 'jovens pessoas',
  'menor': 'jovem',
  'menores': 'jovens',
  'bebê': 'pequena pessoa',
  'infantil': 'juvenil',
  'álcool': 'bebida',
  'cerveja': 'bebida gelada',
  'vinho': 'bebida elegante',
  'cigarro': 'produto para adultos',
  'fumar': 'estilo de vida adulto',
  'religião': 'espiritualidade',
  'religioso': 'espiritual',
  'deus': 'divindade',
  'jesus': 'figura espiritual',
  'allah': 'divindade',
  'político': 'institucional',
  'política': 'institucional',
  'governo': 'institucional',
  'presidente': 'líder',
  'ministro': 'autoridade',
  'droga': 'substância',
  'armas': 'ferramentas',
  'violência': 'conflito',
  'agressivo': 'intenso',
  'morte': 'fim de ciclo',
  'matar': 'neutralizar',
  'ferimento': 'dano',
  'machucado': 'lesão',
  'nudez': 'forma humana',
  'sexual': 'romântico',
  'sexo': 'intimidade',
  'erótico': 'artístico',
  'provocante': 'sugestivo',
  'sensual': 'elegante',
  'íntimo': 'pessoal',
  'eleição': 'campanha',
  'votação': 'escolha popular',
  'partido político': 'grupo cívico',
};

/**
 * Sanitiza o texto de forma inteligente.
 */
function sanitizeText(text: string): string {
  if (!text) return '';
  let sanitized = text.toLowerCase();

  Object.entries(WORD_REPLACEMENTS).forEach(([word, replacement]) => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    sanitized = sanitized.replace(regex, replacement);
  });

  RESTRICTED_WORDS.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    sanitized = sanitized.replace(regex, '');
  });

  sanitized = sanitized.replace(/[<>{}[\]"'`]/g, '');
  sanitized = sanitized.replace(/\s+/g, ' ').trim();
  return sanitized;
}

/**
 * Constrói um prompt detalhado e otimizado para GPT-Image-1.
 */
function buildDetailedImagePrompt(formData: any): string {
    const cleanDescription = sanitizeText(formData.prompt || '');
    const cleanBrand = sanitizeText(formData.brand || '');
    const cleanTheme = sanitizeText(formData.theme || '');
    const cleanObjective = sanitizeText(formData.objective || '');
    const cleanPlatform = sanitizeText(formData.platform || '');
    const cleanAudience = sanitizeText(formData.audience || '');
    const cleanTone = sanitizeText(formData.tone || '');
    const cleanAdditionalInfo = sanitizeText(formData.additionalInfo || '');
  
    let prompt = "Ultra-photorealistic commercial photography, 8K resolution, cinematic lighting, sharp focus, intricate details, natural textures, professional studio setup, award-winning composition, realistic rendering";
  
    if (cleanDescription.length > 5) prompt += `, featuring a scene with: ${cleanDescription}`;
    if (cleanBrand.length > 2) prompt += `, representing the ${cleanBrand} brand identity, showcasing its values and aesthetic`;
    if (cleanTheme.length > 3) prompt += `, aligned with the ${cleanTheme} strategic theme, conveying its core message`;
    if (cleanObjective.length > 5) prompt += `, designed to ${cleanObjective}, aiming for strong visual impact`;
  
    const platformStyles: { [key: string]: string } = {
      'instagram': 'square format 1:1, vibrant colors, social media optimized, engaging composition, perfect for Instagram feed',
      'facebook': 'engaging composition, community focused, social sharing optimized, suitable for Facebook campaigns',
      'linkedin': 'professional aesthetic, corporate style, business oriented, ideal for LinkedIn posts',
      'twitter': 'clean design, attention-grabbing, minimal text overlay, optimized for Twitter/X visibility',
      'x': 'clean design, attention-grabbing, minimal text overlay, optimized for Twitter/X visibility',
      'tiktok': 'vertical format 9:16, dynamic composition, youthful energy, trending visual style, perfect for TikTok',
      'youtube': 'thumbnail style, high contrast, eye-catching, optimized for YouTube click-through rates'
    };
    if (cleanPlatform && platformStyles[cleanPlatform.toLowerCase()]) {
      prompt += `, ${platformStyles[cleanPlatform.toLowerCase()]}`;
    }
  
    if (cleanTone.length > 3) {
      const toneMap: { [key: string]: string } = {
        'inspirador': 'inspirational mood, uplifting atmosphere, motivational lighting, evoking positive emotions',
        'motivacional': 'motivational energy, dynamic composition, energetic colors, encouraging action',
        'profissional': 'professional tone, clean aesthetic, business appropriate, conveying trust and expertise',
        'casual': 'casual atmosphere, relaxed mood, approachable style, friendly and inviting',
        'elegante': 'elegant style, sophisticated look, refined composition, luxurious and premium feel',
        'moderno': 'modern design, contemporary feel, cutting-edge aesthetic, innovative and fresh',
        'tradicional': 'classic style, timeless appeal, traditional values, conveying heritage and reliability',
        'divertido': 'playful mood, cheerful atmosphere, vibrant energy, fun and engaging',
        'sério': 'serious tone, formal presentation, authoritative mood, conveying gravity and importance'
      };
      const mappedTone = toneMap[cleanTone.toLowerCase()] || `${cleanTone} aesthetic`;
      prompt += `, with a ${mappedTone}`;
    }
  
    if (cleanAudience.length > 5) prompt += `, specifically appealing to ${cleanAudience}, considering their demographics and interests`;
    if (cleanAdditionalInfo.length > 5) prompt += `, incorporating specific visual elements: ${cleanAdditionalInfo}`;
  
    prompt += ", commercial quality, marketing ready, professional composition, hyper-realistic, volumetric lighting, cinematic depth of field, award-winning photography, trending on ArtStation, Behance, and Getty Images.";
  
    return prompt.length > MAX_PROMPT_LENGTH ? prompt.substring(0, MAX_PROMPT_LENGTH) : prompt;
}

/**
 * Prompt alternativo mais conservador.
 */
function buildConservativePrompt(formData: any): string {
    const cleanDescription = sanitizeText(formData.prompt || '');
    const cleanBrand = sanitizeText(formData.brand || '');
    const cleanPlatform = sanitizeText(formData.platform || '');

    let prompt = "Professional commercial photography, clean background, soft natural lighting, high quality, realistic, marketing ready";
    if (cleanDescription.length > 5) prompt += `, featuring: ${cleanDescription.split(' ').slice(0, 20).join(' ')}`;
    if (cleanBrand.length > 2) prompt += ` for the brand ${cleanBrand}`;
    if (cleanPlatform.length > 2) prompt += ` optimized for ${cleanPlatform} platform`;
    prompt += ", modern aesthetic, visually appealing.";
    return prompt;
}

/**
 * Prompt de emergência ultra-conservador.
 */
function buildFallbackPrompt(): string {
  return "Professional commercial photography, minimal clean background, soft natural lighting, high resolution, product focused, marketing ready, simple and clear composition.";
}

/**
 * Interface para parâmetros específicos do GPT-Image-1
 */
interface GPTImage1Params {
  prompt: string;
  model: 'gpt-image-1';
  background?: 'auto' | 'transparent' | 'opaque';
  quality?: 'low' | 'medium' | 'high' | 'auto'; // Corrigido para valores válidos
  size?: '1024x1024' | '1792x1024' | '1024x1792';
  output_format?: 'png' | 'jpeg';
  moderation?: 'auto' | 'low'; // Corrigido para atender ao tipo esperado
  n?: number;
}

/**
 * Função específica para gerar imagens com GPT-Image-1
 */
async function generateImageWithGPTImage1(prompt: string, quality: 'low' | 'medium' | 'high' | 'auto' = 'high'): Promise<any> {
  try {
    console.log(`Gerando imagem com GPT-Image-1, prompt: "${prompt.substring(0, 100)}..."`);

    // Parâmetros otimizados para GPT-Image-1
    const imageParams: GPTImage1Params = {
      model: 'gpt-image-1',
      prompt: prompt,
      background: 'auto', 
      n: 1,
      quality: quality, // Ajustado para valores válidos
      size: '1024x1024',
      output_format: 'png',
      moderation: 'auto',
    };

    // Chama a API usando a sintaxe correta para GPT-Image-1
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

      // Usa qualidade alta na primeira tentativa, média nas demais para economizar créditos
      const quality: 'low' | 'medium' | 'high' | 'auto' = i === 0 ? 'high' : 'medium';
      const response = await generateImageWithGPTImage1(currentPrompt, quality);

      const imageUrl = response.data[0]?.url;
      if (imageUrl) {
        console.log(`Sucesso na tentativa ${i + 1} com GPT-Image-1!`);
        return {
          success: true,
          imageUrl: imageUrl,
          promptUsed: currentPrompt,
          attemptNumber: i + 1,
          model: 'gpt-image-1',
          background: 'auto',
          quality: quality,
          size: '1024x1024',
          output_format: 'png',
          moderation: 'auto'
        };
      }
    } catch (error) {
      console.warn(`Falha na tentativa ${i + 1} com GPT-Image-1.`);

      if (error instanceof OpenAI.APIError) {
        console.warn(`Erro da API GPT-Image-1: ${error.status} - ${error.message}`);

        // Verifica códigos de erro específicos do GPT-Image-1
        if (error.code === 'content_policy_violation' || 
            error.status === 400 && error.message?.includes('content policy')) {
          console.log('Violação de política de conteúdo, tentando próximo prompt...');
          continue; // Tenta o próximo prompt de fallback
        }

        // Erros relacionados ao modelo ou quota
        if (error.status === 429) {
          throw new Error('Limite de requisições excedido. Tente novamente em alguns minutos.');
        }

        if (error.status === 401) {
          throw new Error('Chave da API inválida ou não autorizada para GPT-Image-1.');
        }

        if (error.status === 404) {
          throw new Error('Modelo GPT-Image-1 não encontrado. Verifique se sua conta tem acesso.');
        }

        // Outros erros da API
        throw new Error(`Erro da API GPT-Image-1: ${error.message}`);
      }

      // Erro inesperado
      throw error;
    }
  }

  // Se todos os prompts falharem
  return { 
    success: false, 
    error: 'Todos os prompts falharam devido a restrições de conteúdo ou outros erros do GPT-Image-1.' 
  };
}

/**
 * Gera texto usando GPT-4o-mini
 */
async function generateTextContent(formData: any) {
  const textPrompt = `
    # Persona: Copywriter e Estrategista de Conteúdo Sênior especializado em ${sanitizeText(formData.platform || 'redes sociais')}.
    ## Missão: Criar conteúdo textual para um post de mídia social altamente engajador e estratégico.
    ## Contexto:
    - **Marca**: ${sanitizeText(formData.brand || '')}
    - **Tema**: ${sanitizeText(formData.theme || '')}
    - **Plataforma**: ${sanitizeText(formData.platform || '')}
    - **Objetivo**: ${sanitizeText(formData.objective || '')}
    - **Descrição Visual**: ${sanitizeText(formData.prompt || '')}
    - **Público**: ${sanitizeText(formData.audience || '')}
    - **Tom**: ${sanitizeText(formData.tone || '')}
    ## Tarefa:
    Responda ESTRITAMENTE em formato JSON com as chaves "title", "body", e "hashtags" (array de 6-8 strings sem '#').
    A legenda ("body") deve ter quebras de linha (\\n), ser envolvente e incluir um CTA claro.
    As hashtags devem ser específicas e relevantes.
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
    
    // Validação robusta do conteúdo gerado
    if (!postContent.title || !postContent.body || !Array.isArray(postContent.hashtags)) {
        throw new Error("Formato de JSON inválido recebido do GPT-4o-mini.");
    }
    
    return postContent;
  } catch (parseError) {
    console.warn('Erro ao gerar/parsear conteúdo com GPT-4o-mini:', parseError);
    // Fallback com conteúdo padrão
    return {
        title: `Conteúdo para ${formData.brand || 'Sua Marca'}`,
        body: `Aqui está uma sugestão de conteúdo para sua campanha sobre "${formData.theme || 'novidades'}".\\n\\nDescubra mais sobre nossos produtos e serviços!\\n\\n#VemConhecer`,
        hashtags: ["marketingdigital", "conteudo", "estrategia", "suamarca", "inovacao", "qualidade"]
    };
  }
}

/**
 * Handler da rota POST
 */
export async function POST(req: NextRequest) {
  try {
    // Verificação da chave da API
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ 
        error: 'Chave da API OpenAI não configurada no servidor.' 
      }, { status: 500 });
    }

    const formData = await req.json();
    console.log('Dados recebidos:', formData);

    if (!formData.prompt) {
      return NextResponse.json({ 
        error: 'A descrição da imagem é obrigatória.' 
      }, { status: 400 });
    }

    // --- 1. GERAÇÃO DA IMAGEM COM GPT-IMAGE-1 ---
    console.log('Iniciando geração de imagem com GPT-Image-1...');
    const imageResult = await generateImageWithFallbacks(formData);

    if (!imageResult.success) {
      return NextResponse.json({
        error: imageResult.error || 'Não foi possível gerar a imagem com GPT-Image-1. Tente uma descrição mais neutra.'
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
      
      // Ajusta código de status baseado no tipo de erro
      if (error.message.includes('Limite de requisições')) {
        statusCode = 429;
      } else if (error.message.includes('não autorizada') || error.message.includes('inválida')) {
        statusCode = 401;
      } else if (error.message.includes('não encontrado')) {
        statusCode = 404;
      }
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      model: 'gpt-image-1',
      timestamp: new Date().toISOString()
    }, { status: statusCode });
  }
}