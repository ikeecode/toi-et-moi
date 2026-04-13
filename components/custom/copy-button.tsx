'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: some browsers block clipboard in non-secure contexts
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="cta-primary shrink-0 px-5 py-2.5"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4" />
          Copié !
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          Copier
        </>
      )}
    </button>
  );
}
