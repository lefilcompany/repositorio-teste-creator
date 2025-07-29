// app/api/generate-image/route.ts
<<<<<<< HEAD
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;

  // Extrai o prompt já construído e os outros dados do corpo da requisição
  const { prompt: imagePrompt, ...formData } = await req.json();

  if (!apiKey) {
    return NextResponse.json({ error: 'A chave da API da OpenAI não foi configurada.' }, { status: 500 });
  }

=======
// import { NextRequest, NextResponse } from 'next/server';

// export async function POST(req: NextRequest) {
//   const apiKey = process.env.OPENAI_API_KEY;

//   // Extrai o prompt já construído e os outros dados do corpo da requisição
//   const { prompt: imagePrompt, ...formData } = await req.json();

//   if (!apiKey) {

//     return NextResponse.json({ error: 'A chave da API da OpenAI não foi configurada.' }, { status: 500 });
//   }

//   if (!imagePrompt) {
//     return NextResponse.json({ error: 'O prompt da imagem é obrigatório.' }, { status: 400 });
//   }

//   // Constrói um prompt para a geração de texto (post)
//   const textPrompt = `
//     Com base nas seguintes informações, crie um post para a plataforma ${formData.platform}:
//     - Marca/Tema: ${formData.brandTheme}
//     - Objetivo do Post: ${formData.objective}
//     - Descrição da Ideia: ${formData.description}
//     - Público-alvo: ${formData.audience}
//     - Tom de Voz: ${formData.tone}

//     Responda em formato JSON com as seguintes chaves: "title" (um título criativo e curto), "body" (a legenda do post, com quebras de linha representadas por \\n), e "hashtags" (um array de 5 a 7 hashtags relevantes, sem o caractere '#').
//   `;

//   try {
//     // Geração da Imagem
//     const imageResponse = await fetch('https://api.openai.com/v1/images/generations', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
//       body: JSON.stringify({
//         model: 'dall-e-3',
//         prompt: imagePrompt,
//         n: 1,
//         size: '1024x1024',
//         quality: 'hd',
//       }),
//     });

//     if (!imageResponse.ok) {
//       const errorData = await imageResponse.json();
//       console.error('Erro da API de Imagem da OpenAI:', errorData);
//       return NextResponse.json({ error: 'Falha ao gerar a imagem.', details: errorData }, { status: imageResponse.status });
//     }

//     const imageData = await imageResponse.json();
//     const imageUrl = imageData.data[0].url;

//     // Geração do Texto
//     const textResponse = await fetch('https://api.openai.com/v1/chat/completions', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
//         body: JSON.stringify({
//             model: 'gpt-4-turbo',
//             messages: [{ role: 'user', content: textPrompt }],
//             response_format: { type: "json_object" },
//             temperature: 0.7,
//         }),
//     });

//     if (!textResponse.ok) {
//         const errorData = await textResponse.json();
//         console.error('Erro da API de Texto da OpenAI:', errorData);
//         // Mesmo que o texto falhe, vamos retornar a imagem para o usuário
//         return NextResponse.json({ imageUrl, title: "Erro ao gerar legenda", body: "Não foi possível gerar o conteúdo do post, mas sua imagem está pronta!", hashtags: [] });
//     }

//     const textData = await textResponse.json();
//     const postContent = JSON.parse(textData.choices[0].message.content);

//     return NextResponse.json({
//       imageUrl,
//       title: postContent.title,
//       body: postContent.body,
//       hashtags: postContent.hashtags,
//     });

//   } catch (error) {
//     console.error('Erro ao chamar a API da OpenAI:', error);
//     return NextResponse.json({ error: 'Ocorreu um erro interno no servidor.' }, { status: 500 });
//   }
// }

// app/api/generate-image/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { VertexAI } from '@google-cloud/vertexai';

