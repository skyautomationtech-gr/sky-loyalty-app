import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { Notification } from '../types';
import { Bell, ArrowLeft, CheckCircle2, Info, AlertTriangle, Sparkles, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NotificationsProps {
  onBack: () => void;
}

export default function Notifications({ onBack }: NotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'notifications'), orderBy('timestamp', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() } as Notification)));
      setLoading(false);
    });
    return unsub;
  }, []);

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <header className="flex justify-between items-center bg-white py-2">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 text-gray-text hover:text-teal-primary transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="w-10 h-10 rounded-xl bg-teal-primary/10 flex items-center justify-center">
            <Bell className="w-6 h-6 text-teal-primary" />
          </div>
          <div>
            <h1 className="text-xl font-black text-dark-text">নোটিফিকেশন</h1>
            <p className="text-[10px] font-black text-gray-text uppercase tracking-widest">সাম্প্রতিক এলার্ট</p>
          </div>
        </div>
        {notifications.length > 0 && (
          <button className="p-2 text-gray-text hover:text-danger-red transition-colors">
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </header>

      {/* Notifications List */}
      <div className="space-y-3">
        {loading ? (
          Array(5).fill(0).map((_, i) => (
            <div key={i} className="bg-white border border-bg-light rounded-2xl p-4 flex gap-4 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-bg-light shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-bg-light rounded w-3/4" />
                <div className="h-3 bg-bg-light rounded w-1/4" />
              </div>
            </div>
          ))
        ) : (
          <AnimatePresence mode="popLayout">
            {notifications.map((notif, idx) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white border border-bg-light rounded-2xl p-4 flex gap-4 shadow-sm hover:border-teal-primary/20 transition-all group"
              >
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                  notif.type === 'SUCCESS' ? 'bg-teal-primary/10 text-teal-primary' :
                  notif.type === 'WARNING' ? 'bg-orange-50 text-orange-500' :
                  'bg-blue-50 text-blue-500'
                }`}>
                  {notif.type === 'SUCCESS' ? <CheckCircle2 className="w-5 h-5" /> :
                   notif.type === 'WARNING' ? <AlertTriangle className="w-5 h-5" /> :
                   <Info className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start gap-2">
                    <p className="text-sm font-bold text-dark-text leading-tight">{notif.message}</p>
                    {idx === 0 && (
                      <span className="flex items-center gap-1 text-[8px] font-black text-teal-primary bg-teal-primary/10 px-1.5 py-0.5 rounded-full uppercase tracking-tighter">
                        <Sparkles className="w-2 h-2" /> New
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-text font-black mt-2 flex items-center gap-1.5">
                    <span className="w-1 h-1 bg-gray-text/30 rounded-full" />
                    {new Date(notif.timestamp).toLocaleString('bn-BD', {
                      hour: '2-digit',
                      minute: '2-digit',
                      day: '2-digit',
                      month: 'short'
                    })}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {!loading && notifications.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center space-y-4"
          >
            <div className="w-24 h-24 rounded-[2.5rem] bg-bg-light flex items-center justify-center text-gray-text/30 relative">
              <Bell className="w-12 h-12" />
              <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-teal-primary/10 rounded-full blur-2xl"
              />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-black text-dark-text uppercase tracking-widest">কোনো নোটিফিকেশন নেই</p>
              <p className="text-[10px] font-bold text-gray-text">নতুন কোনো আপডেট আসলে এখানে দেখতে পাবেন 🔕</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
