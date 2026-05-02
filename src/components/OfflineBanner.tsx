import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WifiOff } from 'lucide-react';

export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-0 left-0 right-0 z-[9999] bg-[#FF4D4D] text-white px-4 py-3 flex items-center justify-center gap-3 shadow-lg"
        >
          <WifiOff className="w-5 h-5 animate-pulse" />
          <p className="text-sm font-bold">ইন্টারনেট সংযোগ নেই। আপনি এখন অফলাইনে আছেন।</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
