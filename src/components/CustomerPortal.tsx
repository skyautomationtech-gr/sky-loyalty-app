import React, { useState, memo } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Customer } from '../types';
import { Phone, Search, ArrowLeft, Zap, Sparkles, MapPin, History, QrCode, TrendingUp, Lock, Gift, Users, Target, Trophy, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import CustomerCard from './CustomerCard';
import Toast from './Toast';
import { APP_LOGO, APP_NAME } from '../constants';

function CustomerPortal({ onBack }: { onBack: () => void }) {
  const [phone, setPhone] = useState('');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const handleFeatureClick = (featureName: string) => {
    setToastMsg(`${featureName} is coming soon!`);
    setShowToast(true);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    setLoading(true);
    setError(null);
    try {
      const q = query(collection(db, 'customers'), where('phone', '==', phone));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setCustomer({ id: snap.docs[0].id, ...snap.docs[0].data() } as Customer);
      } else {
        setError('এই নম্বরে কোনো কাস্টমার পাওয়া যায়নি।');
      }
    } catch (err) {
      setError('সার্ভার ত্রুটি হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  const getTierProgress = () => {
    if (!customer) return 0;
    const thresholds = { SILVER: 1000, GOLD: 5000, PLATINUM: 10000 };
    let nextThreshold = 1000;
    let currentBase = 0;

    if (customer.tier === 'BRONZE') nextThreshold = 1000;
    else if (customer.tier === 'SILVER') { nextThreshold = 5000; currentBase = 1000; }
    else if (customer.tier === 'GOLD') { nextThreshold = 10000; currentBase = 5000; }
    else return 100;

    const progress = ((customer.points - currentBase) / (nextThreshold - currentBase)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  if (customer) {
    return (
      <div className="min-h-screen bg-white p-6 pb-24 space-y-8 overflow-y-auto no-scrollbar">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setCustomer(null)} className="p-2 bg-white rounded-xl shadow-sm border border-bg-light">
              <ArrowLeft className="w-5 h-5 text-gray-text" />
            </button>
            <h1 className="text-xl font-black text-dark-text tracking-tight">আমার প্রোফাইল</h1>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white p-2 border border-bg-light">
            <img src={APP_LOGO} alt={APP_NAME} className="w-full h-full object-contain" />
          </div>
        </header>

        <CustomerCard customer={customer} />

        {/* QR Code Section */}
        <div className="bg-white rounded-[2.5rem] p-8 flex flex-col items-center text-center space-y-4 shadow-sm border border-bg-light">
          <div className="p-4 bg-bg-light rounded-3xl border-2 border-dashed border-teal-primary/20">
            <QRCodeSVG value={customer.customerId} size={150} level="H" includeMargin={true} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-text">আপনার ডিজিটাল আইডি</p>
            <p className="text-lg font-black text-dark-text mt-1">{customer.customerId}</p>
          </div>
        </div>

        {/* Points & Progress */}
        <div className="bg-white rounded-[2.5rem] p-8 space-y-6 shadow-sm border border-bg-light">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-4xl font-black text-dark-text tracking-tighter">{customer.points.toLocaleString()}</p>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-text mt-1">মোট পয়েন্ট</p>
            </div>
            <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
              customer.tier === 'PLATINUM' ? 'bg-teal-primary text-white' :
              customer.tier === 'GOLD' ? 'bg-yellow-500 text-white' :
              customer.tier === 'SILVER' ? 'bg-slate-400 text-white' :
              'bg-orange-600 text-white'
            }`}>
              {customer.tier} TIER
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <p className="text-[9px] font-black text-gray-text uppercase tracking-widest flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> পরবর্তী টিয়ার প্রগ্রেস
              </p>
              <p className="text-[9px] font-black text-teal-primary uppercase tracking-widest">{Math.round(getTierProgress())}%</p>
            </div>
            <div className="h-2 bg-bg-light rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${getTierProgress()}%` }}
                className="h-full teal-gradient"
              />
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-bg-light shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-teal-primary/5 flex items-center justify-center text-teal-primary mb-3">
              <MapPin className="w-5 h-5" />
            </div>
            <p className="text-[9px] font-black text-gray-text uppercase tracking-widest">ঠিকানা</p>
            <p className="text-xs font-bold text-dark-text mt-1 truncate">{customer.address || 'দেওয়া হয়নি'}</p>
          </div>
          <div className="bg-white p-5 rounded-3xl border border-bg-light shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-teal-primary/5 flex items-center justify-center text-teal-primary mb-3">
              <Sparkles className="w-5 h-5" />
            </div>
            <p className="text-[9px] font-black text-gray-text uppercase tracking-widest">যোগদান</p>
            <p className="text-xs font-bold text-dark-text mt-1">{new Date(customer.joinedAt).toLocaleDateString('bn-BD')}</p>
          </div>
        </div>

        {/* Exclusive Features (Coming Soon) */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-gray-text uppercase tracking-[0.3em] ml-2 flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-teal-primary/40" />
            এক্সক্লুসিভ ফিচার
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Lock, label: 'VIP Secret Lounge', color: 'text-purple-500', bg: 'bg-purple-50' },
              { icon: Gift, label: 'Digital Mystery Box', color: 'text-pink-500', bg: 'bg-pink-50' },
              { icon: Zap, label: 'Flash Points', color: 'text-amber-500', bg: 'bg-amber-50' },
              { icon: Users, label: 'Squad Goals', color: 'text-blue-500', bg: 'bg-blue-50' },
              { icon: Target, label: 'Point Auction', color: 'text-red-500', bg: 'bg-red-50' },
              { icon: TrendingUp, label: 'Streak Rewards', color: 'text-orange-500', bg: 'bg-orange-50' },
              { icon: Trophy, label: 'Milestones', color: 'text-emerald-500', bg: 'bg-emerald-50' },
              { icon: CreditCard, label: 'Gift Cards', color: 'text-indigo-500', bg: 'bg-indigo-50' },
            ].map((feature, idx) => (
              <motion.button
                key={idx}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleFeatureClick(feature.label)}
                className="bg-white p-4 rounded-3xl border border-bg-light shadow-sm flex flex-col items-center text-center gap-3 hover:border-teal-primary/20 transition-all relative overflow-hidden"
              >
                <div className="absolute -right-2 -top-2 bg-teal-primary/10 text-teal-primary text-[8px] font-black px-2 py-1 rounded-bl-xl">SOON</div>
                <div className={`w-12 h-12 rounded-2xl ${feature.bg} flex items-center justify-center ${feature.color}`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <p className="text-[10px] font-black text-dark-text leading-tight">{feature.label}</p>
              </motion.button>
            ))}
          </div>
        </div>

        <div className="text-center p-8">
          <p className="text-gray-text text-xs font-bold leading-relaxed">
            পয়েন্ট রিডিম করতে বা আপডেট করতে আমাদের ব্রাঞ্চে যোগাযোগ করুন।
          </p>
        </div>

        <Toast show={showToast} message={toastMsg} type="info" onClose={() => setShowToast(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 relative">
      <button 
        onClick={onBack}
        className="absolute top-8 left-8 p-3 bg-white rounded-2xl shadow-sm border border-bg-light text-gray-text hover:text-teal-primary transition-all"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center shadow-2xl mb-8 p-4">
        <img src={APP_LOGO} alt={APP_NAME} className="w-full h-full object-contain" />
      </div>

      <div className="text-center space-y-2 mb-12">
        <h1 className="text-3xl font-black text-dark-text tracking-tighter">কাস্টমার পোর্টাল</h1>
        <p className="text-gray-text font-bold uppercase tracking-[0.2em] text-[10px]">আপনার পয়েন্ট ও কার্ড চেক করুন</p>
      </div>

      <form onSubmit={handleSearch} className="w-full max-w-sm space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-text uppercase tracking-widest ml-1">ফোন নম্বর</label>
          <div className="relative">
            <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-text" />
            <input 
              required
              type="tel" 
              placeholder="017XXXXXXXX"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full h-16 bg-white rounded-2xl pl-14 pr-6 font-bold text-dark-text shadow-sm border border-bg-light focus:outline-none focus:ring-2 focus:ring-teal-primary/20 transition-all"
            />
          </div>
        </div>

        {error && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-danger-red text-xs font-bold text-center"
          >
            {error}
          </motion.p>
        )}

        <button 
          type="submit"
          disabled={loading}
          className="w-full h-16 teal-gradient text-white font-black rounded-2xl shadow-xl shadow-teal-primary/20 uppercase tracking-widest flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {loading ? (
            <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Search className="w-5 h-5" />
              চেক করুন
            </>
          )}
        </button>
      </form>

      <div className="mt-12 text-center">
        <p className="text-gray-text text-[10px] font-black uppercase tracking-widest">Powered by Sky Automation Tech</p>
      </div>
    </div>
  );
}

export default memo(CustomerPortal);
