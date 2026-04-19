export type ConversationContextType = 'memory' | 'thread' | 'main';

export type MessageKind = 'text' | 'system';

export interface MessageRow {
  id: string;
  couple_id: string;
  context_type: ConversationContextType;
  context_id: string | null;
  author_id: string | null;
  kind: MessageKind;
  body: string | null;
  metadata: MessageMetadata;
  reply_to: string | null;
  created_at: string;
  edited_at: string | null;
}

export type MessageMetadata =
  | { event: 'memory.created' }
  | { event: 'memory.edited'; diff: MemoryDiff }
  | {
      event: 'topic.pushed';
      topicId: string;
      questionRef:
        | { kind: 'builtin'; index: number }
        | { kind: 'custom'; id: string };
      setNumber: 1 | 2 | 3 | 4;
      questionText: string;
    }
  | { event: 'topic.discussed'; topicId: string; by: string }
  | { event: 'topic.undiscussed'; topicId: string; by: string }
  | Record<string, never>; // pour les messages texte

export interface MemoryDiff {
  title?: { from: string; to: string };
  description?: { from: string | null; to: string | null };
  date?: { from: string; to: string };
  photosAdded?: number;
  photosRemoved?: number;
}

export interface ThreadTopicRow {
  id: string;
  couple_id: string;
  question_index: number | null;
  custom_question_id: string | null;
  pushed_by: string;
  pushed_at: string;
  discussed_at: string | null;
  discussed_by: string | null;
}

export interface MessageReadRow {
  message_id: string;
  user_id: string;
  read_at: string;
}

export interface OptimisticMessage extends Omit<MessageRow, 'id'> {
  id: string; // id temporaire côté client
  status: 'sending' | 'sent' | 'failed';
}
