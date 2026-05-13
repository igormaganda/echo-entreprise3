'use client';

import { useEffect, useState, useCallback } from 'react';
import { useChatStore, type Conversation } from '@/lib/chat-store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Plus,
  MessageSquare,
  Trash2,
  Pencil,
  Check,
  X,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';

export function ChatSidebar() {
  const {
    conversations,
    activeConversationId,
    sidebarOpen,
    setActiveConversationId,
    setConversations,
    setMessages,
    toggleSidebar,
    removeConversation,
    updateConversationTitle,
  } = useChatStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  // Fetch conversations on mount
  const fetchConversations = useCallback(async () => {
    try {
      const resp = await fetch('/api/conversations');
      if (resp.ok) {
        const data = await resp.json();
        setConversations(data);
      }
    } catch {
      // Silently fail
    }
  }, [setConversations]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const handleNewConversation = useCallback(() => {
    setActiveConversationId(null);
    setMessages([]);
  }, [setActiveConversationId, setMessages]);

  const handleSelectConversation = useCallback(
    async (id: string) => {
      setActiveConversationId(id);
      try {
        const resp = await fetch(`/api/conversations/${id}`);
        if (resp.ok) {
          const conv = await resp.json();
          setMessages(conv.messages || []);
        }
      } catch {
        // Silently fail
      }
    },
    [setActiveConversationId, setMessages]
  );

  const handleDeleteConversation = useCallback(
    async (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      try {
        const resp = await fetch(`/api/conversations/${id}`, { method: 'DELETE' });
        if (resp.ok) {
          removeConversation(id);
        }
      } catch {
        // Silently fail
      }
    },
    [removeConversation]
  );

  const handleStartRename = useCallback((e: React.MouseEvent, conv: Conversation) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  }, []);

  const handleSaveRename = useCallback(
    async (id: string) => {
      if (!editTitle.trim()) {
        setEditingId(null);
        return;
      }
      try {
        const resp = await fetch(`/api/conversations/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: editTitle.trim() }),
        });
        if (resp.ok) {
          updateConversationTitle(id, editTitle.trim());
        }
      } catch {
        // Silently fail
      }
      setEditingId(null);
    },
    [editTitle, updateConversationTitle]
  );

  const handleCancelRename = useCallback(() => {
    setEditingId(null);
    setEditTitle('');
  }, []);

  const formatRelativeDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  // Group conversations by time
  const today = new Date();
  const groupByTime = (convs: Conversation[]) => {
    const groups: { label: string; items: Conversation[] }[] = [];
    const todayItems: Conversation[] = [];
    const yesterdayItems: Conversation[] = [];
    const olderItems: Conversation[] = [];

    convs.forEach((conv) => {
      const convDate = new Date(conv.updatedAt);
      const diffDays = Math.floor(
        (today.getTime() - convDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diffDays === 0) todayItems.push(conv);
      else if (diffDays === 1) yesterdayItems.push(conv);
      else olderItems.push(conv);
    });

    if (todayItems.length > 0) groups.push({ label: "Aujourd'hui", items: todayItems });
    if (yesterdayItems.length > 0) groups.push({ label: 'Hier', items: yesterdayItems });
    if (olderItems.length > 0) groups.push({ label: 'Plus ancien', items: olderItems });

    return groups;
  };

  const grouped = groupByTime(conversations);

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Toggle button when sidebar is closed */}
      {!sidebarOpen && (
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="fixed left-4 top-4 z-30 rounded-lg"
        >
          <PanelLeft className="h-5 w-5" />
        </Button>
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 flex h-full w-72 flex-col border-r bg-sidebar text-sidebar-foreground transition-transform duration-300 lg:relative lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
              <MessageSquare className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Echo Entreprise</h2>
              <p className="text-[10px] text-muted-foreground">GLM 4.7</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8 rounded-lg lg:hidden"
          >
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        </div>

        {/* New conversation button */}
        <div className="p-3">
          <Button
            onClick={handleNewConversation}
            className="w-full justify-start gap-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            Nouvelle conversation
          </Button>
        </div>

        {/* Conversations list */}
        <ScrollArea className="flex-1 px-2">
          <div className="space-y-4 pb-4">
            {grouped.map((group) => (
              <div key={group.label}>
                <p className="mb-1 px-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv.id)}
                      className={cn(
                        'group flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-sidebar-accent',
                        activeConversationId === conv.id && 'bg-sidebar-accent'
                      )}
                    >
                      <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        {editingId === conv.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveRename(conv.id);
                                if (e.key === 'Escape') handleCancelRename();
                              }}
                              onClick={(e) => e.stopPropagation()}
                              autoFocus
                              className="flex-1 rounded border bg-background px-1.5 py-0.5 text-xs outline-none"
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSaveRename(conv.id);
                              }}
                              className="rounded p-0.5 hover:bg-accent"
                            >
                              <Check className="h-3 w-3 text-emerald-600" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancelRename();
                              }}
                              className="rounded p-0.5 hover:bg-accent"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <p className="truncate font-medium">{conv.title}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {formatRelativeDate(conv.updatedAt)}
                            </p>
                          </>
                        )}
                      </div>
                      {editingId !== conv.id && (
                        <div className="flex shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => handleStartRename(e, conv)}
                            className="rounded p-1 hover:bg-accent"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteConversation(e, conv.id)}
                            className="rounded p-1 hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {conversations.length === 0 && (
              <div className="py-8 text-center">
                <MessageSquare className="mx-auto mb-2 h-8 w-8 text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground">Aucune conversation</p>
                <p className="text-[10px] text-muted-foreground">
                  Commencez une nouvelle discussion
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-muted-foreground">Connecté — GLM 4.7</span>
          </div>
        </div>
      </aside>
    </>
  );
}
