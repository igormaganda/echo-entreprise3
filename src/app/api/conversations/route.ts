import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/conversations - List all conversations
export async function GET() {
  try {
    const conversations = await db.conversation.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    return NextResponse.json(conversations);
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

// POST /api/conversations - Create new conversation
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title } = body;

    const conversation = await db.conversation.create({
      data: {
        title: title || 'Nouvelle conversation',
        model: 'glm-4',
      },
    });

    return NextResponse.json(conversation, { status: 201 });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Erreur serveur';
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
