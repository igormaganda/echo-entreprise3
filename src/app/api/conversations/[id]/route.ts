import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/conversations/[id] - Get conversation with all messages
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const conversation = await db.conversation.findUnique({
      where: { id },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation introuvable' }, { status: 404 });
    }

    return NextResponse.json(conversation);
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

// PATCH /api/conversations/[id] - Update conversation (rename)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { title } = body;

    if (!title) {
      return NextResponse.json({ error: 'Titre requis' }, { status: 400 });
    }

    const conversation = await db.conversation.update({
      where: { id },
      data: { title },
    });

    return NextResponse.json(conversation);
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

// DELETE /api/conversations/[id] - Delete conversation and messages
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Messages are deleted via cascade
    await db.conversation.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
