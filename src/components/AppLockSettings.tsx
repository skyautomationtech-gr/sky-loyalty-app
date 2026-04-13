import React, { useState, useEffect } from 'react';
import { ArrowLeft, Shield, Lock, CheckCircle2, XCircle, RefreshCw, Sparkles, ShieldCheck, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Toast from './Toast';

interface AppLockSettingsProps {
  onBack: () => void;
}

export default function AppLockSettings({ onBack }: AppLockSettingsProps) {
  const [isEnabled, setIsEnabled] = useState(() => localStorage.getItem('sky_app_lock_enabled') === 'true');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'TOGGLE' | 'SET_PIN' | 'CONFIRM_PIN'>('TOGGLE');
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const handleToggle = () => {
    if (isEnabled) {
      localStorage.removeItem('sky_app_lock_enabled');
      localStorage.removeItem('sky_app_lock_pin');
      setIsEnabled(false);
      setToastMsg('অ্যাপ লক বন্ধ করা হয়েছে 🔓');
      setToastType('success');
      setShowToast(true);
    } else {
      setStep('SET_PIN');
    }
  };

  const handleSetPin = () => {
    if (pin.length === 4) {
      setStep('CONFIRM_PIN');
    }
  };

  const handleConfirmPin = () => {
    if (pin === confirmPin) {
      localStorage.setItem('sky_app_lock_enabled', 'true');
      localStorage.setItem('sky_app_lock_pin', pin);
      setIsEnabled(true);
      setStep('TOGGLE');
      setToastMsg('অ্যাপ লক সফলভাবে চালু হয়েছে! 🔒');
      setToastType('success');
      setShowToast(true);
    } else {
      setToastMsg('PIN মিলছে না');
      setToastType('error');
      setShowToast(true);
      setConfirmPin('');
    }
  };

  return (
    <div className="space-y-6 pb-24">
      <header className="flex items-center gap-3 py-4 px-2 bg-white">
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={onBack} 
          className="p-2 -ml-2 text-gray-text hover:text-teal-primary transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </motion.button>
        <h1 className="text-xl font-black text-dark-text tracking-tight">অ্যাপ লক (PIN)</h1>
      </header>

      <div className="bg-white border border-bg-light rounded-[2.5rem] p-8 shadow-sm space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${isEnabled ? 'bg-teal-primary text-white shadow-lg shadow-teal-primary/20' : 'bg-bg-light text-gray-text/40'}`}>
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-black text-dark-text tracking-tight">অ্যাপ লক চালু করুন</h3>
              <p className="text-[10px] text-gray-text font-black uppercase tracking-widest mt-0.5">অ্যাপ ওপেন করতে PIN লাগবে</p>
            </div>
          </div>
          <button 
            onClick={handleToggle}
            className={`w-14 h-7 rounded-full relative transition-all duration-500 p-1 ${isEnabled ? 'bg-teal-primary' : 'bg-gray-200'}`}
          >
            <motion.div 
              animate={{ x: isEnabled ? 28 : 0 }}
              className="w-5 h-5 bg-white rounded-full shadow-md"
            />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {step === 'SET_PIN' && (
            <motion.div 
              key="set-pin"
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8 pt-8 border-t border-bg-light"
            >
              <div className="text-center space-y-2">
                <p className="text-sm font-black text-dark-text">৪-ডিজিটের PIN দিন</p>
                <p className="text-[10px] text-gray-text font-black uppercase tracking-widest leading-relaxed">আপনার অ্যাপের জন্য একটি নিরাপদ PIN সেট করুন</p>
              </div>
              <div className="flex justify-center">
                <input 
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-40 h-16 bg-bg-light border-2 border-transparent rounded-[1.5rem] text-center text-3xl font-black text-dark-text focus:outline-none focus:border-teal-primary focus:bg-white focus:shadow-xl focus:shadow-teal-primary/10 transition-all tracking-[0.5em] pl-4"
                />
              </div>
              <motion.button 
                whileTap={{ scale: 0.98 }}
                onClick={handleSetPin}
                disabled={pin.length !== 4}
                className="w-full h-14 teal-gradient text-white font-black rounded-2xl shadow-xl shadow-teal-primary/20 uppercase tracking-widest disabled:opacity-50 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                <RefreshCw className="w-5 h-5" />
                চালিয়ে যান
              </motion.button>
            </motion.div>
          )}

          {step === 'CONFIRM_PIN' && (
            <motion.div 
              key="confirm-pin"
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8 pt-8 border-t border-bg-light"
            >
              <div className="text-center space-y-2">
                <p className="text-sm font-black text-dark-text">PIN নিশ্চিত করুন</p>
                <p className="text-[10px] text-gray-text font-black uppercase tracking-widest leading-relaxed">নিশ্চিত করতে পুনরায় PIN দিন</p>
              </div>
              <div className="flex justify-center">
                <input 
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-40 h-16 bg-bg-light border-2 border-transparent rounded-[1.5rem] text-center text-3xl font-black text-dark-text focus:outline-none focus:border-teal-primary focus:bg-white focus:shadow-xl focus:shadow-teal-primary/10 transition-all tracking-[0.5em] pl-4"
                />
              </div>
              <div className="space-y-4">
                <motion.button 
                  whileTap={{ scale: 0.98 }}
                  onClick={handleConfirmPin}
                  disabled={confirmPin.length !== 4}
                  className="w-full h-14 teal-gradient text-white font-black rounded-2xl shadow-xl shadow-teal-primary/20 uppercase tracking-widest disabled:opacity-50 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  <Lock className="w-5 h-5" />
                  লক চালু করুন
                </motion.button>
                <button 
                  onClick={() => {
                    setStep('SET_PIN');
                    setConfirmPin('');
                  }} 
                  className="w-full text-[10px] font-black text-gray-text uppercase tracking-widest hover:text-dark-text transition-colors p-2"
                >
                  পিছনে যান
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="bg-white border border-bg-light rounded-[2.5rem] p-8 space-y-6 shadow-sm">
        <div className="flex items-center gap-3 text-teal-primary">
          <Shield className="w-5 h-5" />
          <p className="text-[10px] font-black uppercase tracking-widest">নিরাপত্তা তথ্য</p>
        </div>
        <ul className="space-y-4">
          {[
            'PIN শুধুমাত্র এই ডিভাইসেই সেভ থাকবে।',
            '৩ বার ভুল PIN দিলে অটোমেটিক লগআউট হয়ে যাবে।',
            'PIN ভুলে গেলে ইমেইল OTP দিয়ে রিসেট করতে পারবেন।'
          ].map((info, i) => (
            <li key={i} className="flex gap-4 text-xs font-bold text-gray-text leading-relaxed">
              <div className="w-5 h-5 rounded-full bg-teal-primary/10 flex items-center justify-center text-teal-primary shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              {info}
            </li>
          ))}
        </ul>
      </div>

      <div className="text-center pt-8">
        <p className="text-[10px] font-black text-gray-text uppercase tracking-[0.3em] flex items-center justify-center gap-2">
          <Sparkles className="w-3 h-3 text-teal-primary" /> Sky Automation Tech
        </p>
      </div>

      <Toast 
        show={showToast} 
        message={toastMsg} 
        type={toastType} 
        onClose={() => setShowToast(false)} 
      />
    </div>
  );
}
