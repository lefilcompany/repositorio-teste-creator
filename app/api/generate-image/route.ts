// app/api/generate-image/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;

  // Extrai o prompt e os outros dados do corpo da requisição
  const { prompt: imagePrompt, ...formData } = await req.json();

  if (!apiKey) {
    return NextResponse.json(
      { error: 'A chave da API da OpenAI não foi configurada.' },
      { status: 500 }
    );
  }

  if (!imagePrompt) {
    return NextResponse.json(
      { error: 'O prompt da imagem é obrigatório.' },
      { status: 400 }
    );
  }

  const textPrompt = `
    Com base nas seguintes informações, crie um post para a plataforma ${formData.platform}:
    - Marca: ${formData.brand}
    - Tema: ${formData.theme}
    - Objetivo do Post: ${formData.objective}
    - Descrição da Ideia: ${formData.description}
    - Público-alvo: ${formData.audience}
    - Tom de Voz: ${formData.tone}

    Responda em formato JSON com as seguintes chaves: "title" (um título criativo e curto), "body" (a legenda do post, com quebras de linha representadas por \\n), e "hashtags" (um array de 5 a 7 hashtags relevantes, sem o caractere '#').
  `;

  // Garantir que a imagem esteja relacionada à marca e ao tema
  const finalImagePrompt = `${imagePrompt}\nA imagem deve ter forte relação com a marca ${formData.brand} e o tema ${formData.theme}.`;

  try {
    // Geração da imagem usando GPT-4o (via endpoint de imagens)
    const imageResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: finalImagePrompt,
        size: '1024x1024',
        response_format: 'b64_json',
      }),
    });

    if (!imageResponse.ok) {
      const errorData = await imageResponse.json();
      console.error('Erro da API de Imagem da OpenAI:', errorData);
      return NextResponse.json(
        { error: 'Falha ao gerar a imagem.', details: errorData },
        { status: imageResponse.status }
      );
    }

    const imageData = await imageResponse.json();
    const base64 = imageData.data[0].b64_json;
    const imageUrl = `data:image/png;base64,${base64}`;

    // Geração do texto utilizando GPT-4o
    const textResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: textPrompt }],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      }),
    });

    if (!textResponse.ok) {
      const errorData = await textResponse.json();
      console.error('Erro da API de Texto da OpenAI:', errorData);
      return NextResponse.json({
        imageUrl,
        title: 'Erro ao gerar legenda',
        body: 'Não foi possível gerar o conteúdo do post, mas sua imagem está pronta!',
        hashtags: [],
      });
    }

    const textData = await textResponse.json();
    const postContent = JSON.parse(textData.choices[0].message.content);

    return NextResponse.json({
      imageUrl,
      title: postContent.title,
      body: postContent.body,
      hashtags: postContent.hashtags,
    });
  } catch (error) {
    console.error('Erro ao chamar a API da OpenAI:', error);
    return NextResponse.json(
      { error: 'Ocorreu um erro interno no servidor.' },
      { status: 500 }
    );
  }
}

// app/api/generate-image/route.ts

// import { NextRequest, NextResponse } from 'next/server';
// import { VertexAI } from '@google-cloud/vertexai';

// export async function POST(req: NextRequest) {
//   const gcloudProject = process.env.GCLOUD_PROJECT;
//   const gcloudLocation = process.env.GCLOUD_LOCATION;
//   const gcloudCredentials = process.env.GOOGLE_CREDENTIALS;

//   const { prompt: imagePrompt, ...formData } = await req.json();

//   if (!gcloudProject || !gcloudLocation || !gcloudCredentials) {
//     return NextResponse.json({ error: 'As credenciais do Google Cloud não foram configuradas.' }, { status: 500 });
//   }
//   if (!imagePrompt) {
//     return NextResponse.json({ error: 'O prompt da imagem é obrigatório.' }, { status: 400 });
//   }

//   let credentials;
//   try {
//     credentials = JSON.parse(gcloudCredentials);
//   } catch (error) {
//     return NextResponse.json({ error: 'Credenciais JSON inválidas.' }, { status: 500 });
//   }

//   const textPrompt = `
//     Com base nas seguintes informações, crie um post para a plataforma ${formData.platform}:
//     - Marca: ${formData.brand}
//     - Tema: ${formData.theme}
//     - Objetivo do Post: ${formData.objective}
//     - Descrição da Ideia: ${formData.description}
//     - Público-alvo: ${formData.audience}
//     - Tom de Voz: ${formData.tone}
//     Responda em formato JSON com as seguintes chaves: "title" (um título criativo e curto), "body" (a legenda do post, com quebras de linha representadas por \n), e "hashtags" (um array de 5 a 7 hashtags relevantes, sem o caractere '#').
//   `;

