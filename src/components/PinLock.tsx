import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Delete, RefreshCw, Sparkles, Mail, ArrowLeft, CheckCircle2, ShieldCheck, Fingerprint } from 'lucide-react';
import { sendOtpEmail } from '../services/emailService';
import { APP_NAME } from '../constants';

interface PinLockProps {
  correctPin: string;
  userEmail?: string;
  onSuccess: () => void;
  onLogout: () => void;
}

export default function PinLock({ correctPin, userEmail, onSuccess, onLogout }: PinLockProps) {
  const [mode, setMode] = useState<'PIN' | 'FORGOT' | 'OTP' | 'RESET'>('PIN');
  const [pin, setPin] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpExpiry, setOtpExpiry] = useState<number | null>(null);
  const [otpError, setOtpError] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleNumber = (num: string) => {
    if (mode === 'PIN') {
      if (pin.length < 4) setPin(prev => prev + num);
    } else if (mode === 'RESET') {
      if (newPin.length < 4) setNewPin(prev => prev + num);
      else if (confirmPin.length < 4) setConfirmPin(prev => prev + num);
    }
  };

  const handleDelete = () => {
    if (mode === 'PIN') setPin(prev => prev.slice(0, -1));
    else if (mode === 'RESET') {
      if (confirmPin.length > 0) setConfirmPin(prev => prev.slice(0, -1));
      else setNewPin(prev => prev.slice(0, -1));
    }
  };

  const sendOtp = async () => {
    if (!userEmail) return;
    setLoading(true);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setOtpExpiry(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

    try {
      await sendOtpEmail(userEmail, 'User', code);
      setMode('OTP');
    } catch (err: any) {
      console.error('EmailJS Error:', err);
      setOtpError(err.message || 'OTP পাঠাতে ব্যর্থ হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = () => {
    if (Date.now() > (otpExpiry || 0)) {
      setOtpError('OTP এর মেয়াদ শেষ। আবার পাঠান।');
      return;
    }
    if (otp.join('') === generatedOtp) {
      setMode('RESET');
    } else {
      setOtpError('ভুল OTP। আবার চেষ্টা করুন।');
    }
  };

  const handleResetPin = () => {
    if (newPin.length === 4 && newPin === confirmPin) {
      localStorage.setItem('sky_app_lock_pin', newPin);
      onSuccess();
    } else if (newPin !== confirmPin) {
      setOtpError('পিন মেলেনি।');
    }
  };

  useEffect(() => {
    if (mode === 'PIN' && pin.length === 4) {
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
  }, [pin, correctPin, onSuccess, mode]);

  useEffect(() => {
    if (attempts >= 3) {
      onLogout();
    }
  }, [attempts, onLogout]);

  if (mode === 'FORGOT') {
    return (
      <div className="fixed inset-0 z-[200] bg-[#0A0B0D] flex flex-col items-center justify-center p-8">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-primary/10 blur-[120px] rounded-full" />
        </div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[320px] text-center relative z-10">
          <div className="w-20 h-20 rounded-3xl bg-teal-primary/10 flex items-center justify-center mb-8 mx-auto border border-teal-primary/20 backdrop-blur-xl">
            <Mail className="w-10 h-10 text-teal-primary" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">পিন ভুলে গেছেন?</h2>
          <p className="text-sm text-white/40 mb-8">আপনার রেজিস্টার্ড ইমেইলে একটি OTP পাঠানো হবে।</p>
          
          <div className="bg-white/5 p-4 rounded-2xl border border-white/10 mb-8 backdrop-blur-md">
            <p className="text-[9px] font-mono font-bold text-teal-primary uppercase tracking-widest mb-1">Target Email</p>
            <p className="text-sm font-mono font-bold text-white">{userEmail}</p>
          </div>
          
          <button
            onClick={sendOtp}
            disabled={loading}
            className="w-full h-14 teal-gradient text-white font-black rounded-2xl shadow-lg shadow-teal-primary/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Request OTP'}
          </button>
          
          <button onClick={() => setMode('PIN')} className="mt-6 text-white/40 font-bold text-xs flex items-center justify-center gap-2 mx-auto hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> ফিরে যান
          </button>
        </motion.div>
      </div>
    );
  }

  if (mode === 'OTP') {
    return (
      <div className="fixed inset-0 z-[200] bg-[#0A0B0D] flex flex-col items-center justify-center p-8">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-teal-primary/5 blur-[120px] rounded-full" />
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[320px] text-center relative z-10">
          <div className="w-20 h-20 rounded-3xl bg-teal-primary/10 flex items-center justify-center mb-8 mx-auto border border-teal-primary/20 backdrop-blur-xl">
            <ShieldCheck className="w-10 h-10 text-teal-primary" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">OTP ভেরিফিকেশন</h2>
          <p className="text-sm text-white/40 mb-8">আপনার ইমেইলে পাঠানো ৬-ডিজিটের কোডটি দিন।</p>
          
          <div className="flex justify-between gap-2 mb-8">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={el => otpRefs.current[idx] = el}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => {
                  const value = e.target.value;
                  if (!/^\d*$/.test(value)) return;
                  const newOtp = [...otp];
                  newOtp[idx] = value;
                  setOtp(newOtp);
                  if (value && idx < 5) otpRefs.current[idx + 1]?.focus();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Backspace' && !otp[idx] && idx > 0) otpRefs.current[idx - 1]?.focus();
                }}
                className="w-11 h-14 bg-white/5 border border-white/10 rounded-xl text-center text-xl font-mono font-bold text-white focus:border-teal-primary focus:ring-1 focus:ring-teal-primary outline-none transition-all backdrop-blur-md"
              />
            ))}
          </div>

          {otpError && <p className="text-danger-red text-[10px] font-mono font-bold mb-6 uppercase tracking-widest">{otpError}</p>}

          <button
            onClick={verifyOtp}
            className="w-full h-14 teal-gradient text-white font-black rounded-2xl shadow-lg shadow-teal-primary/20 active:scale-95 transition-all"
          >
            ভেরিফাই করুন
          </button>
        </motion.div>
      </div>
    );
  }

  if (mode === 'RESET') {
    return (
      <div className="fixed inset-0 z-[200] bg-[#0A0B0D] flex flex-col items-center justify-center p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[320px] text-center relative z-10">
          <div className="w-20 h-20 rounded-3xl bg-teal-primary/10 flex items-center justify-center mb-8 mx-auto border border-teal-primary/20 backdrop-blur-xl">
            <Lock className="w-10 h-10 text-teal-primary" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">নতুন পিন সেট করুন</h2>
          <p className="text-sm text-white/40 mb-8">আপনার নতুন ৪-ডিজিটের পিন দিন।</p>

          <div className="space-y-6 mb-12">
            <div className="flex flex-col items-center gap-2">
              <div className="flex justify-center gap-4">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className={`w-3 h-3 rounded-full border-2 transition-all duration-300 ${newPin.length > i ? 'bg-teal-primary border-teal-primary shadow-[0_0_10px_rgba(20,184,166,0.5)]' : 'border-white/10'}`} />
                ))}
              </div>
              <p className="text-[9px] font-mono font-bold text-white/30 uppercase tracking-widest">New Security Key</p>
            </div>
            
            {newPin.length === 4 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-2">
                <div className="flex justify-center gap-4">
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} className={`w-3 h-3 rounded-full border-2 transition-all duration-300 ${confirmPin.length > i ? 'bg-teal-primary border-teal-primary shadow-[0_0_10px_rgba(20,184,166,0.5)]' : 'border-white/10'}`} />
                  ))}
                </div>
                <p className="text-[9px] font-mono font-bold text-white/30 uppercase tracking-widest">Confirm Key</p>
              </motion.div>
            )}
          </div>

          {otpError && <p className="text-danger-red text-[10px] font-mono font-bold mb-6 uppercase tracking-widest">{otpError}</p>}

          <div className="grid grid-cols-3 gap-4 w-full mb-10">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'X', 0, 'Del'].map((val) => (
              val === 'X' ? <div key="x" /> :
              val === 'Del' ? (
                <button key="d" onClick={handleDelete} className="aspect-square flex items-center justify-center text-white/40 hover:text-danger-red active:scale-90 transition-all"><Delete /></button>
              ) : (
                <button key={val} onClick={() => handleNumber(val.toString())} className="aspect-square bg-white/5 rounded-2xl font-mono font-bold text-xl text-white border border-white/10 backdrop-blur-md active:bg-teal-primary transition-all">{val}</button>
              )
            ))}
          </div>

          <button
            onClick={handleResetPin}
            disabled={newPin.length < 4 || confirmPin.length < 4}
            className="w-full h-14 teal-gradient text-white font-black rounded-2xl shadow-lg shadow-teal-primary/20 disabled:opacity-20 active:scale-95 transition-all"
          >
            Update Security Key
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[320px] flex flex-col items-center"
      >
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-bold text-[#1E2B5B] mb-2">Enter current PIN</h2>
        </div>

        {/* PIN Squares */}
        <div className="flex gap-4 mb-16">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              animate={error ? { x: [0, -10, 10, -10, 10, 0] } : {}}
              className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center transition-all duration-200 ${
                pin.length > i 
                  ? 'border-[#4ADE80] bg-white shadow-[0_0_15px_rgba(74,222,128,0.2)]' 
                  : error 
                    ? 'border-[#FF4D4D] bg-white'
                    : 'border-[#E2E8F0] bg-white'
              }`}
            >
              {pin.length > i && (
                <span className={`text-2xl font-bold ${error ? 'text-[#FF4D4D]' : 'text-[#4ADE80]'}`}>*</span>
              )}
            </motion.div>
          ))}
        </div>

        {error && (
          <p className="text-[#FF4D4D] text-xs font-bold mb-8 animate-bounce">Oops! Wrong PIN</p>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-x-12 gap-y-8 w-full px-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleNumber(num.toString())}
              className="w-full aspect-square flex items-center justify-center text-2xl font-semibold text-[#1E2B5B] active:scale-90 transition-all"
            >
              {num}
            </button>
          ))}
          <button className="w-full aspect-square flex items-center justify-center text-[#1E2B5B]/20 active:scale-90 transition-all">
            <Fingerprint className="w-8 h-8" />
          </button>
          <button
            onClick={() => handleNumber('0')}
            className="w-full aspect-square flex items-center justify-center text-2xl font-semibold text-[#1E2B5B] active:scale-90 transition-all"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="w-full aspect-square flex items-center justify-center text-[#1E2B5B] active:scale-90 transition-all"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>

        <div className="mt-16 flex flex-col items-center gap-8">
          <button 
            onClick={() => setMode('FORGOT')}
            className="text-sm font-medium text-[#1E2B5B]/60 hover:text-[#1E2B5B] underline underline-offset-4 transition-colors"
          >
            Forgot your pin?
          </button>

          <button 
            onClick={onLogout}
            className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-red-500 transition-colors"
          >
            Logout Account
          </button>
        </div>
      </motion.div>
    </div>
  );
}
