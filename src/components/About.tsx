import React from 'react';
import { ArrowLeft, Heart, ShieldCheck, Zap, Globe, Mail, Phone } from 'lucide-react';
import { motion } from 'motion/react';
import { APP_LOGO, APP_NAME } from '../constants';

interface AboutProps {
  onBack: () => void;
}

export default function About({ onBack }: AboutProps) {
  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <header className="flex items-center gap-3 py-2">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-text hover:text-teal-primary transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-black text-dark-text">অ্যাপ সম্পর্কে</h1>
      </header>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white border border-bg-light rounded-[2.5rem] p-10 text-center shadow-sm relative overflow-hidden"
      >
        {/* Background Decoration */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-teal-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-teal-primary/5 rounded-full blur-3xl" />

        <div className="relative">
          <div className="w-28 h-28 mx-auto bg-white rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl shadow-teal-primary/10 rotate-6 group hover:rotate-0 transition-transform duration-500 overflow-hidden p-4 border border-bg-light">
            <img 
              src={APP_LOGO} 
              alt={APP_NAME} 
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          
          <h2 className="text-3xl font-black text-dark-text mb-1">Sky Loyalty</h2>
          <p className="text-sm font-black text-teal-primary uppercase tracking-[0.2em] mb-8">Premium Loyalty System</p>
          
          <div className="space-y-6 text-left border-t border-bg-light pt-8">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-gray-text uppercase tracking-widest">ভার্সন</span>
              <span className="text-sm font-black text-dark-text">১.১.০ (PWA)</span>
            </div>
            
            {/* Changelog */}
            <div className="bg-bg-light p-4 rounded-2xl mt-4">
              <h3 className="text-[10px] font-black text-gray-text uppercase tracking-widest mb-3">কী কী নতুন এলো (v1.1.0)</h3>
              <ul className="text-xs font-bold text-dark-text space-y-2 list-disc pl-4">
                <li>অফলাইন সাপোর্ট ও PWA ইনস্টল সুবিধা</li>
                <li>অটোমেটিক ব্যাকগ্রাউন্ড আপডেট সিস্টেম</li>
                <li>ক্যামেরা পারমিশন ও QR স্ক্যানার ফিক্স</li>
                <li>নেটিভ অ্যাপের মতো জুম ও সিলেকশন বন্ধ</li>
              </ul>
            </div>

            <div className="flex justify-between items-center mt-6">
              <span className="text-[10px] font-black text-gray-text uppercase tracking-widest">ডেভেলপার</span>
              <span className="text-sm font-black text-dark-text">Sky Automation Tech</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-gray-text uppercase tracking-widest">কপিরাইট</span>
              <span className="text-sm font-black text-dark-text">© ২০২৬ সর্বস্বত্ব সংরক্ষিত</span>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-4">
            <a href="https://skyautomationtech.com" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 p-3 bg-bg-light rounded-2xl hover:bg-teal-primary/10 transition-colors">
              <Globe className="w-5 h-5 text-teal-primary" />
              <span className="text-[8px] font-black text-gray-text uppercase">ওয়েবসাইট</span>
            </a>
            <a href="mailto:support@skyautomationtech.com" className="flex flex-col items-center gap-2 p-3 bg-bg-light rounded-2xl hover:bg-teal-primary/10 transition-colors">
              <Mail className="w-5 h-5 text-teal-primary" />
              <span className="text-[8px] font-black text-gray-text uppercase">ইমেইল</span>
            </a>
            <a href="tel:+880123456789" className="flex flex-col items-center gap-2 p-3 bg-bg-light rounded-2xl hover:bg-teal-primary/10 transition-colors">
              <Phone className="w-5 h-5 text-teal-primary" />
              <span className="text-[8px] font-black text-gray-text uppercase">কল করুন</span>
            </a>
          </div>

          <div className="mt-10 p-4 bg-teal-primary/5 rounded-2xl flex items-center justify-center gap-3">
            <ShieldCheck className="w-5 h-5 text-teal-primary" />
            <p className="text-[10px] font-black text-teal-primary uppercase tracking-widest">সম্পূর্ণ নিরাপদ ও এনক্রিপ্টেড</p>
          </div>
        </div>
      </motion.div>

      <div className="text-center pt-4">
        <p className="text-[10px] font-black text-gray-text uppercase tracking-[0.3em] flex items-center justify-center gap-2">
          Made with <Heart className="w-3 h-3 text-danger-red fill-danger-red" /> by Sky Automation Tech
        </p>
      </div>
    </div>
  );
}
