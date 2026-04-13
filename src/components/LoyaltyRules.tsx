import React from 'react';
import { Staff } from '../types';
import { Bell, ArrowLeft, Sparkles, Zap, ShieldCheck, Settings } from 'lucide-react';
import { motion } from 'motion/react';

interface LoyaltyRulesProps {
  onBack: () => void;
  currentUser: Staff | null;
}

export default function LoyaltyRules({ onBack }: LoyaltyRulesProps) {
  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <header className="flex items-center gap-3 py-2">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-text hover:text-teal-primary transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-black text-dark-text">লয়্যালটি রুলস</h1>
      </header>

      <div className="bg-white border border-bg-light rounded-[2.5rem] p-8 text-center shadow-sm relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-primary/5 rounded-full -mr-16 -mt-16 blur-2xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-teal-primary/5 rounded-full -ml-12 -mb-12 blur-xl" />

        <motion.div 
          animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="w-24 h-24 mx-auto bg-teal-primary/10 rounded-full flex items-center justify-center mb-6 relative"
        >
          <div className="absolute inset-0 bg-teal-primary/20 rounded-full animate-ping" />
          <Settings className="w-12 h-12 text-teal-primary relative z-10" />
        </motion.div>
        
        <div className="inline-flex items-center px-4 py-1.5 bg-teal-primary/10 text-teal-primary rounded-full text-[10px] font-black uppercase tracking-widest mb-4 border border-teal-primary/20">
          শীঘ্রই আসছে 🚀
        </div>

        <h2 className="text-2xl font-black text-dark-text mb-6">লয়্যালটি রুলস</h2>
        
        <div className="bg-bg-light rounded-3xl p-6 border border-transparent mb-8 relative group">
          <p className="text-sm font-bold text-dark-text leading-relaxed">
            এই ফিচারটি নিয়ে আমরা কাজ করছি! 🛠️<br />
            খুব শীঘ্রই আপনি আপনার ব্যবসার জন্য কাস্টম লয়্যালটি রুলস সেট করতে পারবেন।<br />
            <span className="text-teal-primary">ধৈর্য ধরার জন্য ধন্যবাদ।</span>
          </p>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-bg-light rounded-full overflow-hidden mb-2">
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            className="h-full w-1/3 bg-teal-primary rounded-full"
          />
        </div>
        <p className="text-[8px] font-black text-gray-text uppercase tracking-widest">System is being optimized by Sky Tech...</p>

        <div className="mt-10 grid grid-cols-2 gap-4">
          <div className="p-4 bg-bg-light rounded-2xl flex flex-col items-center gap-2">
            <Zap className="w-5 h-5 text-teal-primary" />
            <span className="text-[8px] font-black text-gray-text uppercase">স্মার্ট রুলস</span>
          </div>
          <div className="p-4 bg-bg-light rounded-2xl flex flex-col items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-primary" />
            <span className="text-[8px] font-black text-gray-text uppercase">অটোমেশন</span>
          </div>
        </div>
      </div>

      <div className="text-center pt-8">
        <p className="text-[10px] font-black text-gray-text uppercase tracking-[0.2em] flex items-center justify-center gap-2">
          <Sparkles className="w-3 h-3 text-teal-primary" /> Sky Automation Tech
        </p>
      </div>
    </div>
  );
}
