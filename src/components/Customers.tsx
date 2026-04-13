import { useState, useEffect, useMemo } from 'react';
import { Customer, Staff, Transaction } from '../types';
import { db } from '../firebase';
import { collection, addDoc, updateDoc, doc, deleteDoc, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { Search, Plus, Phone, MapPin, Zap, ShoppingBag, History, Edit2, Trash2, X, Download, Users, ChevronRight, MessageSquare, RefreshCw, ArrowUpRight, Sparkles, UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import CustomerCard from './CustomerCard';
import html2canvas from 'html2canvas';
import ConfirmationModal from './ConfirmationModal';
import Toast from './Toast';

interface CustomersProps {
  user: Staff | null;
  customers: Customer[];
}

export default function Customers({ user, customers }: CustomersProps) {
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const filteredCustomers = useMemo(() => {
    const s = search.toLowerCase();
    return customers.filter(m => 
      m.name.toLowerCase().includes(s) ||
      m.phone.includes(s) ||
      m.customerId.toLowerCase().includes(s)
    );
  }, [customers, search]);

  return (
    <div className="space-y-6 pb-24 bg-[#F8FFFE]">
      {/* Header */}
      <header className="flex justify-between items-center bg-white py-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-primary/10 flex items-center justify-center border border-teal-primary/10">
            <Users className="w-6 h-6 text-teal-primary" />
          </div>
          <h1 className="text-xl font-black text-dark-text tracking-tight">কাস্টমার লিস্ট</h1>
        </div>
      </header>

      {/* Search Bar */}
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-text group-focus-within:text-teal-primary transition-colors" />
        <input
          type="text"
          placeholder="নাম, ফোন বা আইডি দিয়ে খুঁজুন..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-bg-light rounded-2xl py-4 pl-12 pr-4 text-dark-text font-bold text-sm focus:outline-none focus:ring-2 focus:ring-teal-primary/20 transition-all border-2 border-transparent focus:border-teal-primary/10"
        />
      </div>

      {/* Customer List */}
      <div className="space-y-3">
        {filteredCustomers.map((customer, idx) => (
          <motion.div
            key={customer.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(idx * 0.02, 0.3) }}
            onClick={() => setSelectedCustomer(customer)}
            className="bg-white border border-bg-light rounded-[2rem] p-4 flex justify-between items-center shadow-sm active:scale-[0.98] transition-all cursor-pointer group hover:border-teal-primary/20"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-primary/10 flex items-center justify-center font-black text-teal-primary text-lg border-2 border-white shadow-sm group-hover:scale-110 transition-transform">
                {customer.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-black text-dark-text truncate max-w-[150px]">{customer.name}</h3>
                <p className="text-[10px] text-gray-text font-black uppercase tracking-widest">{customer.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right flex flex-col items-end gap-1">
                <p className="text-lg font-black text-teal-primary leading-none">{customer.points.toLocaleString()}</p>
                <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${
                  customer.tier === 'PLATINUM' ? 'bg-teal-primary/10 border-teal-primary text-teal-primary' :
                  customer.tier === 'GOLD' ? 'bg-yellow-50 border-yellow-500 text-yellow-600' :
                  customer.tier === 'SILVER' ? 'bg-slate-50 border-slate-400 text-slate-500' :
                  'bg-orange-50 border-orange-600 text-orange-600'
                }`}>
                  {customer.tier}
                </span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-text opacity-30 group-hover:opacity-100 transition-opacity" />
            </div>
          </motion.div>
        ))}
        {filteredCustomers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-20 h-20 rounded-[2rem] bg-bg-light flex items-center justify-center text-gray-text/30">
              <Users className="w-10 h-10" />
            </div>
            <p className="text-xs font-black text-gray-text uppercase tracking-widest">কোনো কাস্টমার পাওয়া যায়নি 👥</p>
          </div>
        )}
      </div>

      {/* Customer Detail Modal */}
      <AnimatePresence>
        {selectedCustomer && (
          <CustomerDetailModal 
            customer={selectedCustomer} 
            user={user}
            onClose={() => setSelectedCustomer(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function CustomerDetailModal({ customer, user, onClose }: { customer: Customer, user: Staff | null, onClose: () => void }) {
  const [pointsInput, setPointsInput] = useState('');
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [redeemInput, setRedeemInput] = useState('');
  const [history, setHistory] = useState<Transaction[]>([]);
  const [addMode, setAddMode] = useState<'DIRECT' | 'AMOUNT'>('AMOUNT');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editData, setEditData] = useState({
    name: customer.name,
    phone: customer.phone,
    address: customer.address || ''
  });
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    const q = query(
      collection(db, 'transactions'),
      where('customerId', '==', customer.id),
      orderBy('timestamp', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)));
    });
    return unsub;
  }, [customer.id]);

  const calculatedPoints = purchaseAmount ? Math.floor(parseInt(purchaseAmount) / 100) : 0;

  const handlePoints = async (type: 'ADD' | 'REDEEM', customAmount?: number) => {
    const amount = customAmount ?? parseInt(type === 'ADD' ? pointsInput : redeemInput);
    if (isNaN(amount) || amount <= 0) return;
    
    if (type === 'REDEEM' && customer.points < amount) {
      setToastMsg('পর্যাপ্ত পয়েন্ট নেই');
      setToastType('error');
      setShowToast(true);
      return;
    }

    setLoading(true);
    const newPoints = type === 'ADD' ? customer.points + amount : customer.points - amount;
    
    let newTier = customer.tier;
    if (newPoints >= 5000) newTier = 'PLATINUM';
    else if (newPoints >= 1500) newTier = 'GOLD';
    else if (newPoints >= 500) newTier = 'SILVER';
    else newTier = 'BRONZE';

    const sendWhatsApp = (customer: Customer, amount: number, type: 'ADD' | 'REDEEM') => {
      let phone = customer.phone.replace(/\D/g, '');
      if (phone.startsWith('0')) {
        phone = '88' + phone;
      } else if (!phone.startsWith('88')) {
        phone = '88' + phone;
      }
      
      let message = '';
      if (type === 'ADD') {
        message = 
          `🌟 অভিনন্দন, ${customer.name}!\n\n` +
          `✅ আপনার একাউন্টে *${amount} পয়েন্ট* যোগ হয়েছে!\n\n` +
          `💰 মোট পয়েন্ট: *${newPoints} পয়েন্ট*\n` +
          `🏆 আপনার টায়ার: *${newTier}*\n` +
          `🪪 কার্ড নম্বর: *${customer.customerId}*\n\n` +
          `🛍️ Sky Automation Tech এ আপনাকে স্বাগতম!\n` +
          `📞 যোগাযোগ: 01967017506`;
      } else {
        message = 
          `🔄 পয়েন্ট রিডিম সফল, ${customer.name}!\n\n` +
          `✅ *${amount} পয়েন্ট* রিডিম হয়েছে!\n\n` +
          `💰 বাকি পয়েন্ট: *${newPoints} পয়েন্ট*\n` +
          `🏆 আপনার টায়ার: *${newTier}*\n` +
          `🪪 কার্ড নম্বর: *${customer.customerId}*\n\n` +
          `🛍️ ধন্যবাদ Sky Automation Tech এ কেনাকাটার জন্য!\n` +
          `📞 যোগাযোগ: 01967017506`;
      }

      const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      const win = window.open(url, '_blank');
      if (!win) {
        // If popup is blocked, try a direct link click
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.click();
      }
    };

    try {
      await updateDoc(doc(db, 'customers', customer.id), {
        points: newPoints,
        tier: newTier,
        lastVisit: new Date().toISOString()
      });

      await addDoc(collection(db, 'transactions'), {
        customerId: customer.id,
        type,
        amount,
        pointsAfter: newPoints,
        description: type === 'ADD' ? (addMode === 'AMOUNT' ? `Earned from ৳${purchaseAmount} purchase` : 'Points added by staff') : 'Points redeemed for reward',
        timestamp: new Date().toISOString(),
        staffId: user?.id || 'system'
      });

      await addDoc(collection(db, 'notifications'), {
        message: `${customer.name} ${type === 'ADD' ? 'earned' : 'redeemed'} ${amount} points`,
        type: type === 'ADD' ? 'SUCCESS' : 'INFO',
        timestamp: new Date().toISOString(),
      });

      setToastMsg(`পয়েন্ট ${type === 'ADD' ? 'যোগ' : 'রিডিম'} সফল হয়েছে!`);
      setToastType('success');
      setShowToast(true);

      sendWhatsApp(customer, amount, type);

      setPointsInput('');
      setRedeemInput('');
      setPurchaseAmount('');
    } catch (err) {
      console.error(err);
      setToastMsg('ত্রুটি হয়েছে। আবার চেষ্টা করুন।');
      setToastType('error');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCustomer = async () => {
    if (user?.role !== 'Admin' && user?.role !== 'Master Admin') return;
    if (!editData.name.trim() || !editData.phone.trim()) {
      setToastMsg('নাম এবং ফোন নম্বর প্রয়োজন');
      setToastType('error');
      setShowToast(true);
      return;
    }

    setLoading(true);
    try {
      await updateDoc(doc(db, 'customers', customer.id), {
        name: editData.name,
        phone: editData.phone,
        address: editData.address
      });
      
      setToastMsg('কাস্টমার তথ্য আপডেট হয়েছে ✅');
      setToastType('success');
      setShowToast(true);
      setIsEditMode(false);
    } catch (err) {
      console.error('Error updating customer:', err);
      setToastMsg('আপডেট করতে সমস্যা হয়েছে');
      setToastType('error');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (user?.role !== 'Admin' && user?.role !== 'Master Admin') return;
    try {
      await deleteDoc(doc(db, 'customers', customer.id));
      onClose();
    } catch (err) {
      console.error(err);
      setToastMsg('ডিলিট করতে সমস্যা হয়েছে।');
      setToastType('error');
      setShowToast(true);
    }
  };

  const handleDownloadCard = async () => {
    if (user?.role !== 'Admin' && user?.role !== 'Master Admin') return;
    setIsDownloading(true);
    try {
      const cardElement = document.getElementById('luxury-card-download');
      if (cardElement) {
        const canvas = await html2canvas(cardElement, {
          scale: 3,
          useCORS: true,
          backgroundColor: null,
          onclone: (clonedDoc) => {
            // Force standard color parsing by removing modern CSS features from the clone
            const style = clonedDoc.createElement('style');
            style.innerHTML = `
              * {
                color-scheme: light !important;
              }
              :root {
                --color-teal-primary: #00BFA6 !important;
                --color-bg-light: #F8FFFE !important;
                --color-dark-text: #1A2E35 !important;
                --color-gray-text: #8A9BA8 !important;
                --color-danger-red: #FF5252 !important;
              }
            `;
            clonedDoc.head.appendChild(style);
          }
        });
        const link = document.createElement('a');
        link.download = `${customer.customerId}_Card.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    } catch (err) {
      console.error('Error downloading card:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const nextTierPoints = customer.tier === 'BRONZE' ? 500 : customer.tier === 'SILVER' ? 1500 : customer.tier === 'GOLD' ? 5000 : 0;
  const progress = nextTierPoints > 0 ? Math.min((customer.points / nextTierPoints) * 100, 100) : 100;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-dark-text/60 backdrop-blur-sm">
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        className="w-full max-w-[430px] h-[92vh] bg-white rounded-t-[3rem] overflow-hidden flex flex-col shadow-2xl"
      >
        <div className="p-6 pb-0 flex justify-between items-center">
          <h2 className="text-xl font-black text-dark-text tracking-tight">কাস্টমার প্রোফাইল</h2>
          <button onClick={onClose} className="p-2 bg-bg-light rounded-full text-gray-text hover:text-dark-text transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar bg-[#F8FFFE]">
          {/* Luxury Card Section */}
          <div className="space-y-4">
            <CustomerCard customer={customer} id="luxury-card-download" />
            {(user?.role === 'Admin' || user?.role === 'Master Admin') && (
              <motion.button 
                whileTap={{ scale: 0.98 }}
                onClick={handleDownloadCard}
                disabled={isDownloading}
                className="w-full py-4 bg-[#0D0D0D] text-[#C9A84C] rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 transition-all border border-[#C9A84C]/20"
              >
                {isDownloading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {isDownloading ? 'প্রস্তুত হচ্ছে...' : 'কার্ড ডাউনলোড করুন'}
              </motion.button>
            )}
          </div>

          {/* Points & Tier Progress */}
          <div className="bg-bg-light rounded-[2.5rem] p-8 space-y-6 border border-bg-light relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />
            
            <div className="flex justify-between items-end relative z-10">
              <div>
                <p className="text-4xl font-black text-dark-text tracking-tighter">{customer.points.toLocaleString()}</p>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-text mt-1">মোট পয়েন্ট</p>
              </div>
              <div className="text-right">
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg border ${
                  customer.tier === 'PLATINUM' ? 'bg-teal-primary text-white border-teal-primary shadow-teal-primary/20' :
                  customer.tier === 'GOLD' ? 'bg-yellow-500 text-white border-yellow-500 shadow-yellow-500/20' :
                  customer.tier === 'SILVER' ? 'bg-slate-400 text-white border-slate-400 shadow-slate-400/20' :
                  'bg-orange-600 text-white border-orange-600 shadow-orange-600/20'
                }`}>
                  {customer.tier}
                </span>
              </div>
            </div>
            
            {nextTierPoints > 0 && (
              <div className="space-y-3 relative z-10">
                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-gray-text">
                  <span>পরবর্তী টিয়ার প্রগ্রেস</span>
                  <span>{customer.points} / {nextTierPoints}</span>
                </div>
                <div className="h-2 bg-white rounded-full overflow-hidden border border-bg-light">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-teal-primary rounded-full shadow-[0_0_10px_rgba(0,191,166,0.3)]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Points Management */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-dark-text ml-1">
              <Zap className="w-4 h-4 text-teal-primary" />
              <h3 className="text-[10px] font-black uppercase tracking-widest">পয়েন্ট ম্যানেজমেন্ট</h3>
            </div>
            
            <div className="bg-white border border-bg-light rounded-[2.5rem] p-6 space-y-6 shadow-sm">
              <div className="flex bg-bg-light rounded-2xl p-1.5 border border-bg-light">
                <button 
                  onClick={() => setAddMode('AMOUNT')}
                  className={`flex-1 py-2.5 text-[10px] font-black rounded-xl transition-all ${addMode === 'AMOUNT' ? 'bg-white text-teal-primary shadow-sm' : 'text-gray-text'}`}
                >
                  টাকা থেকে পয়েন্ট
                </button>
                <button 
                  onClick={() => setAddMode('DIRECT')}
                  className={`flex-1 py-2.5 text-[10px] font-black rounded-xl transition-all ${addMode === 'DIRECT' ? 'bg-white text-teal-primary shadow-sm' : 'text-gray-text'}`}
                >
                  সরাসরি পয়েন্ট
                </button>
              </div>

              {addMode === 'AMOUNT' ? (
                <div className="space-y-4">
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-text font-black group-focus-within:text-teal-primary transition-colors">৳</span>
                    <input 
                      type="number" 
                      placeholder="ক্রয়কৃত টাকার পরিমাণ লিখুন"
                      value={purchaseAmount}
                      onChange={(e) => setPurchaseAmount(e.target.value)}
                      className="w-full bg-bg-light rounded-2xl p-4 pl-8 text-dark-text text-sm font-bold focus:outline-none focus:ring-2 focus:ring-teal-primary/20 transition-all border-2 border-transparent focus:border-teal-primary/10"
                    />
                  </div>
                  {calculatedPoints > 0 && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-teal-primary/5 border border-teal-primary/10 rounded-2xl p-4 text-center">
                      <p className="text-[10px] font-black text-teal-primary uppercase tracking-widest flex items-center justify-center gap-2">
                        <Sparkles className="w-3 h-3" /> আপনি <span className="text-xl">{calculatedPoints}</span> পয়েন্ট পাবেন
                      </p>
                    </motion.div>
                  )}
                  <motion.button 
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handlePoints('ADD', calculatedPoints)}
                    disabled={calculatedPoints <= 0 || loading}
                    className="w-full h-14 teal-gradient text-white text-xs font-black rounded-2xl shadow-xl shadow-teal-primary/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Plus className="w-4 h-4" />}
                    পয়েন্ট যোগ করুন
                  </motion.button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative group">
                    <Zap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-text group-focus-within:text-teal-primary transition-colors" />
                    <input 
                      type="number" 
                      placeholder="পয়েন্টের সংখ্যা লিখুন"
                      value={pointsInput}
                      onChange={(e) => setPointsInput(e.target.value)}
                      className="w-full bg-bg-light rounded-2xl p-4 pl-12 text-dark-text text-sm font-bold focus:outline-none focus:ring-2 focus:ring-teal-primary/20 transition-all border-2 border-transparent focus:border-teal-primary/10"
                    />
                  </div>
                  <motion.button 
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handlePoints('ADD')}
                    disabled={!pointsInput || loading}
                    className="w-full h-14 teal-gradient text-white text-xs font-black rounded-2xl shadow-xl shadow-teal-primary/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Plus className="w-4 h-4" />}
                    সরাসরি যোগ করুন
                  </motion.button>
                </div>
              )}

              <div className="pt-6 border-t border-bg-light space-y-4">
                <div className="relative group">
                  <ShoppingBag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-text group-focus-within:text-orange-500 transition-colors" />
                  <input 
                    type="number" 
                    placeholder="রিডিম করার পয়েন্ট সংখ্যা"
                    value={redeemInput}
                    onChange={(e) => setRedeemInput(e.target.value)}
                    className="w-full bg-bg-light rounded-2xl p-4 pl-12 text-dark-text text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all border-2 border-transparent focus:border-orange-500/10"
                  />
                </div>
                <motion.button 
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handlePoints('REDEEM')}
                  disabled={!redeemInput || loading}
                  className="w-full h-14 bg-white border-2 border-orange-500 text-orange-500 text-xs font-black rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <ArrowUpRight className="w-4 h-4" />}
                  পয়েন্ট রিডিম করুন
                </motion.button>
              </div>
            </div>
          </div>

          {/* Transaction History */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-dark-text ml-1">
              <History className="w-4 h-4 text-teal-primary" />
              <h3 className="text-[10px] font-black uppercase tracking-widest">লেনদেনের ইতিহাস</h3>
            </div>
            <div className="space-y-3">
              {history.map((tx, idx) => (
                <motion.div 
                  key={tx.id} 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white border border-bg-light rounded-2xl p-4 flex justify-between items-center shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === 'ADD' ? 'bg-teal-primary/10 text-teal-primary' : 'bg-orange-50 text-orange-500'}`}>
                      {tx.type === 'ADD' ? <Plus className="w-5 h-5" /> : <ShoppingBag className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-dark-text">{tx.type === 'ADD' ? 'পয়েন্ট যোগ' : 'পয়েন্ট রিডিম'}</p>
                      <p className="text-[9px] text-gray-text font-black uppercase">{new Date(tx.timestamp).toLocaleString('bn-BD')}</p>
                    </div>
                  </div>
                  <p className={`text-sm font-black ${tx.type === 'ADD' ? 'text-teal-primary' : 'text-orange-500'}`}>
                    {tx.type === 'ADD' ? '+' : '-'}{tx.amount}
                  </p>
                </motion.div>
              ))}
              {history.length === 0 && (
                <div className="bg-bg-light rounded-[2rem] p-10 text-center">
                  <p className="text-[10px] font-black text-gray-text uppercase tracking-widest">কোনো লেনদেন পাওয়া যায়নি</p>
                </div>
              )}
            </div>
          </section>

          {/* Contact Details */}
          <section className="bg-white border border-bg-light rounded-[2.5rem] p-8 space-y-6 shadow-sm">
            <h3 className="text-[10px] font-black text-gray-text uppercase tracking-widest">যোগাযোগের তথ্য</h3>
            <div className="space-y-5">
              {isEditMode ? (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-gray-text uppercase tracking-widest ml-1">নাম</label>
                    <input 
                      type="text"
                      value={editData.name}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      className="w-full bg-bg-light rounded-2xl p-4 text-dark-text text-sm font-bold focus:outline-none focus:ring-2 focus:ring-teal-primary/20 transition-all border-2 border-transparent focus:border-teal-primary/10"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-gray-text uppercase tracking-widest ml-1">ফোন নম্বর</label>
                    <input 
                      type="text"
                      value={editData.phone}
                      onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                      className="w-full bg-bg-light rounded-2xl p-4 text-dark-text text-sm font-bold focus:outline-none focus:ring-2 focus:ring-teal-primary/20 transition-all border-2 border-transparent focus:border-teal-primary/10"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-gray-text uppercase tracking-widest ml-1">ঠিকানা</label>
                    <textarea 
                      value={editData.address}
                      onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                      rows={2}
                      className="w-full bg-bg-light rounded-2xl p-4 text-dark-text text-sm font-bold focus:outline-none focus:ring-2 focus:ring-teal-primary/20 transition-all border-2 border-transparent focus:border-teal-primary/10 resize-none"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <motion.button 
                      whileTap={{ scale: 0.98 }}
                      onClick={handleUpdateCustomer}
                      disabled={loading}
                      className="flex-1 h-12 teal-gradient text-white rounded-xl font-black text-xs flex items-center justify-center gap-2"
                    >
                      {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                      সেভ করুন
                    </motion.button>
                    <motion.button 
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setIsEditMode(false);
                        setEditData({ name: customer.name, phone: customer.phone, address: customer.address || '' });
                      }}
                      className="flex-1 h-12 bg-bg-light text-gray-text rounded-xl font-black text-xs"
                    >
                      বাতিল
                    </motion.button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-bg-light flex items-center justify-center text-teal-primary border border-bg-light"><Phone className="w-5 h-5" /></div>
                    <div><p className="text-[9px] text-gray-text font-black uppercase tracking-widest">ফোন নম্বর</p><p className="text-sm text-dark-text font-bold">{customer.phone}</p></div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-bg-light flex items-center justify-center text-teal-primary border border-bg-light"><MapPin className="w-5 h-5" /></div>
                    <div><p className="text-[9px] text-gray-text font-black uppercase tracking-widest">ঠিকানা</p><p className="text-sm text-dark-text font-bold">{customer.address || 'দেওয়া হয়নি'}</p></div>
                  </div>
                  <motion.button 
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      let phone = customer.phone.replace(/\D/g, '');
                      if (phone.startsWith('0')) phone = '88' + phone;
                      else if (!phone.startsWith('88')) phone = '88' + phone;
                      const url = `https://wa.me/${phone}`;
                      const win = window.open(url, '_blank');
                      if (!win) {
                        const link = document.createElement('a');
                        link.href = url;
                        link.target = '_blank';
                        link.click();
                      }
                    }}
                    className="w-full h-14 bg-[#25D366] text-white rounded-2xl font-black text-xs flex items-center justify-center gap-3 shadow-xl shadow-[#25D366]/20 active:scale-95 transition-all"
                  >
                    <MessageSquare className="w-5 h-5" /> হোয়াটসঅ্যাপে মেসেজ দিন
                  </motion.button>
                </>
              )}
            </div>
          </section>

          {/* Admin Actions */}
          {(user?.role === 'Admin' || user?.role === 'Master Admin') && (
            <div className="flex gap-4 pb-12">
              <motion.button 
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsEditMode(!isEditMode)}
                className={`flex-1 h-14 rounded-2xl text-xs font-black flex items-center justify-center gap-2 active:scale-95 transition-all ${isEditMode ? 'bg-teal-primary text-white shadow-lg shadow-teal-primary/20' : 'bg-bg-light border border-bg-light text-dark-text'}`}
              >
                <Edit2 className="w-4 h-4" /> {isEditMode ? 'এডিট বন্ধ করুন' : 'এডিট করুন'}
              </motion.button>
              <motion.button 
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsDeleteModalOpen(true)}
                className="flex-1 h-14 border-2 border-danger-red/10 rounded-2xl text-danger-red text-xs font-black flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <Trash2 className="w-4 h-4" /> ডিলিট করুন
              </motion.button>
            </div>
          )}
        </div>
      </motion.div>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="ডিলিট করবেন?"
        message="আলহামদুলিল্লাহ — ডিলিট হয়ে গেলে আর ফেরার উপায় নেই!"
        confirmLabel="হ্যাঁ, ডিলিট করুন"
        cancelLabel="না, থাকুক"
        type="danger"
        icon={<Trash2 className="w-8 h-8" />}
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
