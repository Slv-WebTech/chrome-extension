'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import moment from 'moment';

export function DateTimeFooter() {
  const [currentTime, setCurrentTime] = useState<moment.Moment | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCurrentTime(moment());

    const timer = setInterval(() => {
      setCurrentTime(moment());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Don't render anything until mounted to avoid hydration mismatch
  if (!mounted || !currentTime) {
    return null;
  }

  return (
    <motion.div
      className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-40"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
    >
      <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl px-4 py-1 shadow-2xl hover:bg-white/15 transition-all duration-300">
        <div className="flex items-center gap-4 text-white" >
          <motion.div
            className="flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
          >
            <svg className="w-5 h-5 text-blue-300" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            <span className="text-base font-medium drop-shadow-md">
              {currentTime.format('dddd, MMMM Do, YYYY')}
            </span>
          </motion.div>
          <div className="w-px h-6 bg-white/30"></div>
          <motion.div
            className="flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
          >
            <svg className="w-5 h-5 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            <span className="text-base font-semibold font-mono drop-shadow-md tabular-nums">
              {currentTime.format('h:mm:ss A')}
            </span>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}