//   try {
//     // Configuração corrigida do VertexAI
//     const vertex_ai = new VertexAI({
//       project: gcloudProject,
//       location: gcloudLocation,
//       googleAuthOptions: {
//         credentials: credentials,
//       },
//       // NÃO definir apiEndpoint - deixar que a biblioteca use o padrão
//     });

//     console.log('Configuração VertexAI criada com sucesso');

//     // PRIMEIRO: Gerar o texto (mais estável)
//     console.log('Iniciando geração de texto...');
//     const textModel = vertex_ai.getGenerativeModel({
//       model: 'gemini-1.5-pro', // Modelo mais estável
//     });

//     const textRequest: any = {
//       contents: [{
//         role: 'user',
//         parts: [{ text: textPrompt }]
//       }],
//       generationConfig: {
//         responseMimeType: 'application/json',
//         temperature: 0.7,
//         maxOutputTokens: 2048,
//       },
//       safetySettings: [
//         { 
//           category: 'HARM_CATEGORY_HATE_SPEECH' as any, 
//           threshold: 'BLOCK_MEDIUM_AND_ABOVE' as any 
//         },
//         { 
//           category: 'HARM_CATEGORY_DANGEROUS_CONTENT' as any, 
//           threshold: 'BLOCK_MEDIUM_AND_ABOVE' as any 
//         },
//         { 
//           category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT' as any, 
//           threshold: 'BLOCK_MEDIUM_AND_ABOVE' as any 
//         },
//         { 
//           category: 'HARM_CATEGORY_HARASSMENT' as any, 
//           threshold: 'BLOCK_MEDIUM_AND_ABOVE' as any 
//         },
//       ],
//     };

//     const textGenerationResponse = await textModel.generateContent(textRequest);
//     console.log('Texto gerado com sucesso');

//     if (!textGenerationResponse.response.candidates || !textGenerationResponse.response.candidates[0]) {
//       throw new Error('Erro na geração de texto: resposta inválida da API.');
//     }

//     const textResponseData = textGenerationResponse.response.candidates[0].content.parts[0].text;
//     let postContent;

//     try {
//       postContent = JSON.parse(textResponseData);
//     } catch (parseError) {
//       console.error('Erro ao fazer parse do JSON:', textResponseData);
//       throw new Error('Erro ao processar a resposta de texto da API.');
//     }

//     // SEGUNDO: Tentar gerar a imagem (se falhar, retornar apenas o texto)
//     let imageUrl = '';

//     try {
//       console.log('Iniciando geração de imagem...');

//       // Para geração de imagem, usar um modelo diferente
//       const imageModel = vertex_ai.getGenerativeModel({ 
//         model: 'imagegeneration@006' // Modelo que pode trabalhar com imagens
//       });

//       // Criar um prompt mais específico para descrição de imagem
//       const imageDescriptionPrompt = `Descreva uma imagem que represente visualmente este post: "${postContent.title}" - ${postContent.body}. Descreva em detalhes a imagem ideal para este conteúdo, incluindo cores, estilo, elementos visuais e composição.`;

//       const imageDescRequest: any = {
//         contents: [{
//           role: 'user',
//           parts: [{ text: imageDescriptionPrompt }]
//         }],
//         generationConfig: {
//           temperature: 0.6,
//           maxOutputTokens: 1024,
//         },
//       };

//       const imageDescResponse = await imageModel.generateContent(imageDescRequest);

//       if (imageDescResponse.response.candidates && imageDescResponse.response.candidates[0]) {
//         const imageDescription = imageDescResponse.response.candidates[0].content.parts[0].text;
//         console.log('Descrição da imagem gerada:', imageDescription);

//         // Por enquanto, retornar uma URL placeholder ou usar um serviço de imagem alternativo
//         imageUrl = `data:image/svg+xml;base64,${Buffer.from(
//           `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
//             <rect width="100%" height="100%" fill="#f0f0f0"/>
//             <text x="50%" y="50%" font-family="Arial" font-size="16" fill="#333" text-anchor="middle" dy="0.3em">
//               Imagem: ${postContent.title}
//             </text>
//           </svg>`
//         ).toString('base64')}`;
//       }

