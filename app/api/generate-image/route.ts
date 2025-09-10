// app/api/generate-image/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { GoogleGenAI, Modality } from "@google/genai";
import { prisma } from "@/lib/prisma";
import { ActionType } from "@prisma/client";

// Inicializa o cliente da OpenAI com suas configurações.
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MAX_PROMPT_LENGTH = 5000;

/**
 * Converte dados de imagem base64 para data URL
 */
function createImageDataUrl(
  base64Data: string,
  mimeType: string = "image/png"
): string {
  return `data:${mimeType};base64,${base64Data}`;
}

/**
 * Limpa o texto de entrada de forma mínima, removendo apenas caracteres
 * que podem corromper a sintaxe do prompt e normalizando espaços em branco.
 * NÃO remove palavras nem faz substituições, preservando a intenção original do usuário.
 */
function cleanInput(text: string | string[] | undefined | null): string {
  if (!text) return "";

  // Se for um array, junta os elementos com vírgula
  if (Array.isArray(text)) {
    return text.map((item) => cleanInput(item)).join(", ");
  }

  // Converte para string se não for
  const textStr = String(text);

  // Remove apenas caracteres potencialmente perigosos para a sintaxe do prompt.
  let cleanedText = textStr.replace(/[<>{}[\]"'`]/g, "");
  // Normaliza múltiplos espaços para apenas um e remove espaços nas pontas.
  cleanedText = cleanedText.replace(/\s+/g, " ").trim();
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
  const tones = Array.isArray(formData.tone)
    ? formData.tone
    : formData.tone
      ? [formData.tone]
      : [];
  const persona = cleanInput(formData.persona);
  const additionalInfo = cleanInput(formData.additionalInfo);

  let promptParts: string[] = [];

  // 0. Marca e Tema sempre explícitos no início
  if (brand && theme) {
    promptParts.push(
      `Imagem publicitária criada para a marca "${brand}", destacando o tema "${theme}".`
    );
  } else if (brand) {
    promptParts.push(`Imagem comercial para a marca "${brand}".`);
  } else if (theme) {
    promptParts.push(`Imagem temática sobre "${theme}".`);
  }

  // 1. Assunto Principal e Qualidade Central
  if (description) {
    promptParts.push(
      `Uma obra-prima de fotografia comercial, hiper-detalhada e fotorrealista de: ${description}`
    );
  }

  // 2. Contexto Estratégico (Marca, Tema, Objetivo) — reforço
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
      inspirador:
        "banhado em uma luz quente da golden hour, criando uma atmosfera edificante e motivacional, com sombras suaves",
      motivacional:
        "energia dinâmica capturada com cores vibrantes e um leve motion blur para encorajar a ação",
      profissional:
        "estética corporativa limpa, com iluminação de estúdio neutra e foco nítido, transmitindo confiança e expertise",
      casual:
        "atmosfera relaxada com iluminação natural e suave, como a de uma janela, criando um ambiente amigável e convidativo",
      elegante:
        "estilo sofisticado com uma paleta de cores refinada, iluminação suave e composição minimalista para um toque luxuoso",
      moderno:
        "design contemporâneo com linhas arrojadas, iluminação de alto contraste e uma estética de vanguarda",
      tradicional:
        "apelo atemporal com cores clássicas, iluminação equilibrada e composição simétrica, transmitindo herança e confiabilidade",
      divertido:
        "humor divertido capturado com cores saturadas, iluminação brilhante e uma composição lúdica e energética",
      sério:
        "tom formal com iluminação dramática (chiaroscuro), sombras profundas e uma apresentação imponente para transmitir gravidade",
    };
    const mappedTones = tones
      .map((tone) => {
        const cleanTone = cleanInput(tone);
        return (
          toneMap[cleanTone.toLowerCase()] || `com uma estética ${cleanTone}`
        );
      })
      .join(", ");
    promptParts.push(`O clima da imagem é uma combinação de: ${mappedTones}`);
  }

  // 4. Detalhes Técnicos da Câmera
  promptParts.push(
    "Detalhes técnicos: foto tirada com uma câmera DSLR profissional (como uma Canon EOS R5) e uma lente de 85mm f/1.4, resultando em uma profundidade de campo rasa e um belo efeito bokeh no fundo"
  );

  // 5. Otimização para Plataforma
  const platformStyles: { [key: string]: string } = {
    instagram:
      "formato quadrado 1:1, cores vibrantes, otimizado para feed do Instagram",
    facebook:
      "composição envolvente, focada na comunidade, otimizada para compartilhamento social",
    linkedin:
      "estética profissional e corporativa, ideal para posts de negócios",
    twitter:
      "design limpo e chamativo, otimizado para visibilidade no Twitter/X",
    x: "design limpo e chamativo, otimizado para visibilidade no Twitter/X",
    tiktok:
      "formato vertical 9:16, composição dinâmica e energia jovem, perfeito para TikTok",
    youtube:
      "estilo thumbnail de alto contraste, otimizado para taxas de clique no YouTube",
  };
  if (platform && platformStyles[platform.toLowerCase()]) {
    promptParts.push(
      `Otimizado para a plataforma: ${platformStyles[platform.toLowerCase()]}`
    );
  }

  // 6. Público-Alvo e Informações Adicionais
  if (audience)
    promptParts.push(`Direcionado especificamente para ${audience}`);
  if (persona) promptParts.push(`Conectando-se com a persona de ${persona}`);
  if (additionalInfo)
    promptParts.push(
      `Incorporando os seguintes elementos visuais: ${additionalInfo}`
    );

  // 7. Palavras-chave de Reforço e "Prompt Negativo"
  promptParts.push(
    `Esta imagem é para um anúncio da marca "${brand}" sobre o tema "${theme}".`
  );

  const finalPrompt = promptParts.join(". ");
  return finalPrompt.length > MAX_PROMPT_LENGTH
    ? finalPrompt.substring(0, MAX_PROMPT_LENGTH)
    : finalPrompt;
}

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API,
});

