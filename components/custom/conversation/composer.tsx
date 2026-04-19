'use client';

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ComposerProps {
  onSend: (body: string) => Promise<void> | void;
  onTyping?: () => void;
  leftSlot?: ReactNode;
  placeholder?: string;
}

export function Composer({ onSend, onTyping, leftSlot, placeholder }: ComposerProps) {
  const [value, setValue] = useState('');
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      await onSend(trimmed);
      setValue('');
    } finally {
      setSending(false);
    }
  }

  function handleKey(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit();
    } else if (onTyping) {
      onTyping();
    }
  }

  return (
    <form
      onSubmit={submit}
      className="flex items-end gap-2 rounded-[1.4rem] border border-white/10 bg-[#151922]/78 p-2 backdrop-blur-xl"
    >
      {leftSlot}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKey}
        placeholder={placeholder ?? 'Message…'}
        rows={1}
        className={cn(
          'flex-1 resize-none rounded-[1rem] bg-transparent px-3 py-2 text-sm text-foreground',
          'placeholder:text-muted-foreground focus:outline-none'
        )}
      />
      <button
        type="submit"
        disabled={sending || value.trim().length === 0}
        aria-label="Envoyer"
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-full',
          'bg-[linear-gradient(180deg,#a7bfff,#7ea0ff)] text-[#09111f]',
          'disabled:opacity-40'
        )}
      >
        <Send className="h-4 w-4" />
      </button>
    </form>
  );
}
