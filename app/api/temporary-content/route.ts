import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const teamId = searchParams.get('teamId');
  
  if (!userId || !teamId) {
    return NextResponse.json({ error: 'userId and teamId are required' }, { status: 400 });
  }
  
  try {
    // Busca conteúdo temporário não expirado
    const content = await prisma.temporaryContent.findFirst({
      where: { 
        userId,
        teamId,
        expiresAt: {
          gt: new Date()
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json(content || null);
  } catch (error) {
    console.error('Fetch temporary content error', error);
    return NextResponse.json({ error: 'Failed to fetch temporary content' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { 
      userId, 
      teamId, 
      actionId,
      imageUrl, 
      title, 
      body, 
      hashtags, 
      brand, 
      theme, 
      originalId,
      revisions = 0
    } = data;
    
    // Validações básicas
    if (!userId || !teamId || !imageUrl || !title || !body) {
      return NextResponse.json({ 
        error: 'userId, teamId, imageUrl, title and body are required' 
      }, { status: 400 });
    }
    
    // Verificar se o usuário pertence à equipe
    const user = await prisma.user.findFirst({
      where: { 
        id: userId, 
        teamId: teamId 
      }
    });
    
    if (!user) {
      return NextResponse.json({ 
        error: 'User not found or not part of the team' 
      }, { status: 403 });
    }
    
    // Remove conteúdo temporário anterior do mesmo usuário para evitar acúmulo
    await prisma.temporaryContent.deleteMany({
      where: {
        userId,
        teamId
      }
    });
    
    // Remove também conteúdos expirados de todos os usuários para limpeza automática
    await prisma.temporaryContent.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    });
    
    // Cria novo conteúdo temporário (expira em 24 horas)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    const temporaryContent = await prisma.temporaryContent.create({
      data: {
        userId,
        teamId,
        actionId,
        imageUrl,
        title,
        body,
        hashtags,
        brand,
        theme,
        originalId,
        revisions,
        expiresAt
      }
    });
    
    console.log('Conteúdo temporário criado:', temporaryContent.id);
    return NextResponse.json(temporaryContent);
  } catch (error) {
    console.error('Create temporary content error', error);
    return NextResponse.json({ 
      error: 'Failed to create temporary content' 
    }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const data = await req.json();
    const { 
      id,
      userId, 
      teamId, 
      imageUrl, 
      title, 
      body, 
      hashtags, 
      revisions
    } = data;
    
    if (!id || !userId || !teamId) {
      return NextResponse.json({ 
        error: 'id, userId and teamId are required' 
      }, { status: 400 });
    }
    
    // Verificar se o usuário tem permissão para atualizar este conteúdo
    const existingContent = await prisma.temporaryContent.findFirst({
      where: {
        id,
        userId,
        teamId
      }
    });
    
    if (!existingContent) {
      return NextResponse.json({ 
        error: 'Content not found or access denied' 
      }, { status: 404 });
    }
    
    // Atualiza o conteúdo temporário
    const updatedContent = await prisma.temporaryContent.update({
      where: { id },
      data: {
        ...(imageUrl && { imageUrl }),
        ...(title && { title }),
        ...(body && { body }),
        ...(hashtags && { hashtags }),
        ...(revisions !== undefined && { revisions })
      }
    });
    
    return NextResponse.json(updatedContent);
  } catch (error) {
    console.error('Update temporary content error', error);
    return NextResponse.json({ 
      error: 'Failed to update temporary content' 
    }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const userId = searchParams.get('userId');
  const teamId = searchParams.get('teamId');
  
  if (!id || !userId || !teamId) {
    return NextResponse.json({ 
      error: 'id, userId and teamId are required' 
    }, { status: 400 });
  }
  
  try {
    // Verificar se o usuário tem permissão para deletar este conteúdo
    const existingContent = await prisma.temporaryContent.findFirst({
      where: {
        id,
        userId,
        teamId
      }
    });
    
    if (!existingContent) {
      return NextResponse.json({ 
        error: 'Content not found or access denied' 
      }, { status: 404 });
    }
    
    await prisma.temporaryContent.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete temporary content error', error);
    return NextResponse.json({ 
      error: 'Failed to delete temporary content' 
    }, { status: 500 });
  }
}
