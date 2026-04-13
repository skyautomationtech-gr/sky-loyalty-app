import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, onSnapshot, query, addDoc, updateDoc, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { Staff, Role } from '../types';
import { APP_LOGO, APP_NAME } from '../constants';
import { 
  Users, 
  Plus, 
  Edit2, 
  Trash2, 
  ArrowLeft, 
  Shield, 
  Mail, 
  Eye, 
  EyeOff,
  XCircle,
  UserCheck,
  UserX,
  ShieldCheck,
  RefreshCw,
  X,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ConfirmationModal from './ConfirmationModal';
import Toast from './Toast';

interface StaffManagementProps {
  onBack: () => void;
  currentUser: Staff | null;
}

const MASTER_ADMIN_EMAIL = 'skyautomationtech@gmail.com';

export default function StaffManagement({ onBack, currentUser }: StaffManagementProps) {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [search, setSearch] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Staff' as Role,
    status: 'active' as 'active' | 'inactive'
  });

  useEffect(() => {
    const q = query(collection(db, 'staff'), orderBy('addedDate', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const staffData = snap.docs.map(d => ({ id: d.id, ...d.data() } as Staff));
      setStaff(staffData);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'staff');
    });
    return unsub;
  }, []);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('নাম খালি রাখা যাবে না');
      return;
    }
    if (!formData.email.includes('@')) {
      setError('সঠিক ইমেইল দিন');
      return;
    }
    if (formData.password.length < 6) {
      setError('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে');
      return;
    }

    setLoading(true);
    try {
      const path = 'staff';
      await addDoc(collection(db, path), {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        addedBy: currentUser?.name || 'Master Admin',
        addedDate: new Date().toISOString(),
        status: 'active'
      });
      
      setIsAddModalOpen(false);
      setFormData({ name: '', email: '', password: '', role: 'Staff', status: 'active' });
      setToastMsg('স্টাফ সফলভাবে যোগ হয়েছে! ✅');
      setToastType('success');
      setShowToast(true);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, 'staff');
      setError(err.message || 'স্টাফ যোগ করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff || selectedStaff.id === 'master') return;
    setLoading(true);
    try {
      const path = 'staff';
      await updateDoc(doc(db, path, selectedStaff.id), {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        status: formData.status
      });
      setIsEditModalOpen(false);
      setSelectedStaff(null);
      setToastMsg('স্টাফ তথ্য আপডেট করা হয়েছে ✅');
      setToastType('success');
      setShowToast(true);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `staff/${selectedStaff.id}`);
      setToastMsg('আপডেট করতে সমস্যা হয়েছে');
      setToastType('error');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStaff = async () => {
    if (!selectedStaff || selectedStaff.id === 'master') return;
    try {
      const path = 'staff';
      await deleteDoc(doc(db, path, selectedStaff.id));
      setIsDeleteModalOpen(false);
      setSelectedStaff(null);
      setToastMsg('স্টাফ ডিলিট করা হয়েছে');
      setToastType('success');
      setShowToast(true);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `staff/${selectedStaff.id}`);
      setToastMsg('ডিলিট করতে সমস্যা হয়েছে');
      setToastType('error');
      setShowToast(true);
    }
  };

  const toggleStatus = async (s: Staff) => {
    if (s.email === MASTER_ADMIN_EMAIL || s.id === 'master') return;
    try {
      await updateDoc(doc(db, 'staff', s.id), {
        status: s.status === 'active' ? 'inactive' : 'active'
      });
    } catch (err) {
      console.error('Error toggling status:', err);
    }
  };

  const openEdit = (s: Staff) => {
    if (s.email === MASTER_ADMIN_EMAIL || s.id === 'master') return;
    setSelectedStaff(s);
    setFormData({
      name: s.name,
      email: s.email,
      password: s.password || '',
      role: s.role,
      status: s.status
    });
    setIsEditModalOpen(true);
  };

  const openDelete = (s: Staff) => {
    if (s.email === MASTER_ADMIN_EMAIL || s.id === 'master') return;
    setSelectedStaff(s);
    setIsDeleteModalOpen(true);
  };

  const masterAdmin: Staff = {
    id: 'master',
    name: 'Master Admin',
    email: MASTER_ADMIN_EMAIL,
    role: 'Master Admin',
    pin: '0000',
    addedBy: 'System',
    addedDate: new Date(0).toISOString(),
    status: 'active'
  };

  const filteredStaff = staff.filter(s => 
    s.email !== MASTER_ADMIN_EMAIL && 
    (s.name.toLowerCase().includes(search.toLowerCase()) || 
     s.email.toLowerCase().includes(search.toLowerCase()))
  );
  const displayStaff = search ? filteredStaff : [masterAdmin, ...filteredStaff];

  const isPrivileged = currentUser?.role === 'Admin' || 
                      currentUser?.role === 'Master Admin' || 
                      currentUser?.email === MASTER_ADMIN_EMAIL;

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <header className="flex items-center gap-3 bg-white py-2">
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={onBack} 
          className="p-2 -ml-2 text-gray-text hover:text-teal-primary transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </motion.button>
        <div className="w-10 h-10 rounded-xl bg-teal-primary/10 flex items-center justify-center overflow-hidden border border-teal-primary/10 shadow-sm">
          <img 
            src={APP_LOGO} 
            alt={APP_NAME} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div>
          <h1 className="text-xl font-black text-dark-text tracking-tight">স্টাফ ম্যানেজমেন্ট</h1>
          <p className="text-[10px] font-black text-gray-text uppercase tracking-widest">মোট স্টাফ: {displayStaff.length} জন</p>
        </div>
      </header>

      {/* Search Bar */}
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-text group-focus-within:text-teal-primary transition-colors" />
        <input
          type="text"
          placeholder="নাম বা ইমেইল দিয়ে খুঁজুন..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white rounded-2xl py-4 pl-12 pr-4 text-dark-text font-bold text-sm focus:outline-none focus:ring-2 focus:ring-teal-primary/20 transition-all border border-bg-light focus:border-teal-primary/10 shadow-sm"
        />
      </div>

      {/* Quick Actions */}
      {isPrivileged ? (
        <div className="grid grid-cols-2 gap-4">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => { setFormData({ name: '', email: '', password: '', role: 'Staff', status: 'active' }); setIsAddModalOpen(true); }}
            className="bg-white border-2 border-dashed border-teal-primary/30 rounded-[2.5rem] p-6 flex flex-col items-center justify-center gap-3 hover:border-teal-primary hover:bg-teal-primary/5 transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-teal-primary/10 flex items-center justify-center text-teal-primary group-hover:scale-110 transition-transform">
              <Plus className="w-6 h-6" />
            </div>
            <div className="text-center">
              <p className="text-sm font-black text-dark-text">Add Staff</p>
              <p className="text-[8px] font-black text-gray-text uppercase tracking-widest">Operator Access</p>
            </div>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => { setFormData({ name: '', email: '', password: '', role: 'Admin', status: 'active' }); setIsAddModalOpen(true); }}
            className="bg-white border-2 border-dashed border-purple-500/30 rounded-[2.5rem] p-6 flex flex-col items-center justify-center gap-3 hover:border-purple-500 hover:bg-purple-500/5 transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
              <Plus className="w-6 h-6" />
            </div>
            <div className="text-center">
              <p className="text-sm font-black text-dark-text">Add Admin</p>
              <p className="text-[8px] font-black text-gray-text uppercase tracking-widest">Master Access</p>
            </div>
          </motion.button>
        </div>
      ) : null}

      {/* Staff List */}
      <div className="space-y-4">
        {displayStaff.map((s, idx) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white border border-bg-light rounded-[2.5rem] p-6 shadow-sm relative overflow-hidden group hover:border-teal-primary/20 transition-all"
          >
            {s.role === 'Master Admin' && (
              <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/5 rounded-full -mr-16 -mt-16 blur-3xl" />
            )}
            
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl border-2 border-white shadow-sm ${
                  s.role === 'Master Admin' ? 'bg-yellow-400 text-white' :
                  s.role === 'Admin' ? 'bg-purple-500 text-white' : 'bg-bg-light text-dark-text'
                }`}>
                  {s.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-black text-dark-text tracking-tight truncate">{s.name}</h3>
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border shrink-0 ${
                      s.role === 'Master Admin' ? 'bg-yellow-50 border-yellow-400 text-yellow-600' :
                      s.role === 'Admin' ? 'bg-purple-50 border-purple-400 text-purple-600' :
                      'bg-teal-50 border-teal-primary text-teal-primary'
                    }`}>
                      {s.role.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-text font-black flex items-center gap-1.5 mt-1 uppercase tracking-widest truncate">
                    <Mail className="w-3 h-3 shrink-0" /> {s.email}
                  </p>
                </div>
              </div>
              
              {s.email !== MASTER_ADMIN_EMAIL && (
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <motion.button 
                    whileTap={{ scale: 0.9 }}
                    onClick={() => openEdit(s)}
                    className="p-2.5 text-gray-text hover:text-teal-primary bg-bg-light rounded-xl transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </motion.button>
                  <motion.button 
                    whileTap={{ scale: 0.9 }}
                    onClick={() => openDelete(s)}
                    className="p-2.5 text-gray-text hover:text-danger-red bg-bg-light rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-5 border-t border-bg-light gap-4">
              <div className="flex items-center gap-6 min-w-0">
                <div className="flex flex-col min-w-0">
                  <span className="text-[8px] font-black text-gray-text uppercase tracking-widest mb-0.5">Added By</span>
                  <span className="text-[10px] font-black text-dark-text truncate">{s.addedBy}</span>
                </div>
                <div className="flex flex-col shrink-0">
                  <span className="text-[8px] font-black text-gray-text uppercase tracking-widest mb-0.5">Date</span>
                  <span className="text-[10px] font-black text-dark-text">{new Date(s.addedDate).toLocaleDateString('bn-BD')}</span>
                </div>
              </div>

              {s.email !== MASTER_ADMIN_EMAIL && (
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${s.status === 'active' ? 'text-teal-primary' : 'text-danger-red'}`}>
                    {s.status === 'active' ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                  </span>
                  <button 
                    onClick={() => toggleStatus(s)}
                    className={`w-12 h-6 rounded-full relative transition-all duration-300 ${s.status === 'active' ? 'bg-teal-primary' : 'bg-gray-200'}`}
                  >
                    <motion.div 
                      animate={{ x: s.status === 'active' ? 24 : 4 }}
                      className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm" 
                    />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {(isAddModalOpen || isEditModalOpen) && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center bg-dark-text/40 backdrop-blur-sm p-4">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="w-full max-w-[430px] bg-white rounded-t-[3rem] p-10 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar relative"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />

              <div className="flex justify-between items-center mb-10 relative z-10">
                <h2 className="text-xl font-black text-dark-text tracking-tight">
                  {isEditModalOpen ? 'স্টাফ এডিট করুন' : `${formData.role} যোগ করুন`}
                </h2>
                <button onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} className="p-2 bg-bg-light rounded-full text-gray-text hover:text-dark-text transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={isEditModalOpen ? handleUpdateStaff : handleAddStaff} className="space-y-6 relative z-10">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-text uppercase tracking-widest ml-1">পূর্ণ নাম</label>
                  <div className="relative group">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-text group-focus-within:text-teal-primary transition-colors" />
                    <input 
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-bg-light rounded-2xl p-4 pl-12 text-dark-text font-bold text-sm focus:outline-none focus:ring-2 focus:ring-teal-primary/20 transition-all border-2 border-transparent focus:border-teal-primary/10" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-text uppercase tracking-widest ml-1">ইমেইল এড্রেস</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-text group-focus-within:text-teal-primary transition-colors" />
                    <input 
                      required
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-bg-light rounded-2xl p-4 pl-12 text-dark-text font-bold text-sm focus:outline-none focus:ring-2 focus:ring-teal-primary/20 transition-all border-2 border-transparent focus:border-teal-primary/10" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-text uppercase tracking-widest ml-1">পাসওয়ার্ড</label>
                  <div className="relative group">
                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-text group-focus-within:text-teal-primary transition-colors" />
                    <input 
                      required
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full bg-bg-light rounded-2xl p-4 pl-12 pr-12 text-dark-text font-bold text-sm focus:outline-none focus:ring-2 focus:ring-teal-primary/20 transition-all border-2 border-transparent focus:border-teal-primary/10" 
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-text hover:text-teal-primary transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-text uppercase tracking-widest ml-1">রোল (Role)</label>
                  <div className="relative group">
                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-text group-focus-within:text-teal-primary transition-colors pointer-events-none" />
                    <select 
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                      className="w-full bg-bg-light rounded-2xl p-4 pl-12 text-dark-text font-bold text-sm focus:outline-none focus:ring-2 focus:ring-teal-primary/20 transition-all border-2 border-transparent focus:border-teal-primary/10 appearance-none"
                    >
                      <option value="Staff">Staff (Operator)</option>
                      <option value="Admin">Admin (Full Access)</option>
                    </select>
                  </div>
                </div>

                {error && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[10px] font-black text-danger-red bg-danger-red/5 p-4 rounded-2xl border border-danger-red/10 uppercase tracking-widest"
                  >
                    {error}
                  </motion.p>
                )}

                <motion.button 
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 teal-gradient text-white font-black rounded-2xl shadow-xl shadow-teal-primary/20 uppercase tracking-widest mt-4 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                  <span>{isEditModalOpen ? 'আপডেট করুন' : 'যোগ করুন'}</span>
                </motion.button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteStaff}
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
