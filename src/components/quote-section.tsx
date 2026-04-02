'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuote } from '../../src/services/hooks';

// Fallback quotes for when API fails
const fallbackQuotes = [
  { content: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { content: "Life is what happens to you while you're busy making other plans.", author: "John Lennon" },
  { content: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { content: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
  { content: "The only impossible journey is the one you never begin.", author: "Tony Robbins" },
  { content: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" }
];

export function QuoteSection() {
  const { quote, loading, error, refetch } = useQuote();
  const [mounted, setMounted] = useState(false);
  const [fallbackQuote, setFallbackQuote] = useState(fallbackQuotes[0]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-refresh quote every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (error) {
        // If API is failing, use fallback quotes
        const newQuote = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
        setFallbackQuote(newQuote);
      } else {
        // Use API to get new quote
        refetch();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [error, refetch]);

  // Determine which quote to display
  const displayQuote = () => {
    if (!mounted) {
      return fallbackQuotes[0];
    }

    if (error) {
      return fallbackQuote;
    }

    return quote || fallbackQuotes[0];
  };

  const currentQuote = displayQuote();

  return (
    <motion.div
      className="fixed left-0 right-0 top-0 z-40"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <div className="mx-auto flex w-full items-center justify-start py-3 pl-4 pr-[260px] md:pl-6 md:pr-[300px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuote.content}
            className="relative w-full max-w-[980px] rounded-2xl bg-gradient-to-b from-white/11 via-white/7 to-white/4 px-4 py-3 text-center shadow-[0_8px_24px_rgba(0,0,0,0.18),0_0_0_1px_rgba(255,255,255,0.04)] backdrop-blur-md md:px-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <div className="pointer-events-none absolute inset-[1px] rounded-[15px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),inset_0_1px_18px_rgba(255,255,255,0.05)]" />
            <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_14%_18%,rgba(255,255,255,0.12),transparent_38%),radial-gradient(circle_at_86%_88%,rgba(148,163,184,0.08),transparent_42%)]" />
            <div
              className="relative z-10 text-sm font-light italic leading-relaxed text-white drop-shadow-lg md:text-base"
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              &ldquo;{currentQuote.content}&rdquo;
            </div>
            {currentQuote.author && (
              <motion.div
                className="relative z-10 mt-2 text-xs font-medium text-white/75 md:text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                — {currentQuote.author}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}