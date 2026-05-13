'use client';

import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { useChatStore } from '@/lib/chat-store';
import { Bot, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ChatMessages() {
  const { messages, streamingContent, isLoading, activeConversationId } = useChatStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  if (!activeConversationId && messages.length === 0) {
    return <WelcomeScreen />;
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      <div className="mx-auto max-w-3xl space-y-6">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {isLoading && streamingContent && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <Bot className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="min-w-0 flex-1 rounded-2xl rounded-tl-sm bg-muted p-4">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{streamingContent}</ReactMarkdown>
              </div>
              <span className="mt-1 inline-block h-4 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            </div>
          </div>
        )}

        {isLoading && !streamingContent && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <Bot className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Echo réfléchit...</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: { role: string; content: string } }) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-emerald-100 dark:bg-emerald-900/30'
        )}
      >
        {isUser ? (
          <User className="h-4 w-4" />
        ) : (
          <Bot className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        )}
      </div>
      <div
        className={cn(
          'min-w-0 max-w-[80%] rounded-2xl px-4 py-3',
          isUser
            ? 'rounded-tr-sm bg-primary text-primary-foreground'
            : 'rounded-tl-sm bg-muted'
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap text-sm">{message.content}</p>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

function WelcomeScreen() {
  const suggestions = [
    {
      icon: '💼',
      title: 'Rédaction professionnelle',
      text: 'Rédige un email formel pour demander une réunion avec un client.',
    },
    {
      icon: '📊',
      title: 'Analyse de données',
      text: 'Aide-moi à analyser les tendances de ventes du dernier trimestre.',
    },
    {
      icon: '💻',
      title: 'Développement',
      text: 'Crée une fonction TypeScript pour valider des adresses email.',
    },
    {
      icon: '📋',
      title: 'Planification',
      text: 'Propose un plan de projet pour le lancement d\'une application mobile.',
    },
  ];

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/30">
          <Bot className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Bienvenue sur Echo Entreprise</h1>
        <p className="text-center text-muted-foreground">
          Votre assistant IA professionnel propulsé par GLM 4.7
        </p>
      </div>

      <div className="grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
        {suggestions.map((suggestion, i) => (
          <SuggestionCard key={i} {...suggestion} />
        ))}
      </div>
    </div>
  );
}

function SuggestionCard({ icon, title, text }: { icon: string; title: string; text: string }) {
  const { setStreamingContent } = useChatStore();

  const handleClick = () => {
    const input = document.getElementById('chat-input') as HTMLTextAreaElement;
    if (input) {
      input.value = text;
      input.focus();
      // Trigger the input event
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  };

  return (
    <button
      onClick={handleClick}
      className="group flex flex-col gap-2 rounded-xl border bg-card p-4 text-left transition-all hover:border-emerald-200 hover:shadow-md dark:hover:border-emerald-800"
    >
      <span className="text-lg">{icon}</span>
      <span className="text-sm font-medium">{title}</span>
      <span className="text-xs text-muted-foreground line-clamp-2">{text}</span>
    </button>
  );
}