async function generateImage(
  prompt: string,
  referenceImage?: string,
  actionId?: string
): Promise<any> {
  try {
    // Limitar o tamanho do prompt para evitar erros
    const maxPromptLength = 2000;
    let basePrompt =
      prompt.length > maxPromptLength
        ? prompt.substring(0, maxPromptLength)
        : prompt;

    const fullPrompt = `${basePrompt}. Crie uma imagem profissional para Instagram com alta qualidade visual, design moderno e cores vibrantes.`;

    const contents: any[] = [];
    if (referenceImage) {
      try {
        const [meta, data] = referenceImage.split(",");
        const mimeMatch = meta.match(/data:(image\/[^;]+);base64/);
        contents.push({
          inlineData: {
            data,
            mimeType: mimeMatch ? mimeMatch[1] : "image/png",
          },
        });
      } catch (refError) {}
    }
    contents.push({ text: fullPrompt });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image-preview", 
      contents,
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
        candidateCount: 1,
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

          // Retorna a imagem como data URL em vez de salvar arquivo
          const mimeType = part.inlineData.mimeType || "image/png";
          const dataUrl = createImageDataUrl(imageData, mimeType);

          return {
            imageUrl: dataUrl,
            base64Data: imageData,
            mimeType: mimeType,
          };
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
    throw error;
  }
}

/**
 * Fallback para DALL-E quando Gemini falha
 */
async function generateImageWithDALLE(
  prompt: string,
  actionId?: string
): Promise<any> {
  try {
    // Simplificar o prompt para DALL-E
    const simplePrompt =
      prompt.length > 1000 ? prompt.substring(0, 1000) : prompt;

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: `${simplePrompt}. Professional Instagram post design with high quality and modern aesthetic.`,
      n: 1,
      size: "1024x1024",
      response_format: "b64_json",
    });

    if (response.data && response.data[0] && response.data[0].b64_json) {
      const imageData = response.data[0].b64_json;
      const mimeType = "image/png";
      const dataUrl = createImageDataUrl(imageData, mimeType);

      return {
        imageUrl: dataUrl,
        base64Data: imageData,
        mimeType: mimeType,
      };
    } else {
      throw new Error("No image data returned from DALL-E");
    }
  } catch (error) {
    throw error;
  }
}

/**
 * Tenta gerar a imagem com diferentes estratégias de prompt, usando Gemini e fallback para DALL-E.
 */
