import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Delete, RefreshCw, Sparkles } from 'lucide-react';

interface PinLockProps {
  correctPin: string;
  onSuccess: () => void;
  onLogout: () => void;
  onForgotPin: () => void;
}

export default function PinLock({ correctPin, onSuccess, onLogout, onForgotPin }: PinLockProps) {
  const [pin, setPin] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState(false);

  const handleNumber = (num: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + num);
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  useEffect(() => {
    if (pin.length === 4) {
      if (pin === correctPin) {
        onSuccess();
      } else {
        setError(true);
        setAttempts(prev => prev + 1);
        setTimeout(() => {
          setPin('');
          setError(false);
        }, 500);
      }
    }
  }, [pin, correctPin, onSuccess]);

  useEffect(() => {
    if (attempts >= 3) {
      onLogout();
    }
  }, [attempts, onLogout]);

  return (
    <div className="fixed inset-0 z-[200] bg-bg-light flex flex-col items-center justify-center p-8">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-[320px] flex flex-col items-center"
      >
        <div className="w-20 h-20 rounded-[2rem] bg-teal-primary/10 flex items-center justify-center mb-8 shadow-xl shadow-teal-primary/5">
          <Lock className="w-10 h-10 text-teal-primary" />
        </div>

        <h2 className="text-2xl font-black text-dark-text mb-2">অ্যাপ লক করা আছে</h2>
        <p className="text-[10px] font-black text-gray-text uppercase tracking-widest mb-12">চালিয়ে যেতে ৪-ডিজিটের PIN দিন</p>

        {/* PIN Dots */}
        <div className="flex gap-6 mb-16">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              animate={error ? { x: [0, -10, 10, -10, 10, 0] } : {}}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                pin.length > i 
                  ? 'bg-teal-primary border-teal-primary scale-125 shadow-lg shadow-teal-primary/20' 
                  : 'bg-transparent border-gray-text/20'
              }`}
            />
          ))}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-6 w-full">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleNumber(num.toString())}
              className="w-full aspect-square rounded-2xl bg-white shadow-sm text-2xl font-black text-dark-text active:teal-gradient active:text-white active:scale-90 transition-all border border-bg-light"
            >
              {num}
            </button>
          ))}
          <button 
            onClick={onForgotPin}
            className="w-full aspect-square flex items-center justify-center text-gray-text hover:text-teal-primary active:scale-90 transition-all"
          >
            <RefreshCw className="w-6 h-6" />
          </button>
          <button
            onClick={() => handleNumber('0')}
            className="w-full aspect-square rounded-2xl bg-white shadow-sm text-2xl font-black text-dark-text active:teal-gradient active:text-white active:scale-90 transition-all border border-bg-light"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="w-full aspect-square flex items-center justify-center text-gray-text hover:text-danger-red active:scale-90 transition-all"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>

        {attempts > 0 && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 text-[10px] font-black text-danger-red uppercase tracking-widest"
          >
            আর {3 - attempts} বার চেষ্টা করতে পারবেন
          </motion.p>
        )}

        <div className="mt-12 flex flex-col items-center gap-6">
          <button 
            onClick={onLogout}
            className="text-[10px] font-black text-gray-text uppercase tracking-[0.2em] hover:text-danger-red transition-colors"
          >
            অ্যাকাউন্ট লগআউট করুন
          </button>
          
          <p className="text-[10px] font-black text-gray-text/30 uppercase tracking-[0.2em] flex items-center gap-2">
            <Sparkles className="w-3 h-3" /> Sky Automation Tech
          </p>
        </div>
      </motion.div>
    </div>
  );
}
