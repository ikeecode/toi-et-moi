'use client';

import { motion } from 'framer-motion';

export function TypingIndicator({ name }: { name: string }) {
  return (
    <div className="mb-2 flex items-center gap-2 text-[0.7rem] text-muted-foreground">
      <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-current"
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
      <span>{name} écrit…</span>
    </div>
  );
}