async function generateImageWithFallbacks(formData: any, actionId: string) {
  const prompts = [
    buildDetailedImagePrompt(formData),
    // buildConservativePrompt(formData),
    // buildFallbackPrompt()
  ];

  for (let i = 0; i < prompts.length; i++) {
    const currentPrompt = prompts[i];
    try {
      const response = await generateImage(
        currentPrompt,
        formData.referenceImage,
        actionId
      );

      if (response.imageUrl) {
        return {
          success: true,
          imageUrl: response.imageUrl,
          base64Data: response.base64Data,
          mimeType: response.mimeType,
          promptUsed: currentPrompt,
          attemptNumber: i + 1,
          model: "gemini-2.5-flash-preview-image-generation",
          quality: "high",
          size: "1080x1080",
          output_format: "png",
        };
      }
    } catch (error) {
      // Se é erro 500 do Gemini, tenta o DALL-E imediatamente
      if (error.status === 500 || error.message?.includes("INTERNAL")) {
        break;
      }

      if (
        error.message?.includes("content policy") ||
        error.message?.includes("safety")
      ) {
        continue;
      }
      if (
        error.message?.includes("quota") ||
        error.message?.includes("limit")
      ) {
        throw new Error(
          "Limite de requisições excedido. Tente novamente em alguns minutos."
        );
      }
      if (
        error.message?.includes("authentication") ||
        error.message?.includes("unauthorized")
      ) {
        throw new Error("Chave da API inválida ou não autorizada para Gemini.");
      }
      if (
        error.message?.includes("not found") ||
        error.message?.includes("model")
      ) {
        throw new Error(
          "Modelo Gemini não encontrado. Verifique se sua conta tem acesso."
        );
      }

      if (i === prompts.length - 1) {
      }
    }
  }

  // Fallback para DALL-E
  try {
    const response = await generateImageWithDALLE(prompts[0], actionId);
    return {
      success: true,
      imageUrl: response.imageUrl,
      base64Data: response.base64Data,
      mimeType: response.mimeType,
      promptUsed: prompts[0],
      attemptNumber: 1,
      model: "dall-e-3",
      quality: "high",
      size: "1024x1024",
      output_format: "png",
    };
  } catch (dalleError) {}

  return {
    success: false,
    error:
      "Todos os serviços de geração de imagem falharam. Tente novamente em alguns minutos.",
  };
}

/**
 * Gera texto usando GPT-4o-mini
 */
