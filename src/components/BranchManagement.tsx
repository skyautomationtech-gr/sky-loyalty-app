import React, { useState, useEffect } from 'react';
import { Branch, Staff } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { MapPin, Plus, Edit2, Trash2, X, Phone, User, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BranchManagementProps {
  currentUser: Staff | null;
  onBack: () => void;
}

export default function BranchManagement({ currentUser, onBack }: BranchManagementProps) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    phone: '',
    managerId: '',
    status: 'active' as 'active' | 'inactive'
  });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'branches'), (snap) => {
      setBranches(snap.docs.map(d => ({ id: d.id, ...d.data() } as Branch)));
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'branches');
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBranch) {
        await updateDoc(doc(db, 'branches', editingBranch.id), {
          ...formData,
          updatedAt: new Date().toISOString()
        });
      } else {
        await addDoc(collection(db, 'branches'), {
          ...formData,
          createdAt: new Date().toISOString()
        });
      }
      setShowAddModal(false);
      setEditingBranch(null);
      setFormData({ name: '', location: '', phone: '', managerId: '', status: 'active' });
    } catch (err) {
      handleFirestoreError(err, editingBranch ? OperationType.UPDATE : OperationType.CREATE, 'branches');
    }
  };

  return (
    <div className="space-y-6 pb-24">
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 bg-white rounded-xl shadow-sm">
            <X className="w-5 h-5 text-gray-text" />
          </button>
          <h1 className="text-xl font-black text-dark-text tracking-tight">ব্রাঞ্চ ম্যানেজমেন্ট</h1>
        </div>
        {currentUser?.role === 'Master Admin' && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="w-10 h-10 teal-gradient rounded-xl flex items-center justify-center text-white shadow-lg"
          >
            <Plus className="w-6 h-6" />
          </button>
        )}
      </header>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-teal-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {branches.map((branch) => (
            <motion.div 
              layout
              key={branch.id}
              className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-bg-light space-y-4"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-teal-primary/10 flex items-center justify-center text-teal-primary">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-dark-text tracking-tight text-lg">{branch.name}</h3>
                    <div className="flex items-center gap-1 text-gray-text">
                      <MapPin className="w-3 h-3" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">{branch.location}</span>
                    </div>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                  branch.status === 'active' ? 'bg-teal-primary/10 text-teal-primary' : 'bg-danger-red/10 text-danger-red'
                }`}>
                  {branch.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="flex items-center gap-2 text-gray-text">
                  <Phone className="w-4 h-4" />
                  <span className="text-xs font-bold">{branch.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-text">
                  <User className="w-4 h-4" />
                  <span className="text-xs font-bold">Manager ID: {branch.managerId || 'N/A'}</span>
                </div>
              </div>

              {currentUser?.role === 'Master Admin' && (
                <div className="flex gap-2 pt-2">
                  <button 
                    onClick={() => {
                      setEditingBranch(branch);
                      setFormData({
                        name: branch.name,
                        location: branch.location,
                        phone: branch.phone,
                        managerId: branch.managerId,
                        status: branch.status
                      });
                      setShowAddModal(true);
                    }}
                    className="flex-1 h-10 bg-bg-light rounded-xl text-gray-text font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    <Edit2 className="w-3 h-3" /> এডিট
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center bg-dark-text/60 backdrop-blur-sm">
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="w-full max-w-[430px] bg-white rounded-t-[3rem] p-8 shadow-2xl space-y-6"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-black text-dark-text tracking-tight">
                  {editingBranch ? 'ব্রাঞ্চ এডিট করুন' : 'নতুন ব্রাঞ্চ যোগ করুন'}
                </h2>
                <button onClick={() => setShowAddModal(false)} className="p-2 bg-bg-light rounded-full">
                  <X className="w-5 h-5 text-gray-text" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-text uppercase tracking-widest ml-1">ব্রাঞ্চের নাম</label>
                  <input 
                    required
                    type="text" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full h-14 bg-bg-light rounded-2xl px-6 font-bold text-dark-text focus:outline-none focus:ring-2 focus:ring-teal-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-text uppercase tracking-widest ml-1">লোকেশন</label>
                  <input 
                    required
                    type="text" 
                    value={formData.location}
                    onChange={e => setFormData({...formData, location: e.target.value})}
                    className="w-full h-14 bg-bg-light rounded-2xl px-6 font-bold text-dark-text focus:outline-none focus:ring-2 focus:ring-teal-primary/20"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-text uppercase tracking-widest ml-1">ফোন নম্বর</label>
                    <input 
                      required
                      type="text" 
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      className="w-full h-14 bg-bg-light rounded-2xl px-6 font-bold text-dark-text focus:outline-none focus:ring-2 focus:ring-teal-primary/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-text uppercase tracking-widest ml-1">ম্যানেজার আইডি</label>
                    <input 
                      type="text" 
                      value={formData.managerId}
                      onChange={e => setFormData({...formData, managerId: e.target.value})}
                      className="w-full h-14 bg-bg-light rounded-2xl px-6 font-bold text-dark-text focus:outline-none focus:ring-2 focus:ring-teal-primary/20"
                    />
                  </div>
                </div>
                <button 
                  type="submit"
                  className="w-full h-14 teal-gradient text-white font-black rounded-2xl shadow-xl shadow-teal-primary/20 uppercase tracking-widest"
                >
                  {editingBranch ? 'আপডেট করুন' : 'সেভ করুন'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