export async function POST(req: NextRequest) {
  const gcloudProject = process.env.GCLOUD_PROJECT;
  const gcloudLocation = process.env.GCLOUD_LOCATION;
  const gcloudCredentials = process.env.GOOGLE_CREDENTIALS;

  const { prompt: imagePrompt, ...formData } = await req.json();

  if (!gcloudProject || !gcloudLocation || !gcloudCredentials) {
    return NextResponse.json({ error: 'As credenciais do Google Cloud não foram configuradas.' }, { status: 500 });
  }
>>>>>>> a658bdceab3a96d4046a1c9e2cb25d85871f3049
  if (!imagePrompt) {
    return NextResponse.json({ error: 'O prompt da imagem é obrigatório.' }, { status: 400 });
  }

<<<<<<< HEAD
  // Constrói um prompt para a geração de texto (post)
  const textPrompt = `
    Com base nas seguintes informações, crie um post para a plataforma ${formData.platform}:
    - Marca/Tema: ${formData.brandTheme}
=======
  let credentials;
  try {
    credentials = JSON.parse(gcloudCredentials);
  } catch (error) {
    return NextResponse.json({ error: 'Credenciais JSON inválidas.' }, { status: 500 });
  }

  const textPrompt = `
    Com base nas seguintes informações, crie um post para a plataforma ${formData.platform}:
    - Marca: ${formData.brand}
    - Tema: ${formData.theme}
>>>>>>> a658bdceab3a96d4046a1c9e2cb25d85871f3049
    - Objetivo do Post: ${formData.objective}
    - Descrição da Ideia: ${formData.description}
    - Público-alvo: ${formData.audience}
    - Tom de Voz: ${formData.tone}
<<<<<<< HEAD

    Responda em formato JSON com as seguintes chaves: "title" (um título criativo e curto), "body" (a legenda do post, com quebras de linha representadas por \\n), e "hashtags" (um array de 5 a 7 hashtags relevantes, sem o caractere '#').
  `;

  try {
    // Geração da Imagem
    const imageResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: imagePrompt,
        n: 1,
        size: '1024x1024',
        quality: 'hd',
      }),
    });

    if (!imageResponse.ok) {
      const errorData = await imageResponse.json();
      console.error('Erro da API de Imagem da OpenAI:', errorData);
      return NextResponse.json({ error: 'Falha ao gerar a imagem.', details: errorData }, { status: imageResponse.status });
    }

    const imageData = await imageResponse.json();
    const imageUrl = imageData.data[0].url;

    // Geração do Texto
    const textResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
            model: 'gpt-4-turbo',
            messages: [{ role: 'user', content: textPrompt }],
            response_format: { type: "json_object" },
            temperature: 0.7,
        }),
    });

    if (!textResponse.ok) {
        const errorData = await textResponse.json();
        console.error('Erro da API de Texto da OpenAI:', errorData);
        // Mesmo que o texto falhe, vamos retornar a imagem para o usuário
        return NextResponse.json({ imageUrl, title: "Erro ao gerar legenda", body: "Não foi possível gerar o conteúdo do post, mas sua imagem está pronta!", hashtags: [] });
    }

    const textData = await textResponse.json();
    const postContent = JSON.parse(textData.choices[0].message.content);
=======
    Responda em formato JSON com as seguintes chaves: "title" (um título criativo e curto), "body" (a legenda do post, com quebras de linha representadas por \n), e "hashtags" (um array de 5 a 7 hashtags relevantes, sem o caractere '#').
  `;

  try {
    // Configuração corrigida do VertexAI
    const vertex_ai = new VertexAI({
      project: gcloudProject,
      location: gcloudLocation,
      googleAuthOptions: {
        credentials: credentials,
      },
      // NÃO definir apiEndpoint - deixar que a biblioteca use o padrão
    });

    console.log('Configuração VertexAI criada com sucesso');

    // PRIMEIRO: Gerar o texto (mais estável)
    console.log('Iniciando geração de texto...');
    const textModel = vertex_ai.getGenerativeModel({
      model: 'gemini-1.5-pro', // Modelo mais estável
    });

    const textRequest: any = {
      contents: [{
        role: 'user',
        parts: [{ text: textPrompt }]
      }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
      safetySettings: [
        { 
          category: 'HARM_CATEGORY_HATE_SPEECH' as any, 
          threshold: 'BLOCK_MEDIUM_AND_ABOVE' as any 
        },
        { 
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT' as any, 
          threshold: 'BLOCK_MEDIUM_AND_ABOVE' as any 
        },
        { 
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT' as any, 
          threshold: 'BLOCK_MEDIUM_AND_ABOVE' as any 
        },
        { 
          category: 'HARM_CATEGORY_HARASSMENT' as any, 
          threshold: 'BLOCK_MEDIUM_AND_ABOVE' as any 
        },
      ],
    };

    const textGenerationResponse = await textModel.generateContent(textRequest);
    console.log('Texto gerado com sucesso');

    if (!textGenerationResponse.response.candidates || !textGenerationResponse.response.candidates[0]) {
      throw new Error('Erro na geração de texto: resposta inválida da API.');
    }

    const textResponseData = textGenerationResponse.response.candidates[0].content.parts[0].text;
    let postContent;
    
    try {
      postContent = JSON.parse(textResponseData);
    } catch (parseError) {
      console.error('Erro ao fazer parse do JSON:', textResponseData);
      throw new Error('Erro ao processar a resposta de texto da API.');
    }

    // SEGUNDO: Tentar gerar a imagem (se falhar, retornar apenas o texto)
    let imageUrl = '';
    
    try {
      console.log('Iniciando geração de imagem...');
      
      // Para geração de imagem, usar um modelo diferente
      const imageModel = vertex_ai.getGenerativeModel({ 
        model: 'imagegeneration@006' // Modelo que pode trabalhar com imagens
      });

      // Criar um prompt mais específico para descrição de imagem
      const imageDescriptionPrompt = `Descreva uma imagem que represente visualmente este post: "${postContent.title}" - ${postContent.body}. Descreva em detalhes a imagem ideal para este conteúdo, incluindo cores, estilo, elementos visuais e composição.`;

      const imageDescRequest: any = {
        contents: [{
          role: 'user',
          parts: [{ text: imageDescriptionPrompt }]
        }],
        generationConfig: {
          temperature: 0.6,
          maxOutputTokens: 1024,
        },
      };

      const imageDescResponse = await imageModel.generateContent(imageDescRequest);
      
      if (imageDescResponse.response.candidates && imageDescResponse.response.candidates[0]) {
        const imageDescription = imageDescResponse.response.candidates[0].content.parts[0].text;
        console.log('Descrição da imagem gerada:', imageDescription);
        
        // Por enquanto, retornar uma URL placeholder ou usar um serviço de imagem alternativo
        imageUrl = `data:image/svg+xml;base64,${Buffer.from(
          `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#f0f0f0"/>
            <text x="50%" y="50%" font-family="Arial" font-size="16" fill="#333" text-anchor="middle" dy="0.3em">
              Imagem: ${postContent.title}
            </text>
          </svg>`
        ).toString('base64')}`;
      }
      
    } catch (imageError) {
      console.warn('Falha na geração de imagem, continuando apenas com texto:', imageError);
      // Criar uma imagem placeholder simples
      imageUrl = `data:image/svg+xml;base64,${Buffer.from(
        `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="#e3f2fd"/>
          <circle cx="200" cy="150" r="50" fill="#2196f3"/>
          <text x="200" y="250" font-family="Arial" font-size="14" fill="#1976d2" text-anchor="middle">
            ${postContent.title || 'Post Gerado'}
          </text>
          <text x="200" y="280" font-family="Arial" font-size="12" fill="#666" text-anchor="middle">
            Conteúdo para ${formData.platform}
          </text>
        </svg>`
      ).toString('base64')}`;
    }

    console.log('Processo concluído com sucesso');
>>>>>>> a658bdceab3a96d4046a1c9e2cb25d85871f3049

    return NextResponse.json({
      imageUrl,
      title: postContent.title,
      body: postContent.body,
      hashtags: postContent.hashtags,
    });

<<<<<<< HEAD
  } catch (error) {
    console.error('Erro ao chamar a API da OpenAI:', error);
    return NextResponse.json({ error: 'Ocorreu um erro interno no servidor.' }, { status: 500 });
=======
  } catch (error: any) {
    console.error('Erro detalhado:', error);
    
    let errorMessage = 'Ocorreu um erro interno no servidor.';
    
    // Tratamento específico para diferentes tipos de erro
    if (error.message?.includes('ENOTFOUND')) {
      errorMessage = 'Erro de conectividade com o Google Cloud. Verifique sua conexão com a internet e as configurações de região.';
    } else if (error.message?.includes('authentication')) {
      errorMessage = 'Erro de autenticação. Verifique suas credenciais do Google Cloud.';
    } else if (error.message?.includes('quota')) {
      errorMessage = 'Cota da API excedida. Tente novamente mais tarde.';
    } else if (error.code) {
      switch (error.code) {
        case 7: // PERMISSION_DENIED
          errorMessage = 'Permissão negada. Verifique as credenciais e permissões do Google Cloud.';
          break;
        case 8: // RESOURCE_EXHAUSTED
          errorMessage = 'Cota da API excedida. Tente novamente mais tarde.';
          break;
        case 3: // INVALID_ARGUMENT
          errorMessage = 'Argumentos inválidos na requisição.';
          break;
        case 14: // UNAVAILABLE
          errorMessage = 'Serviço temporariamente indisponível. Tente novamente.';
          break;
        default:
          errorMessage = error.message || errorMessage;
      }
    } else {
      errorMessage = error.message || errorMessage;
    }

    return NextResponse.json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
>>>>>>> a658bdceab3a96d4046a1c9e2cb25d85871f3049
  }
}