import React, { useState } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { sendToSheets } from '../services/sheetsService';
import { Download, Upload, FileText, X, Check, AlertCircle, RefreshCw, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Customer } from '../types';

interface BulkImportExportProps {
  onBack: () => void;
}

export default function BulkImportExport({ onBack }: BulkImportExportProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [importStatus, setImportStatus] = useState<{success: number, total: number} | null>(null);

  const handleClearData = async () => {
    if (!window.confirm('আপনি কি নিশ্চিত যে আপনি সব কাস্টমার এবং ট্রানজেকশন ডাটা ডিলিট করতে চান? এটি আর ফিরিয়ে আনা যাবে না।')) return;
    
    setIsClearing(true);
    try {
      const collections = ['customers', 'transactions', 'notifications', 'audit_logs'];
      console.log('Starting data deletion...');
      
      for (const colName of collections) {
        console.log(`Deleting collection: ${colName}`);
        const snap = await getDocs(collection(db, colName));
        console.log(`Found ${snap.docs.length} documents in ${colName}`);
        const batch = writeBatch(db);
        snap.docs.forEach((d) => {
          batch.delete(d.ref);
        });
        await batch.commit();
        console.log(`Successfully deleted ${colName}`);
      }
      
      alert('সব ডাটা সফলভাবে ডিলিট করা হয়েছে। অ্যাপটি রিলোড হচ্ছে...');
      window.location.reload(); // Force reload to clear state and refresh data
    } catch (err) {
      console.error('Clear data failed:', err);
      alert('ডাটা ডিলিট করতে সমস্যা হয়েছে। বিস্তারিত কনসোলে দেখুন।');
    } finally {
      setIsClearing(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const snap = await getDocs(collection(db, 'customers'));
      const customers = snap.docs.map(d => d.data() as Customer);
      
      const headers = ['customerId', 'name', 'phone', 'email', 'points', 'tier', 'joinedAt'];
      const csvContent = [
        headers.join(','),
        ...customers.map(c => [
          c.customerId,
          `"${c.name}"`,
          c.phone,
          c.email,
          c.points,
          c.tier,
          c.joinedAt
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `customers_export_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',');
      
      let successCount = 0;
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const values = lines[i].split(',');
        const customerData: any = {};
        headers.forEach((header, index) => {
          let val: any = values[index]?.replace(/"/g, '').trim();
          if (header === 'points') val = parseInt(val) || 0;
          customerData[header.trim()] = val;
        });

        try {
          const newC = {
            ...customerData,
            lastVisit: new Date().toISOString()
          };
          await addDoc(collection(db, 'customers'), newC);
          
          // Sync to Google Sheets
          sendToSheets('Customers', {
            id: newC.customerId,
            name: newC.name,
            phone: newC.phone,
            address: newC.address,
            referralCode: newC.referralCode,
            points: newC.points,
            tier: newC.tier,
            joinDate: newC.joinedAt
          });
          
          successCount++;
        } catch (err) {
          console.error('Import line failed:', err);
        }
      }
      setImportStatus({ success: successCount, total: lines.length - 1 });
      setIsImporting(false);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 pb-24">
      <header className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 bg-white rounded-xl shadow-sm">
          <X className="w-5 h-5 text-gray-text" />
        </button>
        <h1 className="text-xl font-black text-dark-text tracking-tight">ইমপোর্ট ও এক্সপোর্ট</h1>
      </header>

      <div className="grid grid-cols-1 gap-6">
        {/* Export Card */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-bg-light text-center space-y-6">
          <div className="w-20 h-20 bg-teal-primary/10 rounded-[2rem] flex items-center justify-center mx-auto text-teal-primary">
            <Download className="w-10 h-10" />
          </div>
          <div>
            <h3 className="text-xl font-black text-dark-text tracking-tight">কাস্টমার ডেটা এক্সপোর্ট</h3>
            <p className="text-gray-text text-sm mt-2 font-bold">সব কাস্টমারের তথ্য CSV ফাইল হিসেবে ডাউনলোড করুন।</p>
          </div>
          <button 
            onClick={handleExport}
            disabled={isExporting}
            className="w-full h-14 teal-gradient text-white font-black rounded-2xl shadow-xl shadow-teal-primary/20 flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isExporting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            এক্সপোর্ট করুন
          </button>
        </div>

        {/* Import Card */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-bg-light text-center space-y-6">
          <div className="w-20 h-20 bg-blue-500/10 rounded-[2rem] flex items-center justify-center mx-auto text-blue-500">
            <Upload className="w-10 h-10" />
          </div>
          <div>
            <h3 className="text-xl font-black text-dark-text tracking-tight">কাস্টমার ডেটা ইমপোর্ট</h3>
            <p className="text-gray-text text-sm mt-2 font-bold">CSV ফাইল থেকে অনেক কাস্টমার একসাথে যোগ করুন।</p>
          </div>
          <label className="block w-full h-14 bg-bg-light text-dark-text font-black rounded-2xl border-2 border-dashed border-gray-text/20 flex items-center justify-center gap-3 cursor-pointer hover:bg-bg-light/80 transition-all">
            {isImporting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
            {isImporting ? 'ইমপোর্ট হচ্ছে...' : 'ফাইল সিলেক্ট করুন'}
            <input type="file" accept=".csv" onChange={handleImport} className="hidden" disabled={isImporting} />
          </label>
        </div>

        {/* Clear Data Card */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-bg-light text-center space-y-6">
          <div className="w-20 h-20 bg-danger-red/10 rounded-[2rem] flex items-center justify-center mx-auto text-danger-red">
            <Trash2 className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-dark-text">সব ডাটা মুছুন</h2>
            <p className="text-xs font-bold text-gray-text leading-relaxed">
              সিস্টেমের সব কাস্টমার, ট্রানজেকশন এবং নোটিফিকেশন ডাটা মুছে ফেলুন। <br/>
              <span className="text-danger-red">সতর্কতা: এটি আর ফিরিয়ে আনা যাবে না!</span>
            </p>
          </div>
          <button 
            onClick={handleClearData}
            disabled={isClearing}
            className="w-full py-4 bg-white border-2 border-danger-red text-danger-red rounded-2xl font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
          >
            {isClearing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
            সব ডাটা ডিলিট করুন
          </button>
        </div>
      </div>

      <AnimatePresence>
        {importStatus && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-teal-primary/10 p-6 rounded-[2rem] border border-teal-primary/20 flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-teal-primary rounded-2xl flex items-center justify-center text-white">
              <Check className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-black text-teal-primary tracking-tight">ইমপোর্ট সফল হয়েছে!</h4>
              <p className="text-xs font-bold text-teal-primary/70">{importStatus.total} জনের মধ্যে {importStatus.success} জন কাস্টমার যোগ করা হয়েছে।</p>
            </div>
            <button onClick={() => setImportStatus(null)} className="ml-auto p-2">
              <X className="w-4 h-4 text-teal-primary" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
