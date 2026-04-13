import React, { useState, useEffect, useRef } from 'react';
import { Staff } from '../types';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ArrowLeft, Lock, Eye, EyeOff, CheckCircle2, XCircle, Mail, ShieldCheck, RefreshCw, Sparkles, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import emailjs from '@emailjs/browser';
import Toast from './Toast';

interface ChangePasswordProps {
  user: Staff | null;
  onBack: () => void;
}

export default function ChangePassword({ user, onBack }: ChangePasswordProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
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

  const requirements = [
    { label: 'কমপক্ষে ৮ অক্ষরের হতে হবে', met: newPassword.length >= 8 },
    { label: 'একটি বড় হাতের অক্ষর (A-Z)', met: /[A-Z]/.test(newPassword) },
    { label: 'একটি সংখ্যা (0-9)', met: /[0-9]/.test(newPassword) },
    { label: 'একটি স্পেশাল ক্যারেক্টার (@#$)', met: /[^A-Za-z0-9]/.test(newPassword) },
  ];

  const strength = requirements.filter(r => r.met).length;
  const strengthLabel = strength <= 1 ? 'দুর্বল' : strength <= 3 ? 'মাঝারি' : 'শক্তিশালী';
  const strengthColor = strength <= 1 ? 'bg-danger-red' : strength <= 3 ? 'bg-orange-500' : 'bg-teal-primary';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (newPassword !== confirmPassword) {
      setToastMsg('পাসওয়ার্ড মিলছে না');
      setToastType('error');
      setShowToast(true);
      return;
    }
    if (strength < 4) {
      setToastMsg('পাসওয়ার্ড রিকোয়ারমেন্ট পূরণ হয়নি');
      setToastType('error');
      setShowToast(true);
      return;
    }
    
    await sendOtp();
  };

  const sendOtp = async () => {
    if (!user) return;
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setIsSaving(true);
    try {
      await emailjs.send(
        "service_tps9s6a",
        "template_0ahal91",
        {
          to_email: user.email,
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

  const verifyOtp = async () => {
    if (otp.join('') === generatedOtp) {
      await updatePassword();
    } else {
      setError('ভেরিফিকেশন কোড সঠিক নয়');
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    }
  };

  const updatePassword = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const staffRef = doc(db, 'staff', user.id);
      await updateDoc(staffRef, { password: newPassword });
      setToastMsg('পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে! ✅');
      setToastType('success');
      setShowToast(true);
      setTimeout(() => onBack(), 1500);
    } catch (err) {
      console.error(err);
      setToastMsg('পাসওয়ার্ড আপডেট করতে সমস্যা হয়েছে');
      setToastType('error');
      setShowToast(true);
    } finally {
      setIsSaving(false);
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
        <h1 className="text-xl font-black text-dark-text tracking-tight">পাসওয়ার্ড পরিবর্তন</h1>
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
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-bg-light space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-text uppercase tracking-widest ml-1">বর্তমান পাসওয়ার্ড</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-text group-focus-within:text-teal-primary transition-colors" />
                  <input 
                    required
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-bg-light rounded-2xl p-4 pl-12 pr-12 text-dark-text font-bold text-sm focus:outline-none focus:ring-2 focus:ring-teal-primary/20 transition-all border-2 border-transparent focus:border-teal-primary/10" 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-text hover:text-teal-primary transition-colors"
                  >
                    {showCurrent ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-text uppercase tracking-widest ml-1">নতুন পাসওয়ার্ড</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-text group-focus-within:text-teal-primary transition-colors" />
                  <input 
                    required
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-bg-light rounded-2xl p-4 pl-12 pr-12 text-dark-text font-bold text-sm focus:outline-none focus:ring-2 focus:ring-teal-primary/20 transition-all border-2 border-transparent focus:border-teal-primary/10" 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-text hover:text-teal-primary transition-colors"
                  >
                    {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                
                {/* Strength Indicator */}
                <div className="mt-6 space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-black text-gray-text uppercase tracking-widest flex items-center gap-2">
                      <Sparkles className="w-3 h-3" />
                      পাসওয়ার্ড শক্তি: <span className={strengthColor.replace('bg-', 'text-')}>{strengthLabel}</span>
                    </span>
                  </div>
                  <div className="h-2 w-full bg-bg-light rounded-full overflow-hidden p-0.5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(strength / 4) * 100}%` }}
                      className={`h-full ${strengthColor} transition-all duration-500 rounded-full shadow-[0_0_10px_rgba(0,191,166,0.3)]`}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-text uppercase tracking-widest ml-1">নতুন পাসওয়ার্ড নিশ্চিত করুন</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-text group-focus-within:text-teal-primary transition-colors" />
                  <input 
                    required
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-bg-light rounded-2xl p-4 pl-12 text-dark-text font-bold text-sm focus:outline-none focus:ring-2 focus:ring-teal-primary/20 transition-all border-2 border-transparent focus:border-teal-primary/10" 
                  />
                </div>
              </div>
            </div>

            {/* Requirements Checklist */}
            <div className="bg-white rounded-[2.5rem] p-8 space-y-4 border border-bg-light shadow-sm">
              <p className="text-[10px] font-black text-dark-text uppercase tracking-widest mb-4 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-primary" /> রিকোয়ারমেন্টস
              </p>
              <div className="grid grid-cols-1 gap-3">
                {requirements.map((req, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${req.met ? 'bg-teal-primary/10 text-teal-primary' : 'bg-bg-light text-gray-text'}`}>
                      {req.met ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    </div>
                    <span className={`text-xs font-bold transition-colors ${req.met ? 'text-dark-text' : 'text-gray-text'}`}>{req.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <motion.button 
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={isSaving || strength < 4}
              className="w-full h-14 teal-gradient text-white font-black rounded-2xl shadow-xl shadow-teal-primary/20 uppercase tracking-widest mt-4 flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95 transition-all"
            >
              {isSaving ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : <ShieldCheck className="w-5 h-5" />}
              <span>পাসওয়ার্ড সেভ করুন</span>
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
              <h2 className="text-2xl font-black text-dark-text mb-3 tracking-tight">পরিচয় নিশ্চিত করুন</h2>
              <p className="text-sm font-bold text-gray-text leading-relaxed px-4">আপনার ইমেইল <span className="text-teal-primary">{user?.email}</span>-এ পাঠানো ৬-ডিজিটের কোডটি দিন</p>
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
                disabled={isSaving}
                className="w-full h-14 teal-gradient text-white font-black rounded-2xl shadow-xl shadow-teal-primary/20 uppercase tracking-widest disabled:opacity-50 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                {isSaving ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : <ShieldCheck className="w-5 h-5" />}
                <span>ভেরিফাই ও পরিবর্তন করুন</span>
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
