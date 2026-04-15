import { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { Customer, Staff, Transaction } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, updateDoc, doc, deleteDoc, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { Search, Plus, Phone, MapPin, Zap, ShoppingBag, History, Edit2, Trash2, X, Download, Users, ChevronRight, MessageSquare, RefreshCw, ArrowUpRight, Sparkles, UserCheck, Share2, Crown, Shield, ArrowDown, ArrowUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import ConfirmationModal from './ConfirmationModal';
import Toast from './Toast';

const CustomerListItem = memo(({ customer, onClick, index, isAdmin }: { customer: Customer, onClick: (c: Customer) => void, index: number, isAdmin: boolean }) => {
  const daysSinceVisit = customer.lastVisit ? Math.floor((new Date().getTime() - new Date(customer.lastVisit).getTime()) / (1000 * 60 * 60 * 24)) : null;

  return (
  <div
    onClick={() => onClick(customer)}
    className="bg-white border border-bg-light rounded-[2rem] p-4 flex justify-between items-center shadow-sm active:scale-[0.98] transition-all cursor-pointer group hover:border-teal-primary/20 will-change-transform"
  >
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-2xl bg-teal-primary/10 flex items-center justify-center font-black text-teal-primary text-lg border-2 border-white shadow-sm group-hover:scale-110 transition-transform relative">
        {customer.name.charAt(0)}
        {/* Activity Dot based on last visit */}
        {daysSinceVisit !== null && (
          <div className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
            daysSinceVisit <= 7 ? 'bg-green-500' : 
            daysSinceVisit > 30 ? 'bg-danger-red' : 'bg-yellow-500'
          }`} title={daysSinceVisit === 0 ? 'Visited today' : `Visited ${daysSinceVisit} days ago`} />
        )}
      </div>
      <div className="min-w-0">
        <h3 className="text-sm font-black text-dark-text truncate max-w-[150px]">{customer.name}</h3>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-[10px] text-gray-text font-black uppercase tracking-widest">
            {isAdmin ? customer.phone : `${customer.phone.substring(0, 3)}****${customer.phone.substring(customer.phone.length - 2)}`}
          </p>
          {daysSinceVisit !== null && (
            <span className="text-[8px] text-gray-text/60 font-bold">
              • {daysSinceVisit === 0 ? 'Today' : `${daysSinceVisit}d ago`}
            </span>
          )}
        </div>
      </div>
    </div>
    <div className="flex items-center gap-4">
      <div className="text-right flex flex-col items-end gap-1">
        <p className="text-lg font-black text-teal-primary leading-none">{customer.points.toLocaleString()}</p>
        <div className={`flex items-center gap-1 text-[8px] font-black px-2 py-0.5 rounded-full border ${
          customer.tier === 'PLATINUM' ? 'bg-teal-primary/10 border-teal-primary text-teal-primary' :
          customer.tier === 'GOLD' ? 'bg-yellow-50 border-yellow-500 text-yellow-600' :
          customer.tier === 'SILVER' ? 'bg-slate-50 border-slate-400 text-slate-500' :
          'bg-orange-50 border-orange-600 text-orange-600'
        }`}>
          {customer.tier === 'PLATINUM' && <Crown className="w-2.5 h-2.5" />}
          {customer.tier === 'GOLD' && <Sparkles className="w-2.5 h-2.5" />}
          {customer.tier === 'SILVER' && <Shield className="w-2.5 h-2.5" />}
          {customer.tier === 'BRONZE' && <UserCheck className="w-2.5 h-2.5" />}
          <span>{customer.tier}</span>
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-text opacity-30 group-hover:opacity-100 transition-opacity" />
    </div>
  </div>
)});

CustomerListItem.displayName = 'CustomerListItem';

interface CustomersProps {
  user: Staff | null;
  customers: Customer[];
  initialSelectedId?: string | null;
  onClearInitialId?: () => void;
}

type SortOption = 'name' | 'points' | 'lastVisit';

function Customers({ user, customers, initialSelectedId, onClearInitialId }: CustomersProps) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('lastVisit');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    if (initialSelectedId) {
      const customer = customers.find(c => c.customerId === initialSelectedId);
      if (customer) {
        setSelectedCustomer(customer);
        if (onClearInitialId) onClearInitialId();
      }
    }
  }, [initialSelectedId, customers, onClearInitialId]);

  const handleCustomerClick = useCallback((customer: Customer) => {
    setSelectedCustomer(customer);
  }, []);

  const filteredCustomers = useMemo(() => {
    const s = search.toLowerCase();
    let result = customers.filter(m => 
      m.name.toLowerCase().includes(s) ||
      m.phone.includes(s) ||
      m.customerId.toLowerCase().includes(s)
    );

    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'points') {
        comparison = a.points - b.points;
      } else if (sortBy === 'lastVisit') {
        const dateA = a.lastVisit ? new Date(a.lastVisit).getTime() : 0;
        const dateB = b.lastVisit ? new Date(b.lastVisit).getTime() : 0;
        comparison = dateA - dateB;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [customers, search, sortBy, sortOrder]);

  return (
    <div className="space-y-6 pb-24 bg-white">
      {/* Header */}
      <header className="flex justify-between items-center bg-white py-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-primary/10 flex items-center justify-center border border-teal-primary/10">
            <Users className="w-6 h-6 text-teal-primary" />
          </div>
          <h1 className="text-xl font-black text-dark-text tracking-tight">কাস্টমার লিস্ট</h1>
        </div>
      </header>

      {/* Search & Sort Bar */}
      <div className="flex flex-col gap-3">
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
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center bg-bg-light rounded-2xl p-1 border border-bg-light">
            <button
              onClick={() => setSortBy('name')}
              className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all ${sortBy === 'name' ? 'bg-white text-teal-primary shadow-sm' : 'text-gray-text'}`}
            >
              নাম
            </button>
            <button
              onClick={() => setSortBy('points')}
              className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all ${sortBy === 'points' ? 'bg-white text-teal-primary shadow-sm' : 'text-gray-text'}`}
            >
              পয়েন্ট
            </button>
            <button
              onClick={() => setSortBy('lastVisit')}
              className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all ${sortBy === 'lastVisit' ? 'bg-white text-teal-primary shadow-sm' : 'text-gray-text'}`}
            >
              ভিজিট
            </button>
          </div>
          <button
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            className="w-10 h-10 bg-bg-light rounded-2xl flex items-center justify-center text-gray-text hover:text-teal-primary transition-colors border border-bg-light"
          >
            {sortOrder === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Customer List */}
      <div className="space-y-3">
        {filteredCustomers.map((customer, idx) => (
          <CustomerListItem 
            key={customer.id} 
            customer={customer} 
            index={idx} 
            onClick={handleCustomerClick} 
            isAdmin={user?.role === 'Admin' || user?.role === 'Master Admin'}
          />
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
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
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
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'transactions');
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
      const path = 'customers';
      await updateDoc(doc(db, path, customer.id), {
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
      handleFirestoreError(err, OperationType.WRITE, 'customers/transactions');
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
      const path = 'customers';
      await updateDoc(doc(db, path, customer.id), {
        name: editData.name,
        phone: editData.phone,
        address: editData.address
      });
      
      setToastMsg('কাস্টমার তথ্য আপডেট হয়েছে ✅');
      setToastType('success');
      setShowToast(true);
      setIsEditMode(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `customers/${customer.id}`);
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
      const path = 'customers';
      await deleteDoc(doc(db, path, customer.id));
      onClose();
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `customers/${customer.id}`);
      setToastMsg('ডিলিট করতে সমস্যা হয়েছে।');
      setToastType('error');
      setShowToast(true);
    }
  };

  const handleDownloadCard = async () => {
    if (user?.role !== 'Admin' && user?.role !== 'Master Admin') return;
    setIsDownloading(true);
    try {
      const cardElement = document.getElementById('member-card');
      if (!cardElement) {
        setToastMsg('কার্ড পাওয়া যাচ্ছে না!');
        setToastType('error');
        setShowToast(true);
        setIsDownloading(false);
        return;
      }
      
      // Use a small delay to ensure rendering is complete
      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(cardElement, {
        scale: 3, // Increased scale for better quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#000000', // Explicitly set to black to avoid oklch issues
        logging: false
      });
      
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      setPreviewImage(dataUrl);
      setShowPreview(true);
      setIsDownloading(false);
      
    } catch (error: any) {
      console.error("Download error:", error);
      setToastMsg('ত্রুটি: ' + error.message);
      setToastType('error');
      setShowToast(true);
      setIsDownloading(false);
    }
  };

  const handleSharePreview = async () => {
    if (!previewImage) return;
    try {
      const response = await fetch(previewImage);
      const blob = await response.blob();
      const file = new File([blob], `SKY-${customer.customerId}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Sky Loyalty Card',
          text: `Customer: ${customer.name} (${customer.customerId})`
        });
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `SKY-${customer.customerId}.png`;
        document.body.appendChild(link);
        link.click();
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

return (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} 
      animate={{ opacity: 1, scale: 1 }} 
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
    >
      <div className="p-6 pb-2 flex justify-between items-center bg-white border-b border-bg-light">
        <h2 className="text-lg font-black text-dark-text tracking-tight">কাস্টমার প্রোফাইল</h2>
        <button onClick={onClose} className="p-2 bg-bg-light rounded-full text-gray-text hover:text-dark-text transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 scrollbar-hide space-y-8">
        {/* Member Card - Enhanced */}
        <div id="member-card" className="rounded-[2rem] p-6 relative overflow-hidden shadow-2xl" style={{ background: 'linear-gradient(135deg, #111827, #000000)', color: '#ffffff' }}>
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" style={{ backgroundColor: 'rgba(234, 179, 8, 0.2)' }}></div>
          
          <div className="relative z-10 flex flex-col justify-between h-full min-h-[160px]">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-black tracking-tight">{customer.name}</h3>
                <p className="text-xs font-bold tracking-widest uppercase mt-1" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>{customer.customerId}</p>
              </div>
              <div className={`flex items-center gap-1.5 text-[10px] font-black px-3 py-1 rounded-full border ${
                customer.tier === 'PLATINUM' ? '' :
                customer.tier === 'GOLD' ? '' :
                customer.tier === 'SILVER' ? '' :
                ''
              }`} style={
                customer.tier === 'PLATINUM' ? { backgroundColor: 'rgba(234, 179, 8, 0.2)', borderColor: 'rgba(234, 179, 8, 0.5)', color: '#EAB308' } :
                customer.tier === 'GOLD' ? { backgroundColor: 'rgba(234, 179, 8, 0.2)', borderColor: 'rgba(234, 179, 8, 0.5)', color: '#facc15' } :
                customer.tier === 'SILVER' ? { backgroundColor: 'rgba(148, 163, 184, 0.2)', borderColor: 'rgba(148, 163, 184, 0.5)', color: '#cbd5e1' } :
                { backgroundColor: 'rgba(249, 115, 22, 0.2)', borderColor: 'rgba(249, 115, 22, 0.5)', color: '#fb923c' }
              }>
                {customer.tier}
              </div>
            </div>
            
            <div className="flex justify-between items-end mt-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>মোট পয়েন্ট</p>
                <p className="text-4xl font-black tracking-tighter" style={{ color: '#EAB308' }}>{customer.points.toLocaleString()}</p>
              </div>
              <div className="bg-white p-1 rounded-lg">
                <QRCodeSVG value={customer.customerId} size={60} />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <motion.button 
            whileTap={{ scale: 0.98 }}
            onClick={handleDownloadCard}
            disabled={isDownloading}
            className="h-12 bg-gray-100 text-dark-text rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all hover:bg-gray-200"
          >
            {isDownloading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            কার্ড
          </motion.button>
          <motion.button 
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              let phone = customer.phone.replace(/\D/g, '');
              if (phone.startsWith('0')) phone = '88' + phone;
              else if (!phone.startsWith('88')) phone = '88' + phone;
              window.open(`https://wa.me/${phone}`, '_blank');
            }}
            className="h-12 bg-[#25D366] text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all hover:bg-[#128C7E]"
          >
            <MessageSquare className="w-4 h-4" /> হোয়াটসঅ্যাপ
          </motion.button>
        </div>

        {/* Admin Actions */}
        {(user?.role === 'Admin' || user?.role === 'Master Admin') && (
          <div className="grid grid-cols-2 gap-3">
            <motion.button 
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsEditMode(true)}
              className="h-12 bg-blue-50 text-blue-600 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all hover:bg-blue-100"
            >
              <Edit2 className="w-4 h-4" /> এডিট
            </motion.button>
            <motion.button 
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsDeleteModalOpen(true)}
              className="h-12 bg-red-50 text-red-600 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all hover:bg-red-100"
            >
              <Trash2 className="w-4 h-4" /> ডিলিট
            </motion.button>
          </div>
        )}

        {/* Info Section - Clean Grid */}
        <section className="bg-white border border-gray-100 rounded-[2rem] p-6 space-y-4 shadow-sm">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ব্যক্তিগত তথ্য</h3>
          {isEditMode ? (
            <div className="space-y-3">
              <input 
                type="text" 
                value={editData.name} 
                onChange={(e) => setEditData({...editData, name: e.target.value})}
                className="w-full bg-gray-50 p-4 rounded-2xl text-sm font-bold text-dark-text"
                placeholder="নাম"
              />
              <input 
                type="text" 
                value={editData.phone} 
                onChange={(e) => setEditData({...editData, phone: e.target.value})}
                className="w-full bg-gray-50 p-4 rounded-2xl text-sm font-bold text-dark-text"
                placeholder="ফোন"
              />
              <input 
                type="text" 
                value={editData.address} 
                onChange={(e) => setEditData({...editData, address: e.target.value})}
                className="w-full bg-gray-50 p-4 rounded-2xl text-sm font-bold text-dark-text"
                placeholder="ঠিকানা"
              />
              <div className="flex gap-2">
                <button onClick={handleUpdateCustomer} className="flex-1 h-12 bg-teal-primary text-white rounded-2xl font-black text-xs">সেভ করুন</button>
                <button onClick={() => setIsEditMode(false)} className="flex-1 h-12 bg-gray-100 text-gray-600 rounded-2xl font-black text-xs">বাতিল</button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              <div className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl">
                <p className="text-[10px] text-gray-500 font-bold uppercase">ফোন</p>
                <p className="text-sm text-dark-text font-black">
                  {user?.role === 'Admin' || user?.role === 'Master Admin' ? customer.phone : `${customer.phone.substring(0, 3)}****${customer.phone.substring(customer.phone.length - 2)}`}
                </p>
              </div>
              <div className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl">
                <p className="text-[10px] text-gray-500 font-bold uppercase">রেফারেল কোড</p>
                <p className="text-sm text-dark-text font-black">{customer.referralCode || 'N/A'}</p>
              </div>
              <div className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl">
                <p className="text-[10px] text-gray-500 font-bold uppercase">রেফারেল আইডি</p>
                <p className="text-sm text-dark-text font-black">{customer.referralId || 'N/A'}</p>
              </div>
            </div>
          )}
        </section>

        {/* Points Management */}
        <section className="bg-white border border-bg-light rounded-[2.5rem] p-6 space-y-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black text-gray-text uppercase tracking-widest">পয়েন্ট ম্যানেজমেন্ট</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex p-1 bg-bg-light rounded-2xl">
              <button
                onClick={() => setAddMode('AMOUNT')}
                className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all ${addMode === 'AMOUNT' ? 'bg-white text-teal-primary shadow-sm' : 'text-gray-text'}`}
              >
                টাকার পরিমাণ
              </button>
              <button
                onClick={() => setAddMode('DIRECT')}
                className={`flex-1 py-2 text-[10px] font-black rounded-xl transition-all ${addMode === 'DIRECT' ? 'bg-white text-teal-primary shadow-sm' : 'text-gray-text'}`}
              >
                সরাসরি পয়েন্ট
              </button>
            </div>

            {addMode === 'AMOUNT' ? (
              <div className="space-y-3">
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-text font-black group-focus-within:text-teal-primary transition-colors">৳</span>
                  <input 
                    type="number" 
                    placeholder="কেনার পরিমাণ (টাকা)"
                    value={purchaseAmount}
                    onChange={(e) => setPurchaseAmount(e.target.value)}
                    className="w-full bg-bg-light rounded-2xl p-4 pl-10 text-dark-text text-sm font-bold focus:outline-none focus:ring-2 focus:ring-teal-primary/20 transition-all border-2 border-transparent focus:border-teal-primary/10"
                  />
                </div>
                {purchaseAmount && (
                  <p className="text-[10px] text-teal-primary font-black text-center bg-teal-primary/5 py-2 rounded-xl">
                    পাবেন: {calculatedPoints} পয়েন্ট
                  </p>
                )}
                <motion.button 
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handlePoints('ADD', calculatedPoints)}
                  disabled={!purchaseAmount || calculatedPoints <= 0 || loading}
                  className="w-full h-14 teal-gradient text-white text-xs font-black rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-teal-primary/20"
                >
                  {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Plus className="w-4 h-4" />}
                  পয়েন্ট যোগ করুন
                </motion.button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative group">
                  <Zap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-text group-focus-within:text-teal-primary transition-colors" />
                  <input 
                    type="number" 
                    placeholder="যোগ করার পয়েন্ট সংখ্যা"
                    value={pointsInput}
                    onChange={(e) => setPointsInput(e.target.value)}
                    className="w-full bg-bg-light rounded-2xl p-4 pl-12 text-dark-text text-sm font-bold focus:outline-none focus:ring-2 focus:ring-teal-primary/20 transition-all border-2 border-transparent focus:border-teal-primary/10"
                  />
                </div>
                <motion.button 
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handlePoints('ADD')}
                  disabled={!pointsInput || loading}
                  className="w-full h-14 teal-gradient text-white text-xs font-black rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-teal-primary/20"
                >
                  {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Plus className="w-4 h-4" />}
                  পয়েন্ট যোগ করুন
                </motion.button>
              </div>
            )}
          </div>

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
        </section>

        {/* Transaction History */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-dark-text ml-1">
            <History className="w-4 h-4 text-teal-primary" />
            <h3 className="text-[10px] font-black uppercase tracking-widest">লেনদেনের ইতিহাস</h3>
          </div>
          <div className="space-y-3">
            {history.map((tx, idx) => (
              <div 
                key={tx.id} 
                className="bg-white border border-bg-light rounded-2xl p-4 flex flex-col gap-3 shadow-sm"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === 'ADD' ? 'bg-teal-primary/10 text-teal-primary' : 'bg-orange-50 text-orange-500'}`}>
                      {tx.type === 'ADD' ? <Plus className="w-5 h-5" /> : <ShoppingBag className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-dark-text">{tx.type === 'ADD' ? 'পয়েন্ট যোগ' : 'পয়েন্ট রিডিম'}</p>
                      <p className="text-[9px] text-gray-text font-black uppercase">{new Date(tx.timestamp).toLocaleString('bn-BD')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-black ${tx.type === 'ADD' ? 'text-teal-primary' : 'text-orange-500'}`}>
                      {tx.type === 'ADD' ? '+' : '-'}{tx.amount}
                    </p>
                    <p className="text-[9px] text-gray-text font-bold mt-0.5">ব্যালেন্স: {tx.pointsAfter}</p>
                  </div>
                </div>
                
                {(tx.description || tx.staffId) && (
                  <div className="bg-bg-light rounded-xl p-3 flex flex-col gap-1.5">
                    {tx.description && (
                      <p className="text-[10px] text-dark-text font-bold">📝 {tx.description}</p>
                    )}
                    {tx.staffId && (
                      <p className="text-[9px] text-gray-text font-black uppercase tracking-widest">
                        👤 স্টাফ আইডি: {tx.staffId === 'system' ? 'System' : tx.staffId}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
            {history.length === 0 && (
              <div className="bg-bg-light rounded-[2rem] p-10 text-center">
                <p className="text-[10px] font-black text-gray-text uppercase tracking-widest">কোনো লেনদেন পাওয়া যায়নি</p>
              </div>
            )}
          </div>
        </section>
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

      {/* Mobile Preview Modal */}
      <AnimatePresence>
        {showPreview && previewImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-6"
          >
            <div className="w-full max-w-sm space-y-6">
              <div className="flex justify-between items-center text-white">
                <h3 className="font-black text-lg">কার্ড প্রিভিউ</h3>
                <button onClick={() => setShowPreview(false)} className="p-2 bg-white/10 rounded-full">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="bg-white p-2 rounded-3xl shadow-2xl overflow-hidden">
                <img 
                  src={previewImage} 
                  alt="Preview" 
                  className="w-full h-auto rounded-2xl block" 
                  style={{ pointerEvents: 'auto' }}
                />
              </div>

              <div className="space-y-3">
                <button 
                  onClick={handleSharePreview}
                  className="w-full py-4 teal-gradient text-white rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"
                >
                  <Share2 className="w-5 h-5" /> গ্যালারিতে সেভ / শেয়ার করুন
                </button>
                <button 
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = previewImage;
                    link.download = `SKY-${customer.customerId}.png`;
                    link.click();
                  }}
                  className="w-full py-4 bg-white/10 text-white rounded-2xl font-black flex items-center justify-center gap-2 border border-white/20 active:scale-95 transition-transform"
                >
                  <Download className="w-5 h-5" /> সরাসরি ডাউনলোড
                </button>
                <p className="text-white/50 text-[10px] text-center font-bold uppercase tracking-widest leading-relaxed">
                  টিপস: উপরের ছবির ওপর চেপে ধরেও "Save Image" দিতে পারেন। <br/>
                  অথবা শেয়ার বাটনে ক্লিক করে "Save to Device" সিলেক্ট করুন।
                </p>
              </div>
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

export default memo(Customers);
