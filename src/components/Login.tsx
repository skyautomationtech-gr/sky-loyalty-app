import { useState, useEffect, useRef, memo } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, getDocs, getDoc, doc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
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
import { APP_LOGO, APP_NAME } from '../constants';
import { logAction } from '../services/auditService';
import { OperationType, handleFirestoreError } from '../firebase';
import { sendOtpEmail } from '../services/emailService';

interface LoginProps {
  onLogin: (staff: Staff) => void;
  onCustomerPortal: () => void;
}

type LoginStep = 'selection' | 'credentials' | 'otp' | 'forgot_password' | 'reset_password';

function Login({ onLogin, onCustomerPortal }: LoginProps) {
  const [loginStep, setLoginStep] = useState<LoginStep>('selection');
  const [role, setRole] = useState<'ADMIN' | 'STAFF' | null>(null);
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
    let interval: any;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const maskEmail = (email: string) => {
    const [user, domain] = email.split('@');
    if (!user || !domain) return email;
    return `${user.substring(0, 3)}***@${domain}`;
  };

  const [emailServiceFailed, setEmailServiceFailed] = useState(false);

  const generateAndSendOtp = async (user: Staff) => {
    setLoading(true);
    setError('');
    setEmailServiceFailed(false);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setOtpExpiry(Date.now() + 5 * 60 * 1000); // 5 minutes
    setResendTimer(30);
    setPendingUser(user);
    console.info(`[Sky Loyalty Auth] OTP for ${user.email}: ${code}`);

    try {
      await sendOtpEmail(user.email, user.name, code);
      setLoginStep('otp');
    } catch (err: any) {
      console.warn('EmailJS delivery warning:', err);
      setEmailServiceFailed(true);
      setLoginStep('otp');
      setError(err.message || 'ইমেইলে OTP পাঠানো যায়নি। নিচের কোড দিয়ে ভেরিফাই করুন।');
    } finally {
      setLoading(false);
    }
  };

  const handleCredentialSubmit = async (e: any) => {
    e.preventDefault();
    if (!email || !password) {
      setError('ইমেইল এবং পাসওয়ার্ড আবশ্যক');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const normalizedEmail = email.toLowerCase().trim();

      // 1. Try Firebase Auth
      try {
        const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
        const user = userCredential.user;
        
        // Fetch staff doc by query (since legacy could have random ID)
        const q = query(collection(db, 'staff'), where('email', '==', normalizedEmail));
        const snap = await getDocs(q);
        
        let userData: Staff | null = null;
        let staffDocId = '';

        if (!snap.empty) {
          const firstDoc = snap.docs[0];
          userData = firstDoc.data() as Staff;
          staffDocId = firstDoc.id;

          // Auto-migrate document ID to email if it is not already
          if (staffDocId !== normalizedEmail) {
            try {
              await setDoc(doc(db, 'staff', normalizedEmail), {
                ...userData,
                email: normalizedEmail,
                uid: user.uid
              });
              await deleteDoc(doc(db, 'staff', staffDocId));
              staffDocId = normalizedEmail;
            } catch (migrateErr) {
              console.error("Migration during login failed:", migrateErr);
            }
          }
        }

        if (userData) {
          if (userData.status === 'inactive') {
            setError('অ্যাকাউন্টটি নিষ্ক্রিয়। অ্যাডমিনের সাথে যোগাযোগ করুন।');
            await auth.signOut();
            return;
          }
          await generateAndSendOtp({ id: staffDocId, ...userData, uid: user.uid } as Staff);
          return;
        } else if (normalizedEmail === "skyautomationtech@gmail.com") {
          const masterAdminData = {
            id: user.uid,
            uid: user.uid,
            name: 'Master Admin',
            email: 'skyautomationtech@gmail.com',
            role: 'Master Admin' as const,
            status: 'active' as const,
            addedBy: 'System',
            addedDate: new Date().toISOString()
          };
          // Also pre-create a staff document for the master admin to ensure isStaff rules pass
          try {
            await setDoc(doc(db, 'staff', normalizedEmail), {
              name: 'Master Admin',
              email: normalizedEmail,
              role: 'Master Admin',
              status: 'active',
              addedBy: 'System',
              addedDate: new Date().toISOString(),
              uid: user.uid
            });
          } catch (err) {
            console.warn("Failed to ensure Master Admin document in staff collection:", err);
          }
          await generateAndSendOtp(masterAdminData as Staff);
          return;
        } else {
          setError('স্টাফ তথ্য পাওয়া যায়নি।');
          await auth.signOut();
          return;
        }
      } catch (authErr: any) {
        // 2. Auth failed? Check Firestore for legacy/migrating users
        const q = query(
          collection(db, 'staff'), 
          where('email', '==', normalizedEmail),
          where('password', '==', password)
        );
        const snap = await getDocs(q);
        
        if (!snap.empty) {
          const legacyDoc = snap.docs[0];
          const userData = legacyDoc.data() as Staff;
          if (userData.status === 'inactive') {
            setError('অ্যাকাউন্টটি নিষ্ক্রিয়। অ্যাডমিনের সাথে যোগাযোগ করুন।');
            return;
          }
          
          try {
            const newUserCred = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
            await updateProfile(newUserCred.user, { displayName: userData.name });
            
            // Set the new document using the email as document ID
            await setDoc(doc(db, 'staff', normalizedEmail), {
              ...userData,
              email: normalizedEmail,
              uid: newUserCred.user.uid
            });

            // Delete legacy random ID doc if it's different
            if (legacyDoc.id !== normalizedEmail) {
              await deleteDoc(doc(db, 'staff', legacyDoc.id));
            }

            await generateAndSendOtp({ id: normalizedEmail, ...userData, uid: newUserCred.user.uid } as Staff);
            return;
          } catch (migrateErr: any) {
            console.error("Migration error:", migrateErr);
            setError('ইমেইল বা পাসওয়ার্ড ভুল ❌');
          }
        } else if (normalizedEmail === "skyautomationtech@gmail.com") {
          // If auth failed because of wrong password, do not attempt to recreate if it already exists
          if (authErr?.code === 'auth/wrong-password' || authErr?.code === 'auth/invalid-credential') {
            setError('পাসওয়ার্ডটি সঠিক নয় ❌ দয়া করে সঠিক পাসওয়ার্ড দিন অথবা "পাসওয়ার্ড ভুলে গেছেন" ব্যবহার করুন।');
            return;
          }

          // Automatic bootstrap for Master Admin on fresh Firebase project if user doesn't exist
          try {
            const newUserCred = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
            await updateProfile(newUserCred.user, { displayName: 'Master Admin' });

            const masterAdminData: Staff = {
              id: normalizedEmail,
              uid: newUserCred.user.uid,
              name: 'Master Admin',
              email: normalizedEmail,
              role: 'Master Admin',
              status: 'active',
              addedBy: 'System',
              addedDate: new Date().toISOString()
            };

            await setDoc(doc(db, 'staff', normalizedEmail), masterAdminData);
            await generateAndSendOtp(masterAdminData);
            return;
          } catch (createErr: any) {
            console.error("Master admin creation error:", createErr);
            if (createErr.code === 'auth/operation-not-allowed') {
              setError('Firebase Console-এ "Email/Password" অথেন্টিকেশন এনাবল করা নেই। Firebase Console > Authentication > Sign-in method > Email/Password চালু (Enable) করুন।');
            } else if (createErr.code === 'auth/email-already-in-use') {
              setError('পাসওয়ার্ড ভুল হয়েছে ❌ এই ইমেইলটিতে পূর্বে একাউন্ট তৈরি করা আছে, সঠিক পাসওয়ার্ড দিন।');
            } else {
              setError('মাস্টার অ্যাডমিন লগইন/রেজিস্ট্রেশন ত্রুটি: ' + (createErr.message || 'পাসওয়ার্ড যাচাই করুন'));
            }
          }
        } else {
          setError('ইমেইল বা পাসওয়ার্ড ভুল ❌');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('সিস্টেম ত্রুটি। আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
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
      if (loginStep === 'reset_password') {
        // Handle reset logic if needed
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
      setError('OTP ভুল হয়েছে ❌');
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
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

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-teal-primary/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-teal-primary/5 rounded-full blur-3xl" />

      <div className="w-full max-w-[430px] bg-white rounded-[2.5rem] shadow-[0_8px_40px_rgba(0,0,0,0.06)] border border-bg-light overflow-hidden relative z-10 transition-all duration-500">
        <AnimatePresence mode="wait">
          {loginStep === 'selection' && (
            <motion.div
              key="selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-10"
            >
              <div className="flex flex-col items-center text-center mb-12">
                <motion.div className="w-24 h-24 rounded-[2.5rem] bg-white flex items-center justify-center mb-6 shadow-xl border border-bg-light p-4">
                  <img src={APP_LOGO} alt={APP_NAME} className="w-full h-full object-contain" />
                </motion.div>
                <h2 className="text-3xl font-black text-dark-text mb-2 tracking-tight">স্বাগতম</h2>
                <p className="text-gray-text font-bold text-sm">লগইন করতে আপনার রোল বেছে নিন</p>
              </div>

              <div className="space-y-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setRole('ADMIN'); setLoginStep('credentials'); }}
                  className="w-full h-[80px] teal-gradient text-white rounded-3xl font-bold flex items-center px-6 gap-4 shadow-xl shadow-teal-primary/20 transition-all"
                >
                  <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <div className="text-left font-black">
                    <p className="text-xl leading-none mb-1">Admin Login</p>
                    <p className="text-[10px] text-white/70 uppercase tracking-widest">Master Access</p>
                  </div>
                  <ArrowRight className="w-5 h-5 ml-auto opacity-50" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setRole('STAFF'); setLoginStep('credentials'); }}
                  className="w-full h-[80px] bg-white border-2 border-bg-light hover:border-teal-primary/30 text-teal-primary rounded-3xl font-bold flex items-center px-6 gap-4 transition-all shadow-sm"
                >
                  <div className="w-14 h-14 rounded-2xl bg-bg-light flex items-center justify-center">
                    <Users className="w-7 h-7" />
                  </div>
                  <div className="text-left font-black">
                    <p className="text-xl leading-none mb-1 text-dark-text">Staff Login</p>
                    <p className="text-[10px] text-gray-text uppercase tracking-widest">Operator Access</p>
                  </div>
                  <ArrowRight className="w-5 h-5 ml-auto opacity-30" />
                </motion.button>

                <button 
                  onClick={onCustomerPortal}
                  className="w-full py-4 text-teal-primary font-black text-xs uppercase tracking-widest border-2 border-dashed border-teal-primary/20 rounded-2xl hover:bg-teal-primary/5 transition-all flex items-center justify-center gap-2 mt-4"
                >
                  <Sparkles className="w-4 h-4" />
                  কাস্টমার পোর্টাল
                </button>
              </div>
            </motion.div>
          )}

          {loginStep === 'credentials' && (
            <motion.div
              key="credentials"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-10"
            >
              <button 
                onClick={() => { setLoginStep('selection'); setError(''); }} 
                className="flex items-center gap-2 text-gray-text text-xs font-black uppercase tracking-widest mb-10 hover:text-teal-primary transition-colors group"
              >
                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> ফিরে যান
              </button>

              <div className="flex flex-col items-center text-center mb-10">
                <div className="w-20 h-20 rounded-[2rem] bg-teal-primary flex items-center justify-center mb-6 shadow-xl border-4 border-white">
                  <img src={APP_LOGO} alt={APP_NAME} className="w-12 h-12 object-contain" />
                </div>
                <h2 className="text-2xl font-black text-dark-text mb-1 tracking-tight">
                  {role === 'ADMIN' ? 'Admin Access' : 'Staff Access'}
                </h2>
                <p className="text-gray-text text-sm font-bold">আপনার লগইন তথ্য দিন</p>
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
                </div>

                {error && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-danger-red text-[10px] font-black text-center bg-danger-red/5 py-4 rounded-2xl border border-danger-red/10 flex items-center justify-center gap-2">
                    {error}
                  </motion.div>
                )}

                <motion.button 
                  whileTap={{ scale: 0.98 }}
                  type="submit" 
                  disabled={loading} 
                  className="w-full h-[56px] teal-gradient text-white font-black rounded-2xl shadow-xl shadow-teal-primary/20 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
                >
                  {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : (
                    <>
                      <span>Send OTP</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </motion.button>
              </form>
            </motion.div>
          )}

          {loginStep === 'forgot_password' && (
            <motion.div
              key="forgot-password"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-10"
            >
              <button onClick={() => { setLoginStep('selection'); setError(''); }} className="flex items-center gap-2 text-gray-text text-xs font-black uppercase tracking-widest mb-10 hover:text-teal-primary transition-colors group">
                <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> ফিরে যান
              </button>

              <div className="flex flex-col items-center text-center mb-10">
                <div className="w-20 h-20 rounded-[2rem] bg-teal-primary/10 flex items-center justify-center mb-6">
                  <Mail className="w-10 h-10 text-teal-primary" />
                </div>
                <h2 className="text-2xl font-black text-dark-text mb-1 tracking-tight">পাসওয়ার্ড রিসেট</h2>
                <p className="text-gray-text text-sm font-bold px-4">আপনার ইমেইল দিন, আমরা একটি ভেরিফিকেশন কোড পাঠাবো</p>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                setLoading(true);
                setError('');
                try {
                  const normalizedEmail = email.toLowerCase().trim();
                  const q = query(collection(db, 'staff'), where('email', '==', normalizedEmail));
                  const snap = await getDocs(q);
                  if (!snap.empty) {
                    await generateAndSendOtp({ id: snap.docs[0].id, ...snap.docs[0].data() } as Staff);
                  } else if (normalizedEmail === 'skyautomationtech@gmail.com') {
                    await generateAndSendOtp({
                      id: normalizedEmail,
                      name: 'Master Admin',
                      email: normalizedEmail,
                      role: 'Master Admin',
                      status: 'active',
                      addedBy: 'System',
                      addedDate: new Date().toISOString()
                    });
                  } else {
                    setError('এই ইমেইলটি সিস্টেমে পাওয়া যায়নি।');
                  }
                } catch (err) {
                  setError('সিস্টেম ত্রুটি।');
                } finally {
                  setLoading(false);
                }
              }} className="space-y-6">
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

          {loginStep === 'otp' && (
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
                  <div className="w-16 h-16 rounded-full teal-gradient flex items-center justify-center shadow-xl relative z-10">
                    <CheckCircle2 className="w-10 h-10 text-white" />
                  </div>
                </div>
                <h2 className="text-2xl font-black text-dark-text mb-2 tracking-tight">OTP ভেরিফিকেশন</h2>
                <div className="mt-4 p-3 bg-bg-light rounded-2xl border border-teal-primary/10 w-full">
                  <p className="text-dark-text font-black text-[10px] uppercase tracking-widest leading-relaxed">
                    OTP পাঠানো হয়েছে <br /> <span className="text-teal-primary text-[11px]">{maskEmail(email)}</span>
                  </p>
                </div>
              </div>

              <div className="flex justify-center gap-3 mb-10 w-full">
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
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-danger-red text-[11px] font-bold text-center mb-6 bg-danger-red/5 p-4 rounded-2xl border border-danger-red/10 leading-relaxed">
                  {error}
                </motion.div>
              )}

              {emailServiceFailed && generatedOtp && (
                <div className="mb-6 p-3 bg-amber-50 rounded-2xl border border-amber-200 text-center">
                  <p className="text-xs text-amber-800 font-bold mb-2">লগইন টেস্ট OTP কোড: <span className="font-mono text-base font-black text-amber-900 tracking-wider">{generatedOtp}</span></p>
                  <button 
                    type="button"
                    onClick={() => {
                      setOtp(generatedOtp.split(''));
                      setError('');
                    }}
                    className="text-[11px] font-bold px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow transition"
                  >
                    কোডটি বসিয়ে নিন (Auto-fill)
                  </button>
                </div>
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
                      <span>Confirm OTP</span>
                      <ShieldCheck className="w-5 h-5" />
                    </>
                  )}
                </motion.button>
                
                <div className="text-center">
                  <p className="text-gray-text text-xs font-bold">
                    কোড পাননি? {' '}
                    {resendTimer > 0 ? (
                      <span className="text-dark-text font-black">{resendTimer}s পর Resend করুন</span>
                    ) : (
                      <button onClick={() => generateAndSendOtp(pendingUser!)} className="text-teal-primary font-black hover:underline">Resend Code</button>
                    )}
                  </p>
                </div>
              </div>

              <button 
                onClick={() => { setLoginStep('selection'); setError(''); setOtp(['','','','','','']); }} 
                className="w-full mt-10 text-gray-text text-[10px] font-black uppercase tracking-widest hover:text-dark-text transition-colors"
              >
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
