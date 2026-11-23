'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Copy, Shuffle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { type Quote, fetchOnlineQuote, quoteOfTheDay, randomQuote } from '@/lib/quotes';
import { useAppSelector } from '@/store/hooks';
import { IconButton } from '../ui/primitives';

export function QuoteCard({ compact = false }: { compact?: boolean }) {
  const source = useAppSelector((s) => s.settings.quote.source);
  const [daily] = useState<Quote>(() => quoteOfTheDay());
  const [online, setOnline] = useState<Quote | null>(null);
  const [shuffled, setShuffled] = useState<{ source: string; quote: Quote } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (source !== 'online') return;
    const ctrl = new AbortController();
    void fetchOnlineQuote(ctrl.signal).then((q) => {
      if (!ctrl.signal.aborted) setOnline(q);
    });
    return () => ctrl.abort();
  }, [source]);

  const base = source === 'online' ? (online ?? daily) : daily;
  const quote = shuffled && shuffled.source === source ? shuffled.quote : base;

  const shuffle = async () => {
    setBusy(true);
    const next = source === 'online' ? await fetchOnlineQuote() : randomQuote(quote.content);
    setShuffled({ source, quote: next });
    setBusy(false);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`“${quote.content}” — ${quote.author}`);
      toast.success('Quote copied.');
    } catch {
      toast.error('Could not copy to the clipboard.');
    }
  };

  return (
    <figure
      className={`glass group relative mx-auto flex w-full items-center gap-3 rounded-card px-5 py-4 ${compact ? '' : 'max-w-3xl'}`}
      aria-label="Quote"
    >
      <div className="min-w-0 flex-1 text-center">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={quote.content}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
          >
            <blockquote className={`${compact ? 'text-sm' : 'text-base sm:text-lg'} leading-snug font-medium text-fg italic`}>
              “{quote.content}”
            </blockquote>
            <figcaption className="mt-1.5 text-xs font-medium text-fg-muted sm:text-sm">— {quote.author}</figcaption>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="flex shrink-0 flex-col gap-0.5 sm:flex-row">
        <IconButton label="Show another quote" size="sm" onClick={() => void shuffle()} disabled={busy}>
          <Shuffle className="size-4" aria-hidden />
        </IconButton>
        <IconButton label="Copy quote" size="sm" onClick={() => void copy()}>
          <Copy className="size-4" aria-hidden />
        </IconButton>
      </div>
    </figure>
  );
}
