import React, { useState, memo } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, getDocs, query, orderBy, limit, where, updateDoc } from 'firebase/firestore';
import { UserPlus, User, Phone, MapPin, Sparkles, ArrowRight, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import Toast from './Toast';

interface AddCustomerProps {
  onSuccess?: () => void;
}

function AddCustomer({ onSuccess }: AddCustomerProps) {
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    referralCode: '',
  });

  const generateCustomerId = async () => {
    try {
      const q = query(collection(db, 'customers'), orderBy('customerId', 'desc'), limit(1));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        return 'SKY-00001';
      } else {
        const lastId = snap.docs[0].data().customerId;
        const lastNum = parseInt(lastId.split('-')[1]);
        const nextNum = lastNum + 1;
        return `SKY-${nextNum.toString().padStart(5, '0')}`;
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'customers');
      return 'SKY-00001';
    }
  };

  const generateReferralCode = async (): Promise<string> => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const referralCode = `SAT-${code}`;

    // Check uniqueness
    const q = query(collection(db, 'customers'), where('referralCode', '==', referralCode));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return generateReferralCode(); // Retry if not unique
    }
    return referralCode;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const customerId = await generateCustomerId();
      const referralCode = await generateReferralCode();
      const normalizedPhone = formData.phone.replace(/\D/g, '');
      const newCustomer = {
        ...formData,
        phone: normalizedPhone,
        customerId,
        referralCode,
        points: formData.referralCode ? 2 : 0, // 2 points only if referred, 0 otherwise
        tier: 'BRONZE',
        joinedAt: new Date().toISOString(),
        lastVisit: new Date().toISOString(),
        referralId: formData.referralCode || null,
      };
      
      await addDoc(collection(db, 'customers'), newCustomer);
      
      // Send Welcome WhatsApp
      const sendWelcomeWhatsApp = (c: any) => {
        const phone = c.phone
          .replace(/\D/g, '')
          .replace(/^0/, '88');
        
        const message = 
          `🌟 স্বাগতম, ${c.name}!\n\n` +
          `আপনি Sky Automation Tech Loyalty Program-এ যোগ দিয়েছেন!\n\n` +
          `🪪 আপনার কার্ড নম্বর: *${c.customerId}*\n` +
          `🎁 আপনার রেফারেল কোড: *${c.referralCode}*\n` +
          `⭐ বর্তমান পয়েন্ট: *${c.points} পয়েন্ট*\n` +
          `🏆 টায়ার: *Bronze*\n\n` +
          `রেফারেল কোড শেয়ার করুন —\n` +
          `আপনি ও আপনার বন্ধু উভয়ই *২ পয়েন্ট* পাবেন!\n\n` +
          `📞 যোগাযোগ: 01967017506\n` +
          `💬 WhatsApp: 01577351518\n\n` +
          `ধন্যবাদ Sky Automation Tech! 🛍️`;

        const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
      };

      sendWelcomeWhatsApp(newCustomer);
      
      // If referred, add 2 bonus points to referrer
      if (formData.referralCode) {
        const q = query(collection(db, 'customers'), where('referralCode', '==', formData.referralCode));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const referrerDoc = snap.docs[0];
          await updateDoc(referrerDoc.ref, {
            points: referrerDoc.data().points + 2
          });
          await addDoc(collection(db, 'transactions'), {
            customerId: referrerDoc.id, // Use document ID for transaction
            type: 'ADD',
            amount: 2,
            pointsAfter: referrerDoc.data().points + 2,
            description: `রেফারেল বোনাস: ${customerId}`,
            timestamp: new Date().toISOString(),
            staffId: 'system'
          });
        }
      }
      
      await addDoc(collection(db, 'notifications'), {
        message: `নতুন কাস্টমার ${formData.name} যোগ করা হয়েছে (${customerId})`,
        type: 'SUCCESS',
        timestamp: new Date().toISOString(),
      });

      setToastMsg('কাস্টমার সফলভাবে যোগ করা হয়েছে ✅');
      setToastType('success');
      setShowToast(true);
      setFormData({ name: '', phone: '', address: '' });
      setTimeout(() => onSuccess?.(), 2000);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'customers');
      setToastMsg('কাস্টমার যোগ করতে সমস্যা হয়েছে।');
      setToastType('error');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-24">
      {/* Header */}
      <header className="flex justify-between items-center bg-white py-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-primary/10 flex items-center justify-center border border-teal-primary/10">
            <UserPlus className="w-6 h-6 text-teal-primary" />
          </div>
          <h1 className="text-xl font-black text-dark-text tracking-tight">নতুন কাস্টমার</h1>
        </div>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[2.5rem] p-8 border border-bg-light shadow-sm relative overflow-hidden"
      >
        {/* Decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-text uppercase tracking-widest ml-1">কাস্টমারের নাম</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-text group-focus-within:text-teal-primary transition-colors" />
              <input 
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="পূর্ণ নাম লিখুন"
                className="w-full h-14 bg-bg-light rounded-2xl pl-12 pr-5 text-dark-text font-bold text-sm focus:outline-none focus:ring-2 focus:ring-teal-primary/20 transition-all border-2 border-transparent focus:border-teal-primary/10" 
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-text uppercase tracking-widest ml-1">ফোন নম্বর</label>
            <div className="relative group">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-text group-focus-within:text-teal-primary transition-colors" />
              <input 
                required
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="01XXX XXXXXX"
                className="w-full h-14 bg-bg-light rounded-2xl pl-12 pr-5 text-dark-text font-bold text-sm focus:outline-none focus:ring-2 focus:ring-teal-primary/20 transition-all border-2 border-transparent focus:border-teal-primary/10" 
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-text uppercase tracking-widest ml-1">ঠিকানা</label>
            <div className="relative group">
              <MapPin className="absolute left-4 top-6 w-5 h-5 text-gray-text group-focus-within:text-teal-primary transition-colors" />
              <textarea 
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="পূর্ণ ঠিকানা লিখুন"
                rows={3}
                className="w-full bg-bg-light rounded-2xl pl-12 pr-5 pt-5 text-dark-text font-bold text-sm focus:outline-none focus:ring-2 focus:ring-teal-primary/20 transition-all border-2 border-transparent focus:border-teal-primary/10 resize-none" 
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-text uppercase tracking-widest ml-1">রেফারেল কোড (ঐচ্ছিক)</label>
            <div className="relative group">
              <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-text group-focus-within:text-teal-primary transition-colors" />
              <input 
                value={formData.referralCode || ''}
                onChange={(e) => setFormData({ ...formData, referralCode: e.target.value })}
                placeholder="রেফারেল কোড লিখুন"
                className="w-full h-14 bg-bg-light rounded-2xl pl-12 pr-5 text-dark-text font-bold text-sm focus:outline-none focus:ring-2 focus:ring-teal-primary/20 transition-all border-2 border-transparent focus:border-teal-primary/10" 
              />
            </div>
          </div>

          <motion.button 
            whileTap={{ scale: 0.98 }}
            type="submit" 
            disabled={loading}
            className="w-full h-14 teal-gradient text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl shadow-teal-primary/20 hover:opacity-90 transition-all mt-4 disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {loading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>যোগ করুন</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </motion.button>
        </form>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="p-6 bg-teal-primary/5 rounded-[2.5rem] border border-teal-primary/10 flex items-start gap-4"
      >
        <div className="w-10 h-10 rounded-2xl bg-teal-primary/10 flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-teal-primary" />
        </div>
        <div>
          <p className="text-[10px] font-black text-teal-primary uppercase tracking-[0.2em] mb-1">টিপস</p>
          <p className="text-xs text-dark-text font-bold leading-relaxed">
            কাস্টমার আইডি অটোমেটিক তৈরি হবে। নতুন কাস্টমার সরাসরি <span className="text-teal-primary">BRONZE</span> টিয়ারে ০ পয়েন্ট নিয়ে শুরু করবেন।
          </p>
        </div>
      </motion.div>

      <Toast 
        show={showToast} 
        message={toastMsg} 
        type={toastType} 
        onClose={() => setShowToast(false)} 
      />
    </div>
  );
}

export default memo(AddCustomer);
