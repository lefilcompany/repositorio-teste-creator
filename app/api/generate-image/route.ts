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

function createImageDataUrl(
  base64Data: string,
  mimeType: string = "image/png"
): string {
  return `data:${mimeType};base64,${base64Data}`;
}

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
  const brand = cleanInput(formData.brand);
  const theme = cleanInput(formData.theme);
  const persona = cleanInput(formData.persona);
  const platform = cleanInput(formData.platform);
  const audience = cleanInput(formData.audience);

  const objective = cleanInput(formData.objective);
  const description = cleanInput(formData.prompt);
  const tones = Array.isArray(formData.tone)
    ? formData.tone
    : formData.tone
      ? [formData.tone]
      : [];
  const additionalInfo = cleanInput(formData.additionalInfo);

  let promptParts: string[] = [];

  // Moodboard: cores e imagens extraídas
  if (formData.moodboard) {
    if (formData.moodboard.colors && Array.isArray(formData.moodboard.colors) && formData.moodboard.colors.length > 0) {
      promptParts.push(`Use predominantemente as seguintes cores extraídas do moodboard da marca: ${formData.moodboard.colors.join(", ")}. Estas cores representam a identidade visual do cliente e devem ser aplicadas de forma harmônica e criativa em todos os elementos gráficos da imagem.`);
    }
    if (formData.moodboard.images && Array.isArray(formData.moodboard.images) && formData.moodboard.images.length > 0) {
      promptParts.push(`Inspire-se nas imagens extraídas do moodboard da marca (referências visuais internas do PDF) para compor a cena, estilo e atmosfera. As imagens devem servir como referência visual para texturas, padrões, elementos gráficos ou ambientação. NÃO copie literalmente, mas use como inspiração para a composição visual.`);
    }
  }

  // 0. Marca e Tema sempre explícitos no início
  if (brand && theme) {
    promptParts.push(
      `Imagem profissional criada para a marca "${brand}", destacando o tema "${theme}".`
    );
  } else if (brand) {
    promptParts.push(`Imagem comercial para a marca "${brand}".`);
  } else if (theme) {
    promptParts.push(`Imagem temática sobre "${theme}".`);
  }

  // 1. Assunto Principal e Qualidade Central
  if (description) {
    promptParts.push(
      `Uma fotografia comercial de alta precisão e fotorrealismo, com atenção detalhada aos aspectos de iluminação e composição. A cena será meticulosamente projetada para capturar a luz natural de forma eficaz, utilizando uma combinação de fontes de luz suave e direta para criar um contraste harmonioso. As cores quentes serão empregadas de forma estratégica para evocar uma sensação de acolhimento e profissionalismo. Cada elemento da composição será cuidadosamente alinhado para otimizar a percepção visual, com foco em criar uma narrativa visual impactante, utilizando métodos comprovados de design fotográfico e análise de impacto visual para maximizar a eficiência da comunicação visual.
      seguindo e priorizando a descrição: ${description}.
      
      Cores: aplique as cores da marca de maneira predominante, ajustando os elementos gráficos para manter a coesão visual.

      Tipografia: se houver fontes específicas ou estilos tipográficos na identidade da marca, insira-as no design, adaptando para o tom visual da imagem (ex: fontes serifadas para formalidade, sans-serif para modernidade).

      Elementos gráficos: utilize ícones, padrões, texturas e formas que são parte da identidade visual da marca, como elementos repetitivos, bordas, ou estilos gráficos que caracterizam o cliente.

      Estilo visual: faça ajustes no estilo de composição (ex: simétrico, assimétrico, centralizado, etc.), baseando-se no comportamento e preferências visuais do público-alvo da marca.
      `
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
        "Cena iluminada pela luz dourada da golden hour, com raios suaves atravessando o cenário. Atmosfera edificante e esperançosa, com sombras delicadas que sugerem crescimento. Ajuste os detalhes de iluminação e cores conforme a identidade visual do cliente, aplicando o estilo único de sua marca (exemplo: cores principais ou elementos visuais usados). Utilize formas suaves e espacialidade bem definida.",
      motivacional:
        "Cores vibrantes e saturadas, com iluminação dinâmica e uso de motion blur leve para dar sensação de movimento. A composição energética deve incentivar ação e conquistas, sendo fiel ao estilo visual da marca. Alinhe o uso de contrastes de cores com os padrões de identidade visual (exemplo: tons específicos ou estilo gráfico). Certifique-se de que o dinamismo da imagem combine com a energia da marca.",
      profissional:
        "Estética corporativa limpa, iluminação neutra, com foco nítido e fundo minimalista. Use espacamento e equilíbrio para transmitir autoridade e clareza. Ajuste a paleta de cores primárias da marca, e a tipografia (caso haja) para manter o visual alinhado com a identidade profissional. Mantenha uma composição estruturada e evite elementos visuais excessivos, destacando os valores da marca.",
      casual:
        "Luz natural suave, com elementos cotidianos e uma paleta de cores acolhedora. A composição descontraída e espontânea deve transmitir autenticidade. Aplique a paleta de cores informais e o estilo visual que melhor represente o tom amigável da marca. Use detalhes simples e texturizados, como elementos de estilo 'handmade', se for relevante para a identidade visual do cliente.",
      elegante:
        "Paleta refinada, com iluminação suave e texturas nobres como mármore ou veludo. A composição minimalista deve refletir sofisticação e luxo. Ajuste as cores de fundo e o detalhamento das texturas conforme o estilo da marca, incorporando elementos visuais que falem diretamente ao segmento de alto padrão que o cliente deseja atingir (como detalhes dourados ou metálicos, se for aplicável).",
      moderno:
        "Design arrojado com formas geométricas e alta contrastância de cores. Iluminação intensa e elementos gráficos com uma estética futurista. Aplique a paleta de cores principais da marca (caso haja) e use tipografia contemporânea para transmitir inovação. Esteja atento para que o estilo visual esteja alinhado com as preferências mais atuais do cliente, refletindo o dinamismo de sua marca.",
      tradicional:
        "Paleta de cores clássicas, com iluminação equilibrada e composição simétrica. A imagem deve evocar confiança e estabilidade, com elementos visuais que falem à tradição. Use detalhes sutis, como texturas suaves ou linhas clássicas, adaptando a paleta de cores da marca para garantir que a imagem se encaixe com a herança visual e identidade do cliente.",
      divertido:
        "Cores vibrantes, com elementos gráficos lúdicos e iluminação alegre. A composição enérgica deve destacar a diversão e criatividade. Personalize a paleta de cores de acordo com o tom visual da marca, e use elementos interativos ou detalhes que incentivem o engajamento visual, como emojis, padrões repetitivos ou elementos gráficos descontraídos, se for relevante.",
      sério:
        "Iluminação dramática e composição formal, com contraste forte e ângulos monumentais. A imagem deve transmitir autoridade e seriedade. Ajuste a iluminação e composição de sombras para refletir a força da marca, garantindo que tipografia robusta ou formas sólidas se alinhem com o tom da marca, transmitindo confiança e respeito.",
      futurista:
        "Iluminação dramática e composição formal, com contraste forte e ângulos monumentais. A imagem deve transmitir autoridade e seriedade. Ajuste a iluminação e composição de sombras para refletir a força da marca, garantindo que tipografia robusta ou formas sólidas se alinhem com o tom da marca, transmitindo confiança e respeito.",
      nostálgico:
        "Cores desbotadas e textura de filme analógico, criando uma atmosfera melancólica e acolhedora. Ajuste os efeitos vintage e tipografia clássica para refletir a estética única da marca, aplicando cores de fundo e elementos visuais que ressoem com o legado da marca e seus valores emocionais.",
      romântico:
        "Paleta suave em tons pastel, com iluminação delicada e difusa. A composição intimista deve refletir carinho e proximidade emocional. Aplique a paleta de cores da marca, ajustando a iluminação para que o visual combine com os valores românticos ou afetivos do cliente, usando elementos como detalhes florais ou texturas suaves.",
      minimalista:
        "Paleta monocromática ou neutra, com iluminação uniforme e composição limpa. A imagem deve transmitir simplicidade e clareza, destacando o essencial. Use espaços negativos, tipografia limpa e formas geométricas para garantir um visual simples, alinhado com o design visual minimalista do cliente.",
      artístico:
        "Composição inspirada em pintura (óleo, aquarela ou surrealismo), com pinceladas visíveis e cores expressivas. A imagem deve evocar criatividade e liberdade. Adapte o estilo artístico conforme a marca, aplicando padrões visuais únicos ou elementos gráficos personalizados, como técnicas de pintura manual ou detalhes visuais que destacam a arte digital.",
      épico:
        "Iluminação grandiosa, com ângulos heroicos e composição monumental. A imagem deve transmitir poder e grandeza. Personalize a iluminação e ângulos de câmera de acordo com a identidade visual da marca, usando formas dramáticas ou elementos em 3D para garantir que a imagem tenha a escala e o impacto que a marca exige.",
      tecnológico:
        "Iluminação dramática e composição formal, com contraste forte e ângulos monumentais. A imagem deve transmitir autoridade e seriedade. Ajuste a iluminação e composição de sombras para refletir a força da marca, garantindo que tipografia robusta ou formas sólidas se alinhem com o tom da marca, transmitindo confiança e respeito.",
      orgânico:
        "Luz natural suave e elementos de madeira, pedra e plantas. A imagem deve transmitir uma conexão com a natureza e sustentabilidade. Adapte os elementos naturais e a paleta de cores verdes da marca para garantir que a imagem seja harmoniosa com a identidade visual da marca, criando um ambiente orgânico e sustentável.",
      luxuoso:
        "Detalhes em dourado, iluminação suave e superfícies brilhantes. A imagem deve refletir exclusividade e requinte. Ajuste os elementos de brilho e textura para se alinhar com a identidade visual do cliente, utilizando tipografia sofisticada e detalhes refinados para garantir um visual luxuoso e elegante.",
    };
    const mappedTones = tones
      .map((tone) => {
        const cleanTone = cleanInput(tone);
        return (
          toneMap[cleanTone.toLowerCase()] ||
          `com uma estética ${cleanTone} de forma única e criativa `
        );
      })
      .join(", ");
    promptParts.push(`O clima da imagem é uma combinação de: ${mappedTones}`);
  }

  // 4. Detalhes Técnicos da Câmera
  promptParts.push(
    "Detalhes técnicos: a foto foi capturada com uma câmera DSLR de alta qualidade, como a Canon EOS R5, equipada com uma lente de 85mm f/1.4. Essa combinação proporciona uma profundidade de campo rasa, criando um efeito bokeh suave e bem definido no fundo, que destaca o sujeito principal e confere uma estética profissional e cinematográfica à imagem. A escolha da lente também contribui para um desfoque agradável, mantendo o foco nítido e claro nos elementos mais importantes da composição."
  );

  // 5. Otimização para Plataforma
  const platformStyles: { [key: string]: string } = {
    instagram:
      "formato quadrado 1:1, cores vibrantes, otimizado para engajamento no feed e stories do Instagram",
    facebook:
      "composição envolvente, focada na comunidade, otimizada para compartilhamento e interação social no Facebook",
    linkedin:
      "estética profissional e corporativa, ideal para posts informativos e de negócios, com ênfase na clareza e objetividade",
    twitter:
      "design clean e chamativo, otimizado para máxima visibilidade e engajamento em threads no Twitter/X",
    x: "design clean e chamativo, otimizado para visibilidade e interações rápidas no Twitter/X",
    tiktok:
      "formato vertical 9:16, composição dinâmica e energia jovem, perfeito para vídeos curtos e envolventes no TikTok",
    youtube:
      "estilo thumbnail de alto contraste, otimizado para aumentar taxas de clique e visualizações no YouTube, com foco em visual impactante",
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
    `Esta imagem é para um anúncio da marca "${brand}" sobre o tema "${theme}".
    Não inclua nada além do que foi pedido.
    não adicione texto que não foi pedido.`
  );

  // 8. Textos e fontes - Técnicas e Métricas
  promptParts.push(
    `Textos na imagem: 
    - **Posicionamento**: Coloque o texto em áreas onde não interfira nos elementos principais da imagem. Idealmente, posicione-o nas **áreas vazias ou de maior contraste** para garantir legibilidade. Em imagens simétricas, tente alinhar o texto ao centro ou à esquerda/direita, dependendo da composição. Evite posicionar o texto no topo ou fundo da imagem, onde pode se perder.
    - **Margem e Distância**: Mantenha uma **margem mínima de 10% da largura da imagem** de cada lado do texto. A distância entre linhas (leading) deve ser de pelo menos **120% da altura da fonte** para garantir boa legibilidade e evitar sobreposição visual.
    - **Espaçamento entre as palavras**: Ajuste o **tracking** (espaçamento entre letras) conforme o peso da fonte. Para fontes mais finas, use um **tracking maior** (0,05 em termos de unidades tipográficas), e para fontes mais grossas, um **tracking menor** para evitar que o texto se torne difícil de ler.
  
  **Fontes**: 
    - **Estilo da fonte**: Para títulos, use fontes **negritadas (bold)** ou **sem serifa** (sans-serif), pois elas são mais impactantes e visíveis. Para textos secundários ou explicativos, prefira fontes **serifadas** ou **light sans-serif**, que são mais elegantes e legíveis em blocos de texto.
    - **Tamanho da fonte**: 
      - **Títulos**: Entre **36px a 60px**, dependendo do tamanho da imagem.
      - **Subtítulos**: Entre **24px a 36px**.
      - **Textos de apoio**: Entre **14px a 20px**, com um peso mais leve, para que o texto não roube a atenção.
    - **Contraste e legibilidade**: Certifique-se de que o contraste entre o texto e o fundo seja de pelo menos **4.5:1** para garantir legibilidade em dispositivos móveis e desktops, conforme as diretrizes WCAG.
    
  **Métricas de Alinhamento**:
    - **Alinhamento horizontal**: Para títulos, considere o alinhamento **à esquerda ou ao centro**. Para textos menores ou descrições, **alinhamento à esquerda** funciona melhor para fluidez visual.
    - **Alinhamento vertical**: Evite centralizar texto em toda a altura da imagem, a menos que a imagem seja minimalista. Em composições mais complexas, alinhe o texto na **parte superior ou inferior** para não sobrecarregar o design.

  **Métodos de Composição Visual**:
    - **Contraste e hierarquia**: Utilize um **alto contraste** para os textos principais (títulos), e contraste mais suave para textos de apoio. Estabeleça uma clara **hierarquia tipográfica**, onde os títulos e subtítulos se destacam, seguidos pelo corpo do texto.
    - **Utilização de blocos de cor**: Se necessário, coloque um **bloco de cor semitransparente** atrás do texto para garantir a legibilidade, especialmente em imagens complexas ou com fundo movimentado.

    Esses métodos garantirão que o texto se destaque de maneira eficaz, sem interferir no impacto visual da imagem, mantendo sempre a clareza e harmonia no design.
  `
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
  referenceImages?: string[], // agora é array
  actionId?: string
): Promise<any> {
  try {
    // Limitar o tamanho do prompt para evitar erros
    const maxPromptLength = 2000;
    let basePrompt =
      prompt.length > maxPromptLength
        ? prompt.substring(0, maxPromptLength)
        : prompt;

    const fullPrompt = `${basePrompt}. 
    Crie uma imagem profissional para Instagram com alta qualidade visual, design moderno e cores vi  brantes.

    Cores: aplique as cores da marca de maneira predominante, ajustando os elementos gráficos para manter a coesão visual.

    Tipografia: se houver fontes específicas ou estilos tipográficos na identidade da marca, insira-as no design, adaptando para o tom visual da imagem (ex: fontes serifadas para formalidade, sans-serif para modernidade).

    Elementos gráficos: utilize ícones, padrões, texturas e formas que são parte da identidade visual da marca, como elementos repetitivos, bordas, ou estilos gráficos que caracterizam o cliente.

    Estilo visual: faça ajustes no estilo de composição (ex: simétrico, assimétrico, centralizado, etc.), baseando-se no comportamento e preferências visuais do público-alvo da marca.
    `;

    const contents: any[] = [];
    if (referenceImages && Array.isArray(referenceImages)) {
      for (const refImg of referenceImages.slice(0, 10)) { // máximo 10
        try {
          const [meta, data] = refImg.split(",");
          const mimeMatch = meta.match(/data:(image\/[^;]+);base64/);
          contents.push({
            inlineData: {
              data,
              mimeType: mimeMatch ? mimeMatch[1] : "image/png",
            },
          });
        } catch (refError) {}
      }
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
 * COMENTADO: Desabilitado temporariamente para forçar uso apenas do Gemini
 */
// async function generateImageWithDALLE(
//   prompt: string,
//   actionId?: string
// ): Promise<any> {
//   try {
//     // Simplificar o prompt para DALL-E
//     const simplePrompt =
//       prompt.length > 1000 ? prompt.substring(0, 1000) : prompt;

//     const response = await openai.images.generate({
//       model: "dall-e-3",
//       prompt: `${simplePrompt}. Professional Instagram post design with high quality and modern aesthetic.`,
//       n: 1,
//       size: "1024x1024",
//       response_format: "b64_json",
//     });

//     if (response.data && response.data[0] && response.data[0].b64_json) {
//       const imageData = response.data[0].b64_json;
//       const mimeType = "image/png";
//       const dataUrl = createImageDataUrl(imageData, mimeType);

//       return {
//         imageUrl: dataUrl,
//         base64Data: imageData,
//         mimeType: mimeType,
//       };
//     } else {
//       throw new Error("No image data returned from DALL-E");
//     }
//   } catch (error) {
//     throw error;
//   }
// }

/**
 * Tenta gerar a imagem com Gemini usando 4 tentativas antes de falhar.
 */
async function generateImageWithFallbacks(formData: any, actionId: string) {
  const basePrompt = buildDetailedImagePrompt(formData);
  const maxRetries = 4;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Tentativa ${attempt}/${maxRetries} de geração com Gemini...`);
      
      const response = await generateImage(
        basePrompt,
        formData.referenceImages,
        actionId
      );

      if (response.imageUrl) {
        console.log(`✅ Sucesso na tentativa ${attempt}/${maxRetries}`);
        return {
          success: true,
          imageUrl: response.imageUrl,
          base64Data: response.base64Data,
          mimeType: response.mimeType,
          promptUsed: basePrompt,
          attemptNumber: attempt,
          model: "gemini-2.5-flash-preview-image-generation",
          quality: "high",
          size: "1080x1080",
          output_format: "png",
        };
      }
    } catch (error: any) {
      console.log(`❌ Falha na tentativa ${attempt}/${maxRetries}:`, error.message);
      
      // Erros que devem parar as tentativas imediatamente
      if (
        error.message?.includes("content policy") ||
        error.message?.includes("safety")
      ) {
        return {
          success: false,
          error: "O conteúdo solicitado viola as políticas de segurança. Por favor, tente uma descrição diferente.",
          shouldConsumeCredit: false
        };
      }
      
      if (
        error.message?.includes("quota") ||
        error.message?.includes("limit")
      ) {
        return {
          success: false,
          error: "Limite de requisições do serviço excedido. Tente novamente em alguns minutos.",
          shouldConsumeCredit: false
        };
      }
      
      if (
        error.message?.includes("authentication") ||
        error.message?.includes("unauthorized")
      ) {
        return {
          success: false,
          error: "Erro de autenticação com o serviço de geração. Entre em contato com o suporte.",
          shouldConsumeCredit: false
        };
      }

      // Se não é a última tentativa, aguarda um pouco antes da próxima
      if (attempt < maxRetries) {
        const delay = attempt * 2000; // 2s, 4s, 6s
        console.log(`⏳ Aguardando ${delay}ms antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
    }
  }

  // Todas as tentativas falharam
  console.log(`❌ Todas as ${maxRetries} tentativas falharam`);
  
  // DALL-E desabilitado temporariamente - comentado
  // try {
  //   console.log("🔄 Tentando fallback com DALL-E...");
  //   const response = await generateImageWithDALLE(basePrompt, actionId);
  //   return {
  //     success: true,
  //     imageUrl: response.imageUrl,
  //     base64Data: response.base64Data,
  //     mimeType: response.mimeType,
  //     promptUsed: basePrompt,
  //     attemptNumber: 1,
  //     model: "dall-e-3",
  //     quality: "high",
  //     size: "1024x1024",
  //     output_format: "png",
  //   };
  // } catch (dalleError) {
  //   console.log("❌ DALL-E também falhou:", dalleError);
  // }

  return {
    success: false,
    error: `Não foi possível gerar a imagem após ${maxRetries} tentativas. O serviço pode estar temporariamente indisponível. Tente novamente em alguns minutos.`,
    shouldConsumeCredit: false
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

    // --- 2. GERAÇÃO DA IMAGEM COM GEMINI (4 tentativas) ---
    const imageResult = await generateImageWithFallbacks(
      actionDetails,
      action.id
    );

    if (!imageResult.success) {
      // Se não deve consumir crédito, exclui a ação criada
      if (imageResult.shouldConsumeCredit === false) {
        console.log("🔄 Excluindo ação devido a falha que não deve consumir crédito...");
        await prisma.action.delete({
          where: { id: action.id },
        });

        return NextResponse.json(
          {
            error: imageResult.error || "Falha na geração da imagem",
            shouldShowToast: true,
            toastType: "error",
            toastMessage: imageResult.error || "Não foi possível gerar a imagem. Tente novamente."
          },
          { status: 400 }
        );
      }

      // Se deve consumir crédito, atualiza a ação com erro (mantém histórico)
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
          error: imageResult.error || "Não foi possível gerar a imagem. Tente uma descrição diferente.",
          shouldShowToast: true,
          toastType: "error",
          toastMessage: "Falha na geração após múltiplas tentativas"
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

    // Se há um actionId disponível (ação foi criada), decide se exclui ou marca como rejeitada
    try {
      const formDataForError = await req.json().catch(() => ({}));
      if (formDataForError.actionId) {
        // Para erros críticos de sistema, exclui a ação (não consome crédito)
        if (statusCode >= 500 || error.message?.includes("servidor") || error.message?.includes("configurada")) {
          await prisma.action.delete({
            where: { id: formDataForError.actionId },
          });
        } else {
          // Para outros erros, marca como rejeitada (consome crédito)
          await prisma.action.update({
            where: { id: formDataForError.actionId },
            data: {
              status: "Rejeitada",
              result: {
                error: errorMessage,
              },
            },
          });
        }
      }
    } catch (actionError) {
      console.error("Erro ao atualizar ação:", actionError);
    }

    return NextResponse.json(
      {
        error: errorMessage,
        model: "gemini-2.5-flash-image-preview",
        timestamp: new Date().toISOString(),
        shouldRedirectToHistory: statusCode === 500, // Só redireciona para histórico em erros críticos
        shouldShowToast: true,
        toastType: "error",
        toastMessage: statusCode >= 500 ? "Erro interno do servidor. Tente novamente." : errorMessage
      },
      { status: statusCode }
    );
  }
}
