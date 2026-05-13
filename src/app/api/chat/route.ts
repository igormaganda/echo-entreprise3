import ZAI from 'z-ai-web-dev-sdk';
import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { message, conversationId } = await req.json();

    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'Message requis' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get or create conversation
    let conversation;
    if (conversationId) {
      conversation = await db.conversation.findUnique({
        where: { id: conversationId },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      });
      if (!conversation) {
        return new Response(JSON.stringify({ error: 'Conversation introuvable' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } else {
      // Create new conversation with title from first message
      const titlePreview = message.length > 50 ? message.substring(0, 50) + '...' : message;
      conversation = await db.conversation.create({
        data: {
          title: titlePreview,
          model: 'glm-4',
        },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      });
    }

    // Save user message
    await db.message.create({
      data: {
        role: 'user',
        content: message,
        conversationId: conversation.id,
      },
    });

    // Build message history for GLM 4.7
    const systemPrompt = {
      role: 'assistant' as const,
      content: `Tu es Echo, un assistant IA d'entreprise intelligent et professionnel. Tu aides les utilisateurs avec diverses tâches : rédaction, analyse, programmation, recherche d'informations, et plus encore. Tu réponds toujours en français de manière claire, structurée et professionnelle. Tu utilises le format Markdown pour structurer tes réponses quand c'est pertinent.`,
    };

    const historyMessages = conversation.messages.map((msg) => ({
      role: (msg.role === 'assistant' ? 'assistant' : 'user') as 'assistant' | 'user',
      content: msg.content,
    }));

    const messages = [systemPrompt, ...historyMessages, { role: 'user' as const, content: message }];

    // Initialize ZAI SDK (GLM 4.7)
    const zai = await ZAI.create();

    // Stream the response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let fullContent = '';

        try {
          const completion = await zai.chat.completions.create({
            messages,
            thinking: { type: 'disabled' },
          });

          const responseContent = completion.choices[0]?.message?.content || 'Désolé, je n\'ai pas pu générer de réponse.';
          fullContent = responseContent;

          // Send the full response as a single chunk (since z-ai-web-dev-sdk doesn't support streaming)
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'content', content: responseContent })}\n\n`)
          );

          // Send done signal
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'done', conversationId: conversation.id })}\n\n`)
          );
        } catch (error: unknown) {
          const errorMsg = error instanceof Error ? error.message : 'Erreur inconnue';
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', error: errorMsg })}\n\n`)
          );
        } finally {
          // Save assistant message to database
          if (fullContent) {
            try {
              await db.message.create({
                data: {
                  role: 'assistant',
                  content: fullContent,
                  conversationId: conversation.id,
                },
              });
            } catch {
              // Log but don't fail the stream
            }
          }
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Erreur serveur';
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
