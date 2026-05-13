'use client';

import { useState, useRef, useCallback, KeyboardEvent } from 'react';
import { useChatStore } from '@/lib/chat-store';
import { Send, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ChatInput() {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const {
    activeConversationId,
    isLoading,
    setIsLoading,
    setStreamingContent,
    addMessage,
    setConversations,
    setActiveConversationId,
    setMessages,
    messages,
  } = useChatStore();

  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
  }, []);

  const handleSend = useCallback(async () => {
    const message = input.trim();
    if (!message || isLoading) return;

    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    setIsLoading(true);
    setStreamingContent('');

    // Add user message to UI
    const tempUserMsg = {
      id: `temp-${Date.now()}`,
      role: 'user' as const,
      content: message,
      conversationId: activeConversationId || '',
      createdAt: new Date().toISOString(),
    };
    addMessage(tempUserMsg);

    try {
      abortControllerRef.current = new AbortController();

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          conversationId: activeConversationId,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error('Erreur serveur');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Pas de réponse');

      const decoder = new TextDecoder();
      let fullContent = '';
      let newConversationId = activeConversationId;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;

          try {
            const data = JSON.parse(line.slice(6));

            if (data.type === 'content') {
              fullContent = data.content;
              setStreamingContent(data.content);
            } else if (data.type === 'done') {
              newConversationId = data.conversationId;
            } else if (data.type === 'error') {
              throw new Error(data.error);
            }
          } catch {
            // Skip malformed JSON lines
          }
        }
      }

      // Add assistant message
      if (fullContent) {
        addMessage({
          id: `resp-${Date.now()}`,
          role: 'assistant',
          content: fullContent,
          conversationId: newConversationId || '',
          createdAt: new Date().toISOString(),
        });
      }

      // If this was a new conversation, set it as active and refresh list
      if (!activeConversationId && newConversationId) {
        setActiveConversationId(newConversationId);
        // Fetch conversations to update sidebar
        const convsResp = await fetch('/api/conversations');
        if (convsResp.ok) {
          const convs = await convsResp.json();
          setConversations(convs);
        }
      }

      setStreamingContent('');
    } catch (error: unknown) {
      if (error instanceof Error && error.name !== 'AbortError') {
        setStreamingContent('');
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [input, isLoading, activeConversationId, addMessage, setIsLoading, setStreamingContent, setConversations, setActiveConversationId, messages]);

  const handleStop = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
    setStreamingContent('');
  }, [setIsLoading, setStreamingContent]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t bg-background px-4 py-4">
      <div className="mx-auto max-w-3xl">
        <div className="relative flex items-end gap-2 rounded-2xl border bg-card p-2 shadow-sm focus-within:border-emerald-300 focus-within:ring-1 focus-within:ring-emerald-200 dark:focus-within:border-emerald-700 dark:focus-within:ring-emerald-800">
          <textarea
            ref={textareaRef}
            id="chat-input"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              adjustTextareaHeight();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Écrivez votre message..."
            rows={1}
            className={cn(
              'flex-1 resize-none bg-transparent px-3 py-2 text-sm outline-none',
              'placeholder:text-muted-foreground',
              'max-h-[200px]'
            )}
          />

          {isLoading ? (
            <Button
              onClick={handleStop}
              size="icon"
              variant="destructive"
              className="h-9 w-9 shrink-0 rounded-xl"
            >
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSend}
              size="icon"
              disabled={!input.trim()}
              className="h-9 w-9 shrink-0 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Echo Entreprise — Propulsé par GLM 4.7 de Z.ai
        </p>
      </div>
    </div>
  );
}