async function generateTextContent(formData: any) {
  // --- PROMPT APRIMORADO E MAIS SEGURO ---
  const cleanedTones = Array.isArray(formData.tone)
    ? formData.tone.map(cleanInput).join(", ")
    : cleanInput(formData.tone);

  const textPrompt = `
# CONTEXTO ESTRATÉGICO
- **Marca/Empresa**: ${cleanInput(formData.brand)}
- **Tema Central**: ${cleanInput(formData.theme)}
- **Plataforma de Publicação**: ${cleanInput(formData.platform)}
- **Objetivo Estratégico**: ${cleanInput(formData.objective)}
- **Descrição Visual da Imagem**: ${cleanInput(formData.prompt)}
- **Público-Alvo**: ${cleanInput(formData.audience)}
- **Persona Específica**: ${cleanInput(formData.persona) || "Não especificada"}
- **Tom de Voz/Comunicação**: ${cleanedTones || "Não especificado"}
- **Informações Complementares**: ${cleanInput(formData.additionalInfo) || "Não informado"}

  # SUA MISSÃO COMO COPYWRITER ESPECIALISTA
  Você é um copywriter especialista em redes sociais com mais de 10 anos de experiência criando conteúdos virais e de alto engajamento. Sua tarefa é criar uma legenda COMPLETA e ENVOLVENTE para a descrição da ${cleanInput(formData.platform)}, seguindo as melhores práticas de marketing digital, storytelling e copywriting.

  # ESTRUTURA IDEAL DA LEGENDA (SIGA RIGOROSAMENTE)

  ## ABERTURA IMPACTANTE (1 linhas)
  - Hook que desperta curiosidade ou emoção
  - Pode ser uma pergunta, declaração ousada, ou estatística impressionante
  - Deve conectar diretamente com a imagem

  ## CALL-TO-ACTION PODEROSO (1-2 linhas)
  - Comando claro e específico
  - Use verbos de ação: "Descubra", "Experimente", "Transforme", "Acesse"
  - Inclua senso de urgência quando apropriado

  ## ELEMENTOS VISUAIS E INTERATIVOS
  - Use emojis estrategicamente (1 por parágrafo máximo)
  - Adicione elementos que incentivem interação

  # DIRETRIZES DE LINGUAGEM E ESTILO

  ## Para Instagram/Facebook:
  - Máximo 2.200 caracteres
  - Primeiro parágrafo até 125 caracteres (antes do "ver mais")
  - Use quebras de linha estratégicas para facilitar leitura
  - Linguagem conversacional e próxima

  ## Para LinkedIn:
  - Máximo 3.000 caracteres
  - Tom mais profissional mas ainda humano
  - Inclua insights e valor educacional
  - Use dados e estatísticas quando relevante

  ## Para TikTok/Reels:
  - Máximo 2.200 caracteres
  - Linguagem jovem e dinâmica
  - Referências a tendências quando apropriado
  - Foco em entretenimento e valor rápido

  # REGRAS TÉCNICAS DE SAÍDA (CRÍTICAS)
  - Resposta EXCLUSIVAMENTE em JSON válido
  - ZERO texto adicional, explicações ou markdown
  - Estrutura EXATA: {"title", "body", "hashtags"}

  ## ESPECIFICAÇÕES:
  - **"title"**: Título magnético de 45-60 caracteres que funcione como headline
  - **"body"**: Legenda completa de 800-1500 caracteres, rica em detalhes e engajamento
  - **"hashtags"**: Array com 8-12 hashtags estratégicas (MIX de nicho + populares)

  ## FORMATAÇÃO DA LEGENDA:
  - Use '\\n\\n' para parágrafos
  - Use '\\n' para quebras simples
  - Máximo 3 emojis por parágrafo
  - Inclua pelo menos 1 pergunta para engajamento
  - Termine com CTA forte e claro

  `;

  try {
    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: textPrompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 1000,
    });

    const rawContent = chatCompletion.choices[0].message.content;

    if (!rawContent) {
      throw new Error("Resposta vazia do GPT-4o-mini");
    }

    const postContent = JSON.parse(rawContent);

    // --- LÓGICA DE CORREÇÃO E VALIDAÇÃO ---
    if (!postContent || typeof postContent !== "object") {
      throw new Error("Conteúdo não é um objeto válido");
    }

    // Se a IA retornar uma string em vez de um array, tentamos corrigir.
    if (typeof postContent.hashtags === "string") {
      postContent.hashtags = postContent.hashtags
        .replace(/#/g, "")
        .split(/[\s,]+/)
        .filter(Boolean);
    }

    if (
      !Array.isArray(postContent.hashtags) ||
      postContent.hashtags.length === 0
    ) {
      throw new Error(
        "Hashtags ausentes ou em formato inválido após tentativa de correção"
      );
    }

    postContent.hashtags = postContent.hashtags
      .map((tag: any) =>
        String(tag)
          .replace(/[^a-zA-Z0-9áéíóúàèìòùâêîôûãõçÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÃÕÇ]/g, "")
          .toLowerCase()
      )
      .filter((tag: string) => tag.length > 0);

    return postContent;
  } catch (error: any) {
    // Fallback com conteúdo personalizado mais rico e envolvente
    const brandName = cleanInput(formData.brand) || "nossa marca";
    const themeName = cleanInput(formData.theme) || "novidades";
    const objective =
      cleanInput(formData.objective) || "trazer inovação e valor";
    const audience = cleanInput(formData.audience) || "nosso público";
    const platform = cleanInput(formData.platform) || "redes sociais";

    // Cria uma legenda rica mesmo no fallback
    const fallbackBody = `🌟 Cada imagem conta uma história, e esta não é diferente!

Quando olhamos para este conteúdo visual, vemos muito mais do que cores e formas. Vemos a essência da ${brandName} se manifestando através de cada detalhe cuidadosamente pensado.

💡 ${themeName.charAt(0).toUpperCase() + themeName.slice(1)} não é apenas um tema - é um convite para explorar novas possibilidades e descobrir como podemos ${objective} de forma única e autêntica.

Nossa conexão com ${audience} vai além das palavras. É uma conversa visual que acontece através de cada elemento desta composição, criando uma experiência que ressoa com quem realmente importa.

🔥 A pergunta é: você está pronto para fazer parte desta jornada?

� Deixe seu comentário e compartilhe suas impressões!
✨ Marque alguém que também precisa ver isso!

#${platform}ready #conteudoautoral`;

    return {
      title: `${brandName}: Descobrindo ${themeName} 🚀`,
      body: fallbackBody,
      hashtags: [
        brandName.toLowerCase().replace(/\s+/g, "").substring(0, 15),
        themeName.toLowerCase().replace(/\s+/g, "").substring(0, 15),
        "conteudovisual",
        "marketingdigital",
        "storytelling",
        "engajamento",
        "estrategia",
        "inspiracao",
        "crescimento",
        "inovacao",
        "conexao",
        "transformacao",
      ]
        .filter((tag) => tag && tag.length > 2)
        .slice(0, 12),
    };
  }
}

