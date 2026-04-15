import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function PwaUpdatePrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ', r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return (
    <AnimatePresence>
      {(offlineReady || needRefresh) && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 left-4 right-4 z-[100] bg-white rounded-2xl shadow-2xl border border-teal-primary/20 p-4 flex flex-col gap-3"
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-black text-dark-text">
                {offlineReady ? 'অ্যাপ অফলাইনে ব্যবহারের জন্য প্রস্তুত' : '🔄 নতুন আপডেট পাওয়া গেছে!'}
              </h3>
              <p className="text-xs text-gray-text mt-1 font-bold">
                {offlineReady
                  ? 'ইন্টারনেট ছাড়াই অ্যাপ ব্যবহার করতে পারবেন।'
                  : 'নতুন ফিচার পেতে অ্যাপটি আপডেট করুন।'}
              </p>
            </div>
            <button onClick={close} className="p-1 text-gray-text hover:text-dark-text">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {needRefresh && (
            <button
              onClick={() => updateServiceWorker(true)}
              className="w-full h-10 bg-[#00BFA6] text-white rounded-xl font-black text-xs flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              এখনই আপডেট করুন
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