//     } catch (imageError) {
//       console.warn('Falha na geração de imagem, continuando apenas com texto:', imageError);
//       // Criar uma imagem placeholder simples
//       imageUrl = `data:image/svg+xml;base64,${Buffer.from(
//         `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
//           <rect width="100%" height="100%" fill="#e3f2fd"/>
//           <circle cx="200" cy="150" r="50" fill="#2196f3"/>
//           <text x="200" y="250" font-family="Arial" font-size="14" fill="#1976d2" text-anchor="middle">
//             ${postContent.title || 'Post Gerado'}
//           </text>
//           <text x="200" y="280" font-family="Arial" font-size="12" fill="#666" text-anchor="middle">
//             Conteúdo para ${formData.platform}
//           </text>
//         </svg>`
//       ).toString('base64')}`;
//     }

//     console.log('Processo concluído com sucesso');

//     return NextResponse.json({
//       imageUrl,
//       title: postContent.title,
//       body: postContent.body,
//       hashtags: postContent.hashtags,
//     });

//   } catch (error: any) {
//     console.error('Erro detalhado:', error);

//     let errorMessage = 'Ocorreu um erro interno no servidor.';

//     // Tratamento específico para diferentes tipos de erro
//     if (error.message?.includes('ENOTFOUND')) {
//       errorMessage = 'Erro de conectividade com o Google Cloud. Verifique sua conexão com a internet e as configurações de região.';
//     } else if (error.message?.includes('authentication')) {
//       errorMessage = 'Erro de autenticação. Verifique suas credenciais do Google Cloud.';
//     } else if (error.message?.includes('quota')) {
//       errorMessage = 'Cota da API excedida. Tente novamente mais tarde.';
//     } else if (error.code) {
//       switch (error.code) {
//         case 7: // PERMISSION_DENIED
//           errorMessage = 'Permissão negada. Verifique as credenciais e permissões do Google Cloud.';
//           break;
//         case 8: // RESOURCE_EXHAUSTED
//           errorMessage = 'Cota da API excedida. Tente novamente mais tarde.';
//           break;
//         case 3: // INVALID_ARGUMENT
//           errorMessage = 'Argumentos inválidos na requisição.';
//           break;
//         case 14: // UNAVAILABLE
//           errorMessage = 'Serviço temporariamente indisponível. Tente novamente.';
//           break;
//         default:
//           errorMessage = error.message || errorMessage;
//       }
//     } else {
//       errorMessage = error.message || errorMessage;
//     }

//     return NextResponse.json({ 
//       error: errorMessage,
//       details: process.env.NODE_ENV === 'development' ? error.stack : undefined
//     }, { status: 500 });
//   }
// }

// import { NextRequest, NextResponse } from 'next/server';

// interface GeminiTextResponse {
//   candidates: Array<{
//     content: {
//       parts: Array<{
//         text: string;
//       }>;
//     };
//     finishReason: string;
//   }>;
// }

// interface GeminiImageResponse {
//   candidates: Array<{
//     content: {
//       parts: Array<{
//         inlineData: {
//           mimeType: string;
//           data: string;
//         };
//       }>;
//     };
//   }>;
// }

// // Função para fazer requisições com retry melhorada
// async function fetchWithRetry(
//   url: string, 
//   options: RequestInit, 
//   maxRetries = 5,
//   initialDelay = 2000
// ): Promise<Response> {
//   let lastError;

//   for (let attempt = 1; attempt <= maxRetries; attempt++) {
//     try {
//       console.log(`Tentativa ${attempt}/${maxRetries} para ${url.includes('imagegeneration') ? 'Imagen' : 'Gemini Text'}...`);
      
//       const response = await fetch(url, {
//         ...options,
//         signal: AbortSignal.timeout(45000) // Timeout de 45 segundos para imagem
//       });

//       if (response.ok) {
//         console.log(`✅ Sucesso na tentativa ${attempt}`);
//         return response;
//       }

//       // Status codes que indicam sobrecarga ou erro temporário
//       const retryableStatuses = [503, 429, 500, 502, 504];
//       const errorData = await response.json().catch(() => ({ 
//         error: { message: `HTTP ${response.status}` } 
//       }));

//       lastError = new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);

//       if (retryableStatuses.includes(response.status) && attempt < maxRetries) {
//         // Backoff exponencial com jitter
//         const baseDelay = initialDelay * Math.pow(1.5, attempt - 1);
//         const jitter = Math.random() * 1000;
//         const delay = Math.min(baseDelay + jitter, 30000);
        
//         console.log(`⚠️ Status ${response.status}. Aguardando ${Math.round(delay)}ms antes da próxima tentativa...`);
//         await new Promise(resolve => setTimeout(resolve, delay));
//         continue;
//       }

