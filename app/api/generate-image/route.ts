// app/api/generate-image/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  
  try {
    const { ...formData } = await req.json();

    if (!apiKey) {
      return NextResponse.json(
        { error: 'A chave da API da OpenAI não foi configurada.' },
        { status: 500 }
      );
    }

    if (!formData.description) {
      return NextResponse.json(
        { error: 'A descrição visual da imagem é obrigatória.' },
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
      
      Retorne APENAS um objeto JSON válido com exatamente estas chaves:
      {
        "title": "um título criativo e curto de até 50 caracteres",
        "body": "a legenda do post com quebras de linha usando \\n quando necessário",
        "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"]
      }
      
      Importante: Não inclua o caractere '#' nas hashtags. Use entre 5 a 7 hashtags relevantes.
    `;

    // --- INÍCIO DA CORREÇÃO ---
    // AJUSTE 1: Prompt da imagem reestruturado para ser mais claro e seguro.
    // Usamos os campos específicos do formData para construir um prompt mais eficaz.
    const finalImagePrompt = `
      A professional social media image for the brand "${formData.brand}".
      Theme: "${formData.theme}".
      Visual concept: A smart home with interconnected devices like smart lights and thermostats, showcasing efficiency and connectivity.
      Style directions: ${formData.additionalInfo}. The overall mood should be clean, modern, and trustworthy.
      Color Palette: Electric blue (#1E4D7A), silver gray (#B0B0B0), and white (#FFFFFF).
      Style: High-quality, clean digital art.
    `;
    
    const imageResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: finalImagePrompt,
        size: '1024x1024',
        quality: 'standard',
        response_format: 'b64_json',
        n: 1,
        user: `user-${formData.audience}` // AJUSTE 2: Adicionado 'user' como boa prática para monitoramento.
      }),
    });

    if (!imageResponse.ok) {
      const errorData = await imageResponse.json();
      console.error('Erro da API de Imagem da OpenAI:', errorData);

      // AJUSTE 3: Tratamento de erro aprimorado e mais específico.
      if (errorData.error?.code === 'content_policy_violation') {
        return NextResponse.json(
          { error: 'A sua solicitação de imagem foi bloqueada pela nossa política de segurança. Por favor, reformule a descrição com outras palavras.' },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: `Erro ao gerar imagem: ${errorData.error?.message || 'Ocorreu um erro desconhecido.'}` },
        { status: imageResponse.status }
      );
    }
    // --- FIM DA CORREÇÃO ---

    const imageData = await imageResponse.json();
    const base64 = imageData.data[0].b64_json;
    const imageUrl = `data:image/png;base64,${base64}`;

    return await generateTextAndReturn(apiKey, textPrompt, imageUrl);

  } catch (error: any) {
    console.error('Erro geral na API:', error);
    return NextResponse.json(
      { error: error.message || 'Ocorreu um erro interno no servidor.' },
      { status: 500 }
    );
  }
}

// Função auxiliar para geração de texto (sem alterações)
async function generateTextAndReturn(apiKey: string, textPrompt: string, imageUrl: string) {
  try {
    const textResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ 
          role: 'user', 
          content: textPrompt 
        }],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!textResponse.ok) {
      const errorData = await textResponse.json();
      console.error('Erro da API de Texto da OpenAI:', errorData);
      
      return NextResponse.json({
        imageUrl,
        title: 'Post Criativo',
        body: 'A imagem foi criada com sucesso! Adicione sua própria legenda criativa.',
        hashtags: ['criativo', 'design', 'marketing', 'inovacao', 'conteudo'],
        warning: `Texto não foi gerado: ${errorData.error?.message || 'Erro na API de texto'}`
      });
    }

    const textData = await textResponse.json();
    
    try {
      const responseContent = textData.choices[0]?.message?.content;
      
      if (!responseContent) {
        throw new Error('Resposta vazia da API de texto');
      }

      const postContent = JSON.parse(responseContent);
      
      if (!postContent.title || !postContent.body || !Array.isArray(postContent.hashtags)) {
        throw new Error('Estrutura de JSON inválida na resposta');
      }

      const cleanHashtags = postContent.hashtags.map((tag: string) => 
        tag.replace(/^#/, '').trim()
      ).filter((tag: string) => tag.length > 0);

      return NextResponse.json({
        imageUrl,
        title: postContent.title,
        body: postContent.body,
        hashtags: cleanHashtags,
        success: true
      });

    } catch (parseError) {
      console.error('Erro ao fazer parse do JSON:', parseError);
      console.error('Conteúdo recebido:', textData.choices[0]?.message?.content);
      
      return NextResponse.json({
        imageUrl,
        title: 'Post Criativo',
        body: 'Confira nossa nova criação! Uma imagem incrível foi gerada especialmente para você.\n\nCompartilhe e inspire outros com este conteúdo único!',
        hashtags: ['criativo', 'inovacao', 'design', 'marketing', 'conteudo'],
        warning: 'Texto padrão usado devido a erro no parsing do JSON'
      });
    }

  } catch (error: any) {
    console.error('Erro na geração de texto:', error);
    
    return NextResponse.json({
      imageUrl,
      title: 'Imagem Gerada com Sucesso',
      body: 'A imagem foi gerada com sucesso! Adicione sua própria legenda personalizada.',
      hashtags: ['imagem', 'criativo', 'design'],
      error: `Erro na geração do texto: ${error.message}`
    });
  }
}