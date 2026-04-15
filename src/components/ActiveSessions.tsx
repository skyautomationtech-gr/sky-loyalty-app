import React, { useState, useEffect } from 'react';
import { Staff, Session } from '../types';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { ArrowLeft, Smartphone, Monitor, MapPin, Clock, LogOut, Trash2, Sparkles, RefreshCw, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Toast from './Toast';
import ConfirmationModal from './ConfirmationModal';

interface ActiveSessionsProps {
  user: Staff | null;
  onBack: () => void;
  onLogoutAll: () => void;
}

export default function ActiveSessions({ user, onBack, onLogoutAll }: ActiveSessionsProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'sessions'),
      where('staffId', '==', user.id),
      orderBy('loginTime', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Session)));
    });
    return unsub;
  }, [user]);

  const handleLogoutAll = async () => {
    if (!user) return;
    setIsProcessing(true);
    setIsLogoutModalOpen(false);
    
    try {
      const q = query(collection(db, 'sessions'), where('staffId', '==', user.id));
      const snap = await getDocs(q);
      const currentSessionId = localStorage.getItem('sky_session_id');
      
      const deletePromises = snap.docs
        .filter(d => d.id !== currentSessionId)
        .map(d => deleteDoc(doc(db, 'sessions', d.id)));
      
      await Promise.all(deletePromises);
      setToastMsg('অন্য সব সেশন লগআউট করা হয়েছে! ✅');
      setToastType('success');
      setShowToast(true);
    } catch (err) {
      console.error(err);
      setToastMsg('সেশন লগআউট করতে সমস্যা হয়েছে');
      setToastType('error');
      setShowToast(true);
    } finally {
      setIsProcessing(false);
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
        <h1 className="text-xl font-black text-dark-text tracking-tight">অ্যাক্টিভ সেশন</h1>
      </header>

      <div className="space-y-4 px-2">
        <AnimatePresence mode="popLayout">
          {sessions.map((session, idx) => (
            <div
              key={session.id}
              className="bg-white border border-bg-light rounded-[2.5rem] p-6 shadow-sm flex justify-between items-center group hover:border-teal-primary/20 transition-all"
            >
              <div className="flex items-center gap-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${session.isCurrent ? 'bg-teal-primary text-white shadow-lg shadow-teal-primary/20' : 'bg-bg-light text-teal-primary'}`}>
                  {session.deviceType === 'Mobile' ? <Smartphone className="w-7 h-7" /> : <Monitor className="w-7 h-7" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-dark-text tracking-tight">{session.deviceType === 'Mobile' ? 'মোবাইল' : 'ডেস্কটপ'} সেশন</h3>
                    {session.isCurrent && (
                      <span className="px-2.5 py-1 bg-teal-primary/10 text-teal-primary rounded-full text-[8px] font-black uppercase tracking-widest border border-teal-primary/10">
                        বর্তমান
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5 mt-2">
                    <p className="text-[10px] text-gray-text font-black flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-teal-primary/40" /> 
                      {new Date(session.loginTime).toLocaleString('bn-BD', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    <p className="text-[10px] text-gray-text font-black flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-teal-primary/40" /> {session.location}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </AnimatePresence>
      </div>

      <div className="px-2 pt-4">
        <motion.button 
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsLogoutModalOpen(true)}
          disabled={isProcessing || sessions.length <= 1}
          className="w-full h-14 bg-white border-2 border-danger-red/10 text-danger-red font-black rounded-2xl shadow-sm uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all hover:bg-danger-red/5 disabled:opacity-50"
        >
          {isProcessing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
          অন্য সব সেশন লগআউট করুন
        </motion.button>
      </div>

      <div className="text-center pt-8">
        <p className="text-[10px] font-black text-gray-text uppercase tracking-[0.3em] flex items-center justify-center gap-2">
          <Sparkles className="w-3 h-3 text-teal-primary" /> Sky Automation Tech
        </p>
      </div>

      <ConfirmationModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogoutAll}
        title="অন্য সেশন লগআউট?"
        message="আপনি কি নিশ্চিত যে অন্য সব সেশন লগআউট করতে চান? এটি আপনার বর্তমান সেশনকে প্রভাবিত করবে না।"
        confirmLabel="হ্যাঁ, লগআউট করুন"
        cancelLabel="না, থাকুক"
        type="danger"
        icon={<LogOut className="w-8 h-8" />}
      />

      <Toast 
        show={showToast} 
        message={toastMsg} 
        type={toastType} 
        onClose={() => setShowToast(false)} 
      />
    </div>
  );
}