//       if (!retryableStatuses.includes(response.status)) {
//         throw lastError;
//       }

//     } catch (error: any) {
//       lastError = error;
      
//       if (attempt < maxRetries && (
//         error.name === 'TimeoutError' || 
//         error.name === 'AbortError' ||
//         error.code === 'ECONNRESET' ||
//         error.code === 'ENOTFOUND'
//       )) {
//         const delay = initialDelay * Math.pow(1.5, attempt - 1) + Math.random() * 1000;
//         console.log(`🔄 Erro de conexão. Tentando novamente em ${Math.round(delay)}ms...`);
//         await new Promise(resolve => setTimeout(resolve, delay));
//         continue;
//       }

//       if (attempt === maxRetries) {
//         break;
//       }
//     }
//   }

//   throw lastError || new Error('Falhou em obter resposta após todas as tentativas');
// }

// // Função para gerar conteúdo de fallback
// function generateFallbackContent(formData: any) {
//   return {
//     title: `Post para ${formData.brand || 'sua marca'}`,
//     body: `Conteúdo criativo para ${formData.platform || 'redes sociais'}!\n\n${formData.description || 'Confira nossa novidade!'}\n\n#${formData.brand?.toLowerCase().replace(/\s+/g, '') || 'marca'}`,
//     hashtags: [
//       formData.brand?.toLowerCase().replace(/\s+/g, '') || 'marca',
//       formData.theme?.toLowerCase().replace(/\s+/g, '') || 'conteudo',
//       formData.platform?.toLowerCase() || 'social',
//       'marketing',
//       'digital'
//     ].filter(Boolean).slice(0, 5)
//   };
// }

// export async function POST(req: NextRequest) {
//   const geminiApiKey = process.env.GEMINI_API_KEY;

//   if (!geminiApiKey) {
//     return NextResponse.json({
//       error: 'A chave da API do Gemini não foi configurada.'
//     }, { status: 500 });
//   }

//   try {
//     const { prompt: imagePrompt, ...formData } = await req.json();

//     if (!imagePrompt) {
//       return NextResponse.json({
//         error: 'O prompt da imagem é obrigatório.'
//       }, { status: 400 });
//     }

//     console.log('🚀 Iniciando geração de conteúdo...');

//     // Prompt para geração de texto baseado no padrão OpenAI que funcionava
//     const textPrompt = `
// Com base nas seguintes informações, crie um post para a plataforma ${formData.platform}:
// - Marca: ${formData.brand}
// - Tema: ${formData.theme}
// - Objetivo do Post: ${formData.objective}
// - Descrição da Ideia: ${formData.description}
// - Público-alvo: ${formData.audience}
// - Tom de Voz: ${formData.tone}
// - Informações adicionais: ${formData.additionalInfo}

// Responda EXCLUSIVAMENTE em formato JSON com as seguintes chaves: "title" (um título criativo e curto), "body" (a legenda do post, com quebras de linha representadas por \\n), e "hashtags" (um array de 5 a 7 hashtags relevantes, sem o caractere '#').`;

//     // Geração do Texto usando Gemini
//     let postContent = generateFallbackContent(formData);
//     let textWarning: string | null = null;

//     try {
//       console.log('📝 Gerando texto...');
//       const textResponse = await fetchWithRetry(
//         `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
//         {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//           },
//           body: JSON.stringify({
//             contents: [{
//               parts: [{
//                 text: textPrompt
//               }]
//             }],
//             generationConfig: {
//               temperature: 0.7,
//               topK: 40,
//               topP: 0.95,
//               maxOutputTokens: 1024,
//               responseMimeType: "application/json"
//             }
//           })
//         },
//         4, // 4 tentativas para texto
//         1500
//       );

//       const textData: GeminiTextResponse = await textResponse.json();

//       if (textData.candidates && textData.candidates[0]?.content?.parts?.[0]?.text) {
//         try {
//           const generatedText = textData.candidates[0].content.parts[0].text.trim();
          
//           // Parse do JSON - similar ao padrão OpenAI
//           let parsedContent;
//           try {
//             parsedContent = JSON.parse(generatedText);
//           } catch {
//             const jsonMatch = generatedText.match(/\{[\s\S]*?\}/);
//             if (jsonMatch) {
//               parsedContent = JSON.parse(jsonMatch[0]);
//             } else {
//               const cleanJson = generatedText.replace(/```json|```/g, '').trim();
//               parsedContent = JSON.parse(cleanJson);
//             }
//           }

