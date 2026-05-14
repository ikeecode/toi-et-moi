'use client';

import { Plus } from 'lucide-react';
import { Conversation } from '@/components/custom/conversation/conversation';
import { PickQuestionDialog } from '@/components/custom/pick-question-dialog';
import { QUESTIONS } from '@/lib/questions';
import type {
  MessageRow,
  ThreadTopicRow,
} from '@/lib/conversations/types';

interface CustomQuestion {
  id: string;
  text: string;
}

interface Props {
  coupleId: string;
  currentUserId: string;
  otherUserId: string | null;
  authorNameById: Record<string, string>;
  initialMessages: MessageRow[];
  initialReads: Record<string, string[]>;
  topics: ThreadTopicRow[];
  customQuestions: CustomQuestion[];
}

export function QuestionsChat(props: Props) {
  const pushedBuiltinIndices = props.topics
    .filter((t) => t.question_index !== null)
    .map((t) => t.question_index!) as number[];
  const pushedCustomIds = props.topics
    .filter((t) => t.custom_question_id !== null)
    .map((t) => t.custom_question_id!);

  const topicDiscussedCount = props.topics.filter((t) => t.discussed_at).length;
  const totalQuestions = QUESTIONS.length + props.customQuestions.length;

  return (
    <div className="mx-auto flex h-[calc(100svh-6rem)] w-full max-w-2xl flex-col px-4 pb-4">
      <div className="flex items-center justify-between py-3">
        <div>
          <p className="section-kicker">Rituel</p>
          <p className="mt-1 text-sm text-foreground">
            {topicDiscussedCount} / {totalQuestions} questions discutées
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <Conversation
          coupleId={props.coupleId}
          currentUserId={props.currentUserId}
          otherUserId={props.otherUserId}
          contextType="main"
          contextId={null}
          initialMessages={props.initialMessages}
          initialReads={props.initialReads}
          authorNameById={props.authorNameById}
          placeholder="Écrire à votre partenaire…"
          composerSlot={
            <PickQuestionDialog
              customQuestions={props.customQuestions}
              pushedBuiltinIndices={pushedBuiltinIndices}
              pushedCustomIds={pushedCustomIds}
              trigger={
                <button
                  type="button"
                  aria-label="Piocher une question"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06] text-foreground"
                >
                  <Plus className="h-5 w-5" />
                </button>
              }
            />
          }
        />
      </div>
    </div>
  );
}