/**
 * Handler da rota POST
 */
export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Chave da API OpenAI não configurada no servidor." },
        { status: 500 }
      );
    }

    if (!process.env.GOOGLE_API) {
      return NextResponse.json(
        { error: "Chave da API Google não configurada no servidor." },
        { status: 500 }
      );
    }

    const formData = await req.json();
    const { teamId, brandId, userId, ...actionDetails } = formData;

    // Validação mais detalhada
    const missingFields = [];
    if (!actionDetails.prompt) missingFields.push("prompt");
    if (!teamId) missingFields.push("teamId");
    if (!brandId) missingFields.push("brandId");
    if (!userId) missingFields.push("userId");

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: `Dados obrigatórios ausentes: ${missingFields.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // --- 1. CRIAÇÃO DA AÇÃO PRIMEIRO PARA OBTER O ID ---
    const action = await prisma.action.create({
      data: {
        type: ActionType.CRIAR_CONTEUDO,
        teamId,
        brandId,
        userId,
        details: actionDetails,
        result: null, // Será atualizado após a geração
        status: "Em revisão",
        approved: false,
        revisions: 0,
      },
    });

    // --- 2. GERAÇÃO DA IMAGEM COM GEMINI E FALLBACKS (usando actionId) ---
    const imageResult = await generateImageWithFallbacks(
      actionDetails,
      action.id
    );

    if (!imageResult.success) {
      // Atualiza a ação com erro
      await prisma.action.update({
        where: { id: action.id },
        data: {
          status: "Rejeitada",
          result: {
            error: imageResult.error || "Falha na geração da imagem",
          },
        },
      });

      return NextResponse.json(
        {
          error:
            imageResult.error ||
            "Não foi possível gerar a imagem com Gemini. Tente uma descrição diferente.",
        },
        { status: 400 }
      );
    }

    // --- 3. GERAÇÃO DO TEXTO COM GPT-4O-MINI ---
    const postContent = await generateTextContent(actionDetails);

    // --- 4. ATUALIZAÇÃO DA AÇÃO COM OS RESULTADOS COMPLETOS ---
    const updatedAction = await prisma.action.update({
      where: { id: action.id },
      data: {
        result: {
          imageUrl: `/api/image/${action.id}`, // URL para servir a imagem do banco
          base64Data: imageResult.base64Data, // Dados base64 da imagem
          mimeType: imageResult.mimeType, // Tipo MIME da imagem
          title: postContent.title,
          body: postContent.body,
          hashtags: postContent.hashtags,
        },
      },
    });

    // --- 5. RETORNO DA RESPOSTA COMPLETA ---
    return NextResponse.json({
      imageUrl: imageResult.imageUrl,
      title: postContent.title,
      body: postContent.body,
      hashtags: postContent.hashtags,
      actionId: updatedAction.id,
      debug: {
        model: imageResult.model,
        quality: imageResult.quality,
        size: imageResult.size,
        output_format: imageResult.output_format,
        promptUsed: imageResult.promptUsed,
        attemptNumber: imageResult.attemptNumber,
        originalData: actionDetails,
      },
    });
  } catch (error) {
    let errorMessage = "Ocorreu um erro interno no servidor.";
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;
      if (error.message.includes("Limite de requisições")) statusCode = 429;
      else if (
        error.message.includes("não autorizada") ||
        error.message.includes("inválida")
      )
        statusCode = 401;
      else if (error.message.includes("não encontrado")) statusCode = 404;
      else if (
        error.message.includes("Falha ao salvar") ||
        error.message.includes("Falha ao processar")
      )
        statusCode = 500;
    }

    // Se há um actionId disponível (ação foi criada), marca como rejeitada
    const formData = await req.json().catch(() => ({}));
    if (formData.actionId) {
      try {
        await prisma.action.update({
          where: { id: formData.actionId },
          data: {
            status: "Rejeitada",
            result: {
              error: errorMessage,
            },
          },
        });
      } catch (updateError) {}
    }

    return NextResponse.json(
      {
        error: errorMessage,
        model: "gemini-2.5-flash-image-preview",
        timestamp: new Date().toISOString(),
        shouldRedirectToHistory: statusCode === 500, // Só redireciona para histórico em erros críticos
      },
      { status: statusCode }
    );
  }
}
