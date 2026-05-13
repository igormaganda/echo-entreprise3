'use client';

import { ChatSidebar } from '@/components/chat/chat-sidebar';
import { ChatMessages } from '@/components/chat/chat-messages';
import { ChatInput } from '@/components/chat/chat-input';

export default function Home() {
  return (
    <div className="flex h-screen bg-background">
      <ChatSidebar />
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between border-b px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="hidden lg:block" /> {/* Spacer for sidebar toggle */}
            <div>
              <h1 className="text-sm font-semibold">Echo Entreprise</h1>
              <p className="text-xs text-muted-foreground">
                Assistant IA professionnel
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 dark:bg-emerald-950">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                GLM 4.7
              </span>
            </div>
          </div>
        </header>

        {/* Messages */}
        <ChatMessages />

        {/* Input */}
        <ChatInput />
      </main>
    </div>
  );
}
