import { motion } from 'motion/react';
import { Rocket, ArrowLeft } from 'lucide-react';

interface ComingSoonProps {
  onBack: () => void;
  featureName?: string;
}

export default function ComingSoon({ onBack, featureName }: ComingSoonProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-white rounded-[2.5rem]"
    >
      <motion.div
        animate={{ 
          y: [0, -20, 0],
          rotate: [0, 5, -5, 0]
        }}
        transition={{ 
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="mb-8"
      >
        <Rocket className="w-24 h-24 text-teal-primary" />
      </motion.div>

      <h2 className="text-3xl font-black text-[#1A2E35] mb-2">Coming Soon!</h2>
      <p className="text-[#6B8F8A] font-bold text-lg mb-8">
        {featureName ? `${featureName} ফিচারটি শীঘ্রই আসছে` : 'এই ফিচারটি শীঘ্রই আসছে'}
      </p>

      <div className="w-full max-w-xs h-2 bg-[#F5F9F8] rounded-full overflow-hidden mb-4">
        <motion.div 
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-1/2 h-full bg-teal-primary rounded-full"
        />
      </div>
      
      <p className="text-[10px] font-bold text-teal-primary uppercase tracking-[0.2em] mb-12">
        আমরা কাজ করছি... 🛠️
      </p>

      <button
        onClick={onBack}
        className="flex items-center gap-2 px-8 py-4 bg-[#F5F9F8] text-[#1A2E35] rounded-full font-black text-xs uppercase tracking-widest hover:bg-[#E8F0EF] transition-all active:scale-95"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
    </motion.div>
  );
}
