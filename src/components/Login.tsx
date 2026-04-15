import { useState, useEffect, useRef, memo } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Users, 
  ArrowRight, 
  Lock, 
  Mail, 
  ChevronLeft, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  CheckCircle2,
  Sparkles,
  Fingerprint
} from 'lucide-react';
import { Staff } from '../types';
import emailjs from '@emailjs/browser';
import { APP_LOGO, APP_NAME } from '../constants';
import { logAction } from '../services/auditService';
import { OperationType, handleFirestoreError } from '../firebase';

interface LoginProps {
  onLogin: (staff: Staff) => void;
  onCustomerPortal: () => void;
}

function Login({ onLogin, onCustomerPortal }: LoginProps) {
  const [mode, setMode] = useState<'SELECT' | 'ADMIN' | 'STAFF' | 'OTP' | 'FORGOT_PASSWORD' | 'RESET_PASSWORD'>('SELECT');
  const [flowType, setFlowType] = useState<'LOGIN' | 'RESET'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpExpiry, setOtpExpiry] = useState<number | null>(null);
  const [resendTimer, setResendTimer] = useState(0);
  const [pendingUser, setPendingUser] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userIp, setUserIp] = useState('');

  useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => setUserIp(data.ip))
      .catch(() => setUserIp('Unknown'));
  }, []);
  
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    emailjs.init("RoRkAJ90h9lt1nthn");
  }, []);

  useEffect(() => {
    let interval: any;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const maskEmail = (email: string) => {
    const [user, domain] = email.split('@');
    return `${user.substring(0, 3)}***@${domain}`;
  };

  const generateAndSendOtp = async (user: Staff, isReset: boolean = false) => {
    setLoading(true);
    setError('');
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setOtpExpiry(Date.now() + 5 * 60 * 1000); // 5 minutes
    setResendTimer(30);
    setPendingUser(user);
    setFlowType(isReset ? 'RESET' : 'LOGIN');

    try {
      const SERVICE_ID = "service_tps9s6a";
      const TEMPLATE_ID = "template_0ahal91";

      await emailjs.send(
        SERVICE_ID,
        TEMPLATE_ID,
        {
          to_email: user.email,
          passcode: code,
          time: new Date().toLocaleTimeString(),
          company_name: APP_NAME,
          subject: isReset ? "Password Reset Verification" : "Login Verification"
        }
      );
      setMode('OTP');
    } catch (err) {
      console.error('EmailJS Error:', err);
      setError('OTP পাঠাতে ব্যর্থ হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const q = query(collection(db, 'staff'), where('email', '==', email));
      const snap = await getDocs(q);

      if (!snap.empty) {
        const userData = snap.docs[0].data();
        await generateAndSendOtp({ id: snap.docs[0].id, ...userData } as Staff, true);
      } else {
        setError('এই ইমেইলটি সিস্টেমে পাওয়া যায়নি।');
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      setError('সিস্টেম ত্রুটি। আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: any) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('পাসওয়ার্ড মিলছে না।');
      return;
    }
    if (newPassword.length < 6) {
      setError('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (pendingUser) {
        const userRef = doc(db, 'staff', pendingUser.id);
        await updateDoc(userRef, { password: newPassword });
        
        await logAction({
          action: 'PASSWORD_RESET_SUCCESS',
          staffId: pendingUser.id,
          staffName: pendingUser.name,
          details: 'Password successfully reset'
        });

        setMode('SELECT');
        setError('পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে। লগইন করুন।');
        setEmail('');
        setPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      console.error('Reset password error:', err);
      setError('পাসওয়ার্ড পরিবর্তন করতে ব্যর্থ হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  const handleCredentialSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // 1. Try to sign in with Firebase Auth first
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Fetch staff data from Firestore to get role and other details
        const q = query(collection(db, 'staff'), where('email', '==', email));
        const snap = await getDocs(q);
        
        if (!snap.empty) {
          const userData = snap.docs[0].data() as Staff;
          if (userData.status === 'inactive') {
            setError('অ্যাকাউন্টটি নিষ্ক্রিয়। অ্যাডমিনের সাথে যোগাযোগ করুন।');
            await auth.signOut();
            return;
          }
          
          // Ensure Firestore doc has the correct UID and is indexed by UID
          if (snap.docs[0].id !== user.uid) {
            const oldData = snap.docs[0].data();
            await setDoc(doc(db, 'staff', user.uid), { ...oldData, uid: user.uid });
            await deleteDoc(doc(db, 'staff', snap.docs[0].id));
          }
          
          await generateAndSendOtp({ id: user.uid, ...snap.docs[0].data(), uid: user.uid } as Staff);
          return;
        } else if (email === "skyautomationtech@gmail.com") {
          // Special case for Master Admin: Ensure they have a doc in staff collection
          const masterAdminData = {
            uid: user.uid,
            name: 'Master Admin',
            email: 'skyautomationtech@gmail.com',
            role: 'Master Admin',
            pin: '0000',
            addedBy: 'System',
            addedDate: new Date('2024-01-01T00:00:00.000Z').toISOString(),
            status: 'active'
          };
          await setDoc(doc(db, 'staff', user.uid), masterAdminData, { merge: true });
          await generateAndSendOtp({ id: user.uid, ...masterAdminData } as Staff);
          return;
        }
      } catch (authErr: any) {
        // 2. If user not found in Auth, check Firestore for auto-migration
        if (authErr.code === 'auth/user-not-found' || authErr.code === 'auth/invalid-credential') {
          const q = query(
            collection(db, 'staff'), 
            where('email', '==', email),
            where('password', '==', password)
          );
          const snap = await getDocs(q);
          
          if (!snap.empty) {
            const userData = snap.docs[0].data() as Staff;
            if (userData.status === 'inactive') {
              setError('অ্যাকাউন্টটি নিষ্ক্রিয়। অ্যাডমিনের সাথে যোগাযোগ করুন।');
              return;
            }

            // AUTO-MIGRATION: Create Firebase Auth account using existing credentials
            try {
              const newUserCred = await createUserWithEmailAndPassword(auth, email, password);
              await updateProfile(newUserCred.user, { displayName: userData.name });
              
              // Create new doc with UID as ID and delete old one
              await setDoc(doc(db, 'staff', newUserCred.user.uid), { ...userData, uid: newUserCred.user.uid });
              await deleteDoc(doc(db, 'staff', snap.docs[0].id));
              
              await generateAndSendOtp({ id: newUserCred.user.uid, ...userData, uid: newUserCred.user.uid } as Staff);
              return;
            } catch (createErr: any) {
              console.error('Auto-migration failed:', createErr);
              // If migration fails but credentials matched, we might have a conflict or disabled provider
              if (createErr.code === 'auth/email-already-in-use') {
                setError('এই ইমেইলটি ইতিমধ্যে ব্যবহৃত হচ্ছে। পাসওয়ার্ড ভুল হতে পারে।');
              } else {
                setError('সিকিউরিটি আপডেট করতে সমস্যা হয়েছে। অ্যাডমিনের সাথে যোগাযোগ করুন।');
              }
              return;
            }
          }
        }
        
        // Handle specific auth errors
        if (authErr.code === 'auth/wrong-password' || authErr.code === 'auth/invalid-credential') {
          setError('ভুল ইমেইল বা পাসওয়ার্ড।');
        } else if (authErr.code === 'auth/too-many-requests') {
          setError('অতিরিক্ত চেষ্টার কারণে অ্যাকাউন্টটি সাময়িকভাবে লক করা হয়েছে। পরে চেষ্টা করুন।');
        } else {
          setError('লগইন করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('সিস্টেম ত্রুটি। আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: any) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const verifyOtp = () => {
    setLoading(true);
    const enteredOtp = otp.join('');
    if (Date.now() > (otpExpiry || 0)) {
      setError('OTP এর মেয়াদ শেষ। আবার পাঠান।');
      setLoading(false);
      return;
    }
    if (enteredOtp === generatedOtp && pendingUser) {
      if (flowType === 'RESET') {
        setMode('RESET_PASSWORD');
        setLoading(false);
      } else {
        logAction({
          action: 'LOGIN',
          staffId: pendingUser.id,
          staffName: pendingUser.name,
          details: 'Successful login via OTP'
        });
        onLogin(pendingUser);
      }
    } else {
      setError('ভুল কোড। আবার চেষ্টা করুন।');
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-teal-primary/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-teal-primary/5 rounded-full blur-3xl" />

      <div className="w-full max-w-[430px] bg-white rounded-[2.5rem] shadow-[0_8px_40px_rgba(0,0,0,0.06)] border border-bg-light overflow-hidden relative z-10">
        <AnimatePresence mode="wait">
          {mode === 'SELECT' && (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-10"
            >
              <div className="flex flex-col items-center text-center mb-12">
                <motion.div 
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  className="w-24 h-24 rounded-[2.5rem] bg-white flex items-center justify-center mb-6 shadow-xl shadow-teal-primary/5 overflow-hidden border border-bg-light p-4"
                >
                  <img src={APP_LOGO} alt={APP_NAME} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                </motion.div>
                <h2 className="text-3xl font-black text-dark-text mb-2 tracking-tight">স্বাগতম</h2>
                <p className="text-gray-text font-bold text-sm">লগইন করতে আপনার রোল বেছে নিন</p>
              </div>

              <div className="space-y-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setMode('ADMIN')}
                  className="w-full h-[80px] teal-gradient text-white rounded-3xl font-bold flex items-center px-6 gap-4 shadow-xl shadow-teal-primary/20 transition-all"
                >
                  <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <div className="text-left">
                    <p className="text-xl font-black leading-none mb-1">Admin Login</p>
                    <p className="text-[10px] text-white/70 font-black uppercase tracking-widest">Master Access</p>
                  </div>
                  <ArrowRight className="w-5 h-5 ml-auto opacity-50" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setMode('STAFF')}
                  className="w-full h-[80px] bg-white border-2 border-bg-light hover:border-teal-primary/30 text-teal-primary rounded-3xl font-bold flex items-center px-6 gap-4 transition-all shadow-sm"
                >
                  <div className="w-14 h-14 rounded-2xl bg-bg-light flex items-center justify-center">
                    <Users className="w-7 h-7" />
                  </div>
                  <div className="text-left">
                    <p className="text-xl font-black leading-none mb-1 text-dark-text">Staff Login</p>
                    <p className="text-[10px] text-gray-text font-black uppercase tracking-widest">Operator Access</p>
                  </div>
                  <ArrowRight className="w-5 h-5 ml-auto opacity-30" />
                </motion.button>

                <div className="pt-4">
                  <button 
                    onClick={onCustomerPortal}
                    className="w-full py-4 text-teal-primary font-black text-xs uppercase tracking-widest border-2 border-dashed border-teal-primary/20 rounded-2xl hover:bg-teal-primary/5 transition-all flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    কাস্টমার পোর্টাল
                  </button>
                </div>
              </div>

              <div className="mt-12 flex items-center justify-center gap-2">
                <Fingerprint className="w-4 h-4 text-gray-text/30" />
                <p className="text-[10px] font-black text-gray-text/30 uppercase tracking-[0.2em]">Secure Access System</p>
              </div>
            </motion.div>
          )}

          {(mode === 'ADMIN' || mode === 'STAFF') && (
            <motion.div
              key="credentials"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-10"
            >
              <button onClick={() => { setMode('SELECT'); setError(''); }} className="flex items-center gap-2 text-gray-text text-xs font-black uppercase tracking-widest mb-10 hover:text-teal-primary transition-colors group">
                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> ফিরে যান
              </button>

              <div className="flex flex-col items-center text-center mb-10">
                <div className="w-20 h-20 rounded-[2rem] bg-teal-primary flex items-center justify-center mb-6 shadow-xl shadow-teal-primary/20 overflow-hidden border-4 border-white">
                  <img src={APP_LOGO} alt={APP_NAME} className="w-12 h-12 object-contain" referrerPolicy="no-referrer" />
                </div>
                <h2 className="text-2xl font-black text-dark-text mb-1 tracking-tight">
                  {mode === 'ADMIN' ? 'Admin Access' : 'Staff Access'}
                </h2>
                <p className="text-gray-text text-sm font-bold">আপনার তথ্য প্রদান করুন</p>
              </div>

              <form onSubmit={handleCredentialSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-dark-text ml-1 uppercase tracking-widest">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-text group-focus-within:text-teal-primary transition-colors" />
                    <input
                      type="email"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full h-[56px] bg-bg-light rounded-2xl pl-12 pr-4 text-dark-text font-bold text-sm focus:outline-none focus:ring-2 focus:ring-teal-primary/20 transition-all border-2 border-transparent focus:border-teal-primary/10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-dark-text ml-1 uppercase tracking-widest">Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-text group-focus-within:text-teal-primary transition-colors" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full h-[56px] bg-bg-light rounded-2xl pl-12 pr-12 text-dark-text font-bold text-sm focus:outline-none focus:ring-2 focus:ring-teal-primary/20 transition-all border-2 border-transparent focus:border-teal-primary/10"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-text hover:text-teal-primary transition-colors">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <div className="flex justify-end">
                    <button 
                      type="button" 
                      onClick={() => { setMode('FORGOT_PASSWORD'); setError(''); }}
                      className="text-[10px] font-black text-teal-primary uppercase tracking-widest hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                </div>

                {error && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-danger-red text-[10px] font-black text-center bg-danger-red/5 py-4 rounded-2xl border border-danger-red/10 flex items-center justify-center gap-2">
                    <RefreshCw className="w-3 h-3" /> {error}
                  </motion.div>
                )}

                <motion.button 
                  whileTap={{ scale: 0.98 }}
                  type="submit" 
                  disabled={loading} 
                  className="w-full h-[56px] teal-gradient text-white font-black rounded-2xl shadow-xl shadow-teal-primary/20 disabled:bg-gray-300 disabled:shadow-none transition-all flex items-center justify-center gap-3"
                >
                  {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : (
                    <>
                      <span>OTP কোড পাঠান</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </motion.button>
              </form>
            </motion.div>
          )}

          {mode === 'FORGOT_PASSWORD' && (
            <motion.div
              key="forgot-password"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-10"
            >
              <button onClick={() => { setMode('SELECT'); setError(''); }} className="flex items-center gap-2 text-gray-text text-xs font-black uppercase tracking-widest mb-10 hover:text-teal-primary transition-colors group">
                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> ফিরে যান
              </button>

              <div className="flex flex-col items-center text-center mb-10">
                <div className="w-20 h-20 rounded-[2rem] bg-teal-primary/10 flex items-center justify-center mb-6">
                  <Mail className="w-10 h-10 text-teal-primary" />
                </div>
                <h2 className="text-2xl font-black text-dark-text mb-1 tracking-tight">পাসওয়ার্ড রিসেট</h2>
                <p className="text-gray-text text-sm font-bold px-4">আপনার ইমেইল দিন, আমরা একটি ভেরিফিকেশন কোড পাঠাবো</p>
              </div>

              <form onSubmit={handleForgotPassword} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-dark-text ml-1 uppercase tracking-widest">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-text group-focus-within:text-teal-primary transition-colors" />
                    <input
                      type="email"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full h-[56px] bg-bg-light rounded-2xl pl-12 pr-4 text-dark-text font-bold text-sm focus:outline-none focus:ring-2 focus:ring-teal-primary/20 transition-all border-2 border-transparent focus:border-teal-primary/10"
                    />
                  </div>
                </div>

                {error && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-danger-red text-[10px] font-black text-center bg-danger-red/5 py-4 rounded-2xl border border-danger-red/10">
                    {error}
                  </motion.div>
                )}

                <motion.button 
                  whileTap={{ scale: 0.98 }}
                  type="submit" 
                  disabled={loading} 
                  className="w-full h-[56px] teal-gradient text-white font-black rounded-2xl shadow-xl shadow-teal-primary/20 transition-all flex items-center justify-center gap-3"
                >
                  {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : (
                    <>
                      <span>OTP পাঠান</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </motion.button>
              </form>
            </motion.div>
          )}

          {mode === 'RESET_PASSWORD' && (
            <motion.div
              key="reset-password"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-10"
            >
              <div className="flex flex-col items-center text-center mb-10">
                <div className="w-20 h-20 rounded-[2rem] bg-teal-primary flex items-center justify-center mb-6 shadow-xl shadow-teal-primary/20">
                  <Lock className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-black text-dark-text mb-1 tracking-tight">নতুন পাসওয়ার্ড</h2>
                <p className="text-gray-text text-sm font-bold">আপনার নতুন পাসওয়ার্ড সেট করুন</p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-dark-text ml-1 uppercase tracking-widest">New Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-text group-focus-within:text-teal-primary transition-colors" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="w-full h-[56px] bg-bg-light rounded-2xl pl-12 pr-12 text-dark-text font-bold text-sm focus:outline-none focus:ring-2 focus:ring-teal-primary/20 transition-all border-2 border-transparent focus:border-teal-primary/10"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-text hover:text-teal-primary transition-colors">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-dark-text ml-1 uppercase tracking-widest">Confirm Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-text group-focus-within:text-teal-primary transition-colors" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full h-[56px] bg-bg-light rounded-2xl pl-12 pr-12 text-dark-text font-bold text-sm focus:outline-none focus:ring-2 focus:ring-teal-primary/20 transition-all border-2 border-transparent focus:border-teal-primary/10"
                    />
                  </div>
                </div>

                {error && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-danger-red text-[10px] font-black text-center bg-danger-red/5 py-4 rounded-2xl border border-danger-red/10">
                    {error}
                  </motion.div>
                )}

                <motion.button 
                  whileTap={{ scale: 0.98 }}
                  type="submit" 
                  disabled={loading} 
                  className="w-full h-[56px] teal-gradient text-white font-black rounded-2xl shadow-xl shadow-teal-primary/20 transition-all flex items-center justify-center gap-3"
                >
                  {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : (
                    <>
                      <span>পাসওয়ার্ড আপডেট করুন</span>
                      <CheckCircle2 className="w-5 h-5" />
                    </>
                  )}
                </motion.button>
              </form>
            </motion.div>
          )}

          {mode === 'OTP' && (
            <motion.div
              key="otp"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-10"
            >
              <div className="flex flex-col items-center text-center mb-10">
                <div className="w-24 h-24 rounded-full bg-teal-primary/10 flex items-center justify-center mb-6 relative">
                  <div className="absolute inset-0 bg-teal-primary/20 rounded-full animate-ping opacity-20" />
                  <div className="w-16 h-16 rounded-full teal-gradient flex items-center justify-center shadow-xl shadow-teal-primary/20 relative z-10">
                    <CheckCircle2 className="w-10 h-10 text-white" />
                  </div>
                </div>
                <h2 className="text-2xl font-black text-dark-text mb-2 tracking-tight">ভেরিফিকেশন</h2>
                <p className="text-gray-text text-sm font-bold px-4">আপনার ইমেইলে পাঠানো ৬ ডিজিটের কোডটি দিন</p>
                <div className="mt-4 p-3 bg-bg-light rounded-2xl border border-teal-primary/10">
                  <p className="text-dark-text font-black text-[10px] uppercase tracking-widest">
                    কোড পাঠানো হয়েছে: <span className="text-teal-primary">{maskEmail(email)}</span>
                  </p>
                </div>
              </div>

              <div className="flex justify-center gap-3 mb-10 w-full px-2">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={el => otpRefs.current[idx] = el}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className={`w-12 h-16 rounded-2xl text-center text-2xl font-black transition-all border-2 ${
                      digit 
                        ? 'bg-white border-teal-primary text-teal-primary shadow-lg shadow-teal-primary/10' 
                        : 'bg-bg-light border-transparent text-dark-text focus:border-teal-primary focus:bg-white'
                    }`}
                  />
                ))}
              </div>

              {error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-danger-red text-[10px] font-black text-center mb-8 bg-danger-red/5 py-4 rounded-2xl border border-danger-red/10">
                  {error}
                </motion.div>
              )}

              <div className="space-y-6">
                <motion.button 
                  whileTap={{ scale: 0.98 }}
                  onClick={verifyOtp} 
                  disabled={loading} 
                  className="w-full h-[56px] bg-[#008000] text-white font-black rounded-2xl shadow-xl shadow-green-900/10 transition-all flex items-center justify-center gap-3"
                >
                  {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : (
                    <>
                      <span>Verify</span>
                      <ShieldCheck className="w-5 h-5" />
                    </>
                  )}
                </motion.button>
                
                <div className="text-center">
                  <p className="text-gray-text text-xs font-bold">
                    কোড পাননি? {' '}
                    {resendTimer > 0 ? (
                      <span className="text-dark-text font-black">{resendTimer}s পর আবার পাঠান</span>
                    ) : (
                      <button onClick={() => generateAndSendOtp(pendingUser!)} className="text-teal-primary font-black hover:underline">আবার পাঠান</button>
                    )}
                  </p>
                </div>
              </div>

              <button onClick={() => { setMode('SELECT'); setError(''); setOtp(['','','','','','']); }} className="w-full mt-10 text-gray-text text-[10px] font-black uppercase tracking-widest hover:text-dark-text transition-colors">
                বাতিল করুন
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-8 text-center">
        <p className="text-[10px] font-black text-gray-text uppercase tracking-[0.2em] flex items-center justify-center gap-2">
          <Sparkles className="w-3 h-3 text-teal-primary" /> Sky Automation Tech
        </p>
      </div>
    </div>
  );
}

export default memo(Login);
