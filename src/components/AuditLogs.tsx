import React, { useState, useEffect, memo } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { AuditLog } from '../services/auditService';
import { ChevronLeft, History, Search, Filter, Clock, User, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';

interface AuditLogsProps {
  onBack: () => void;
}

function AuditLogs({ onBack }: AuditLogsProps) {
  const { t } = useLanguage();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(100));
    const unsub = onSnapshot(q, (snap) => {
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
      setLoading(false);
    });
    return unsub;
  }, []);

  const filteredLogs = logs.filter(log => 
    log.staffName.toLowerCase().includes(search.toLowerCase()) ||
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    log.details.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-24 bg-white min-h-full">
      <header className="flex items-center gap-4 bg-white py-2">
        <button onClick={onBack} className="p-2 bg-bg-light rounded-xl text-gray-text hover:text-teal-primary transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-primary/10 flex items-center justify-center border border-teal-primary/10">
            <History className="w-6 h-6 text-teal-primary" />
          </div>
          <h1 className="text-xl font-black text-dark-text tracking-tight">{t('audit_logs')}</h1>
        </div>
      </header>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-text group-focus-within:text-teal-primary transition-colors" />
        <input
          type="text"
          placeholder="স্টাফ বা অ্যাকশন দিয়ে খুঁজুন..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border border-bg-light rounded-2xl py-4 pl-12 pr-4 text-dark-text font-bold text-sm focus:outline-none focus:ring-2 focus:ring-teal-primary/20 transition-all"
        />
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-teal-primary border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-xs font-black text-gray-text uppercase tracking-widest">লোড হচ্ছে...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="bg-white border border-bg-light rounded-[2rem] p-12 text-center space-y-4">
            <div className="w-16 h-16 bg-bg-light rounded-2xl flex items-center justify-center mx-auto text-gray-text/30">
              <Activity className="w-8 h-8" />
            </div>
            <p className="text-xs font-black text-gray-text uppercase tracking-widest">কোনো লগ পাওয়া যায়নি</p>
          </div>
        ) : (
          filteredLogs.map((log, idx) => (
            <div
              key={idx}
              className="bg-white border border-bg-light rounded-2xl p-4 shadow-sm hover:border-teal-primary/20 transition-all"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-bg-light flex items-center justify-center text-teal-primary">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-dark-text">{log.staffName}</p>
                    <p className="text-[8px] font-black text-gray-text uppercase tracking-widest">{log.action}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-gray-text">
                  <Clock className="w-3 h-3" />
                  <span className="text-[9px] font-black uppercase">{new Date(log.timestamp).toLocaleTimeString('bn-BD')}</span>
                </div>
              </div>
              <p className="text-[11px] text-gray-text font-bold leading-relaxed bg-bg-light/50 p-3 rounded-xl border border-bg-light/50">
                {log.details}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default memo(AuditLogs);
