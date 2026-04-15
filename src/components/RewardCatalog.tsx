import React, { useState, useEffect } from 'react';
import { Reward, Staff, Customer } from '../types';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, onSnapshot, addDoc, updateDoc, doc, deleteDoc, query, where } from 'firebase/firestore';
import { Gift, Plus, Edit2, Trash2, X, Check, ShoppingBag, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RewardCatalogProps {
  currentUser: Staff | null;
  onBack: () => void;
}

export default function RewardCatalog({ currentUser, onBack }: RewardCatalogProps) {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    pointsRequired: 0,
    category: 'General',
    status: 'active' as 'active' | 'inactive'
  });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'rewards'), (snap) => {
      setRewards(snap.docs.map(d => ({ id: d.id, ...d.data() } as Reward)));
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'rewards');
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingReward) {
        await updateDoc(doc(db, 'rewards', editingReward.id), formData);
      } else {
        await addDoc(collection(db, 'rewards'), formData);
      }
      setShowAddModal(false);
      setEditingReward(null);
      setFormData({ name: '', description: '', pointsRequired: 0, category: 'General', status: 'active' });
    } catch (err) {
      handleFirestoreError(err, editingReward ? OperationType.UPDATE : OperationType.CREATE, 'rewards');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('আপনি কি এই পুরস্কারটি মুছে ফেলতে চান?')) return;
    try {
      await deleteDoc(doc(db, 'rewards', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'rewards');
    }
  };

  return (
    <div className="space-y-6 pb-24">
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 bg-white rounded-xl shadow-sm">
            <X className="w-5 h-5 text-gray-text" />
          </button>
          <h1 className="text-xl font-black text-dark-text tracking-tight">রিওয়ার্ড ক্যাটালগ</h1>
        </div>
        {(currentUser?.role === 'Admin' || currentUser?.role === 'Master Admin') && (
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
          {rewards.map((reward) => (
            <div 
              key={reward.id}
              className="bg-white p-5 rounded-[2rem] shadow-sm border border-bg-light flex items-center gap-4 relative overflow-hidden group"
            >
              <div className="w-16 h-16 rounded-2xl bg-teal-primary/10 flex items-center justify-center text-teal-primary">
                <Gift className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <h3 className="font-black text-dark-text tracking-tight">{reward.name}</h3>
                <p className="text-[10px] text-gray-text font-bold uppercase tracking-widest mt-1">{reward.category}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Sparkles className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm font-black text-teal-primary">{reward.pointsRequired} পয়েন্ট</span>
                </div>
              </div>
              
              {(currentUser?.role === 'Admin' || currentUser?.role === 'Master Admin') && (
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => {
                      setEditingReward(reward);
                      setFormData({
                        name: reward.name,
                        description: reward.description,
                        pointsRequired: reward.pointsRequired,
                        category: reward.category,
                        status: reward.status
                      });
                      setShowAddModal(true);
                    }}
                    className="p-2 bg-bg-light rounded-lg text-gray-text hover:text-teal-primary transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(reward.id)}
                    className="p-2 bg-bg-light rounded-lg text-gray-text hover:text-danger-red transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
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
                  {editingReward ? 'পুরস্কার এডিট করুন' : 'নতুন পুরস্কার যোগ করুন'}
                </h2>
                <button onClick={() => setShowAddModal(false)} className="p-2 bg-bg-light rounded-full">
                  <X className="w-5 h-5 text-gray-text" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-text uppercase tracking-widest ml-1">পুরস্কারের নাম</label>
                  <input 
                    required
                    type="text" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full h-14 bg-bg-light rounded-2xl px-6 font-bold text-dark-text focus:outline-none focus:ring-2 focus:ring-teal-primary/20"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-text uppercase tracking-widest ml-1">প্রয়োজনীয় পয়েন্ট</label>
                    <input 
                      required
                      type="number" 
                      value={formData.pointsRequired}
                      onChange={e => setFormData({...formData, pointsRequired: parseInt(e.target.value)})}
                      className="w-full h-14 bg-bg-light rounded-2xl px-6 font-bold text-dark-text focus:outline-none focus:ring-2 focus:ring-teal-primary/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-text uppercase tracking-widest ml-1">ক্যাটাগরি</label>
                    <select 
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                      className="w-full h-14 bg-bg-light rounded-2xl px-6 font-bold text-dark-text focus:outline-none focus:ring-2 focus:ring-teal-primary/20"
                    >
                      <option value="General">General</option>
                      <option value="Food">Food</option>
                      <option value="Shopping">Shopping</option>
                      <option value="Service">Service</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-text uppercase tracking-widest ml-1">বিবরণ</label>
                  <textarea 
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full h-24 bg-bg-light rounded-2xl p-6 font-bold text-dark-text focus:outline-none focus:ring-2 focus:ring-teal-primary/20 resize-none"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full h-14 teal-gradient text-white font-black rounded-2xl shadow-xl shadow-teal-primary/20 uppercase tracking-widest"
                >
                  {editingReward ? 'আপডেট করুন' : 'সেভ করুন'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
