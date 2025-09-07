'use client';

import { useState, useEffect } from 'react';
import { useQuote } from '../src/services/hooks';

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
    <div className="fixed top-0 left-0 right-0 z-40    border-white/10">
      <div className="flex items-center justify-center px-4 py-3 max-w-6xl mx-auto">
        {/* Quote content - centered */}
        <div className="text-center">
          <div className="text-white text-sm md:text-base font-medium">
            "{currentQuote.content}"
          </div>
        </div>
      </div>
    </div>
  );
}