//           if (parsedContent.title && parsedContent.body && Array.isArray(parsedContent.hashtags)) {
//             postContent = parsedContent;
//             console.log('✅ Texto gerado com sucesso via IA');
//           } else {
//             throw new Error('Estrutura JSON inválida');
//           }

//         } catch (parseError: any) {
//           console.error('❌ Erro ao processar resposta do texto:', parseError.message);
//           textWarning = "Falha ao processar resposta da IA para texto. Usando conteúdo padrão.";
//         }
//       }
//     } catch (textError: any) {
//       console.error('❌ Erro na geração de texto:', textError.message);
//       textWarning = `Não foi possível gerar texto via IA: ${textError.message}. Usando conteúdo padrão.`;
//     }

//     // Geração da Imagem usando a API REST correta do Gemini
//     let imageUrl: string | null = null;
//     let imageWarning: string | null = null;

//     console.log('🎨 Iniciando geração de imagem...');

//     try {
//       // Prompt otimizado para Imagen
//       const optimizedImagePrompt = `Create a professional, high-quality image for social media post about "${formData.theme}" for brand "${formData.brand}". 
// Platform: ${formData.platform}
// Objective: ${formData.objective}
// Visual description: ${imagePrompt}
// Target audience: ${formData.audience}
// Visual tone: ${formData.tone}
// Additional context: ${formData.additionalInfo}

// Style requirements: Modern digital art, professional quality, vibrant colors, engaging composition, social media optimized, high resolution, visually appealing, brand-appropriate.`;

//       // Usando a API REST correta para geração de imagens
//       const imageResponse = await fetchWithRetry(
//         `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-fast-generate-001:generateContent?key=${geminiApiKey}`,
//         {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//           },
//           body: JSON.stringify({
//             contents: [{
//               parts: [{
//                 text: optimizedImagePrompt
//               }]
//             }],
//             generationConfig: {
//               temperature: 0.4,
//               topK: 32,
//               topP: 0.95,
//               maxOutputTokens: 4096,
//             }
//           })
//         },
//         3, // 3 tentativas para imagem
//         3000
//       );

//       const imageData: GeminiImageResponse = await imageResponse.json();

//       if (imageData.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
//         const imageBase64 = imageData.candidates[0].content.parts[0].inlineData.data;
//         const mimeType = imageData.candidates[0].content.parts[0].inlineData.mimeType || 'image/png';
//         imageUrl = `data:${mimeType};base64,${imageBase64}`;
//         console.log('✅ Imagem gerada com sucesso');
//       } else {
//         console.log('⚠️ Resposta inesperada da API Imagen:', imageData);
//         imageWarning = "A API do Imagen retornou uma resposta inesperada.";
//       }
//     } catch (imageError: any) {
//       console.error('❌ Erro na geração de imagem:', imageError.message);
//       imageWarning = `Não foi possível gerar a imagem: ${imageError.message}`;
      
//       // Se a imagem falhou, pelo menos retornamos o texto - similar ao padrão OpenAI
//       if (!textWarning) {
//         console.log('📝 Retornando apenas o conteúdo de texto gerado');
//       }
//     }

//     // Preparar resposta - mesmo padrão da OpenAI
//     const warnings = [textWarning, imageWarning].filter(Boolean);
//     const warningMessage = warnings.length > 0 ? warnings.join(' ') : undefined;

//     const response = {
//       imageUrl,
//       title: postContent.title,
//       body: postContent.body,
//       hashtags: postContent.hashtags,
//       ...(warningMessage && { warning: warningMessage })
//     };

//     console.log('🎉 Processamento concluído:', {
//       textoGerado: !textWarning,
//       imagemGerada: Boolean(imageUrl),
//       warnings: warnings.length
//     });

//     return NextResponse.json(response);

//   } catch (error: any) {
//     console.error('💥 Erro crítico na rota /api/generate-image:', error);

//     // Fallback final - mesmo padrão da OpenAI
//     try {
//       const { ...formData } = await req.json().catch(() => ({}));
//       const fallbackContent = generateFallbackContent(formData);
      
//       return NextResponse.json({
//         imageUrl: null,
//         title: fallbackContent.title,
//         body: fallbackContent.body,
//         hashtags: fallbackContent.hashtags,
//         warning: 'Houve um problema com as APIs. Conteúdo gerado como fallback.'
//       });
//     } catch {
//       return NextResponse.json({
//         error: error.message || 'Ocorreu um erro interno no servidor.'
//       }, { status: 500 });
//     }
//   }
// }