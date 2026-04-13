import React, { useState, useEffect, useRef } from 'react';
import { Staff } from '../types';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ArrowLeft, User, Mail, Camera, CheckCircle2, RefreshCw, Sparkles, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import emailjs from '@emailjs/browser';
import Toast from './Toast';

interface EditProfileProps {
  user: Staff | null;
  onBack: () => void;
  onUpdate: (updatedUser: Staff) => void;
}

export default function EditProfile({ user, onBack, onUpdate }: EditProfileProps) {
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isSaving, setIsSaving] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [error, setError] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    emailjs.init("RoRkAJ90h9lt1nthn");
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (email !== user.email) {
      await sendOtp();
      return;
    }

    await updateProfile();
  };

  const sendOtp = async () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setIsSaving(true);
    try {
      await emailjs.send(
        "service_tps9s6a",
        "template_0ahal91",
        {
          to_email: email,
          passcode: code,
          time: new Date().toLocaleTimeString(),
          company_name: "Sky Automation Tech"
        }
      );
      setShowOtp(true);
      setToastMsg('ভেরিফিকেশন কোড পাঠানো হয়েছে ✅');
      setToastType('success');
      setShowToast(true);
    } catch (err) {
      console.error(err);
      setToastMsg('ভেরিফিকেশন কোড পাঠাতে সমস্যা হয়েছে');
      setToastType('error');
      setShowToast(true);
    } finally {
      setIsSaving(false);
    }
  };

  const updateProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const staffRef = doc(db, 'staff', user.id);
      await updateDoc(staffRef, { name, email });
      onUpdate({ ...user, name, email });
      setToastMsg('প্রোফাইল সফলভাবে আপডেট করা হয়েছে! ✅');
      setToastType('success');
      setShowToast(true);
      setTimeout(() => onBack(), 1500);
    } catch (err) {
      console.error(err);
      setToastMsg('আপডেট করতে সমস্যা হয়েছে');
      setToastType('error');
      setShowToast(true);
    } finally {
      setIsSaving(false);
    }
  };

  const verifyOtp = () => {
    if (otp.join('') === generatedOtp) {
      updateProfile();
    } else {
      setError('ভেরিফিকেশন কোড সঠিক নয়');
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  return (
    <div className="space-y-6 pb-24">
      <header className="flex items-center gap-3 py-2 bg-white">
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={onBack} 
          className="p-2 -ml-2 text-gray-text hover:text-teal-primary transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </motion.button>
        <h1 className="text-xl font-black text-dark-text tracking-tight">প্রোফাইল এডিট</h1>
      </header>

      <AnimatePresence mode="wait">
        {!showOtp ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div className="flex flex-col items-center py-8 bg-white rounded-[3rem] shadow-sm border border-bg-light">
              <div className="relative">
                <div className="absolute inset-0 bg-teal-primary/20 rounded-full blur-2xl animate-pulse" />
                <div className="w-32 h-32 rounded-full bg-white flex items-center justify-center text-teal-primary text-5xl font-black shadow-2xl border-4 border-white relative z-10">
                  {name.charAt(0).toUpperCase()}
                </div>
                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  className="absolute bottom-0 right-0 w-11 h-11 bg-white rounded-full shadow-xl flex items-center justify-center text-teal-primary border-2 border-teal-primary/10 active:scale-90 transition-all z-20"
                >
                  <Camera className="w-6 h-6" />
                </motion.button>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-bg-light space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-text uppercase tracking-widest ml-1">পূর্ণ নাম</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-text group-focus-within:text-teal-primary transition-colors" />
                  <input 
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-bg-light rounded-2xl p-4 pl-12 text-dark-text font-bold text-sm focus:outline-none focus:ring-2 focus:ring-teal-primary/20 transition-all border-2 border-transparent focus:border-teal-primary/10" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-text uppercase tracking-widest ml-1">ইমেইল এড্রেস</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-text group-focus-within:text-teal-primary transition-colors" />
                  <input 
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-bg-light rounded-2xl p-4 pl-12 text-dark-text font-bold text-sm focus:outline-none focus:ring-2 focus:ring-teal-primary/20 transition-all border-2 border-transparent focus:border-teal-primary/10" 
                  />
                </div>
                <div className="bg-teal-primary/5 p-3 rounded-xl mt-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-primary shrink-0" />
                  <p className="text-[10px] font-bold text-teal-primary leading-tight">
                    ইমেইল পরিবর্তন করলে নতুন ইমেইলে OTP ভেরিফিকেশন কোড পাঠানো হবে।
                  </p>
                </div>
              </div>
            </div>

            <motion.button 
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={isSaving}
              className="w-full h-14 teal-gradient text-white font-black rounded-2xl shadow-xl shadow-teal-primary/20 uppercase tracking-widest mt-4 flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95 transition-all"
            >
              {isSaving ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : <CheckCircle2 className="w-5 h-5" />}
              <span>সেভ করুন</span>
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            key="otp"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-10 py-10 bg-white rounded-[3rem] p-8 shadow-sm border border-bg-light"
          >
            <div className="w-24 h-24 mx-auto bg-teal-primary/10 rounded-[2rem] flex items-center justify-center border border-teal-primary/10 relative">
              <div className="absolute inset-0 bg-teal-primary/20 rounded-[2rem] blur-xl animate-pulse" />
              <Mail className="w-12 h-12 text-teal-primary relative z-10" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-dark-text mb-3 tracking-tight">ইমেইল ভেরিফাই করুন</h2>
              <p className="text-sm font-bold text-gray-text leading-relaxed px-4">আপনার নতুন ইমেইল <span className="text-teal-primary">{email}</span>-এ পাঠানো ৬-ডিজিটের কোডটি দিন</p>
            </div>

            <div className="flex justify-center gap-2 w-full px-5 box-border">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={el => otpRefs.current[idx] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  className={`w-[45px] h-[55px] rounded-xl text-center text-2xl font-black transition-all border-2 flex-shrink-0 ${
                    digit 
                      ? 'bg-teal-primary/5 border-teal-primary text-teal-primary shadow-lg shadow-teal-primary/5' 
                      : 'bg-bg-light border-transparent text-dark-text focus:border-teal-primary focus:bg-white'
                  }`}
                />
              ))}
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center gap-2 text-[10px] font-black text-danger-red uppercase tracking-widest bg-danger-red/5 p-3 rounded-xl"
              >
                <ShieldAlert className="w-4 h-4" />
                {error}
              </motion.div>
            )}

            <div className="space-y-4 pt-4">
              <motion.button 
                whileTap={{ scale: 0.98 }}
                onClick={verifyOtp}
                className="w-full h-14 teal-gradient text-white font-black rounded-2xl shadow-xl shadow-teal-primary/20 uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>ভেরিফাই ও সেভ করুন</span>
              </motion.button>
              <button 
                onClick={() => setShowOtp(false)}
                className="text-[10px] font-black text-gray-text uppercase tracking-widest hover:text-dark-text transition-colors p-2"
              >
                বাতিল করুন
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Toast 
        show={showToast} 
        message={toastMsg} 
        type={toastType} 
        onClose={() => setShowToast(false)} 
      />
    </div>
  );
}
