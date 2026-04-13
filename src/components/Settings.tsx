import React, { useState } from 'react';
import { Staff } from '../types';
import { 
  ArrowLeft,
  Moon,
  Palette,
  Type,
  Smartphone,
  Layout,
  Zap,
  Image as ImageIcon,
  Briefcase,
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  Share2,
  Target,
  Calendar,
  Trophy,
  Cake,
  UserPlus,
  Gift,
  Star,
  ArrowRightLeft,
  TrendingUp,
  Bell,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  BarChart2,
  Users,
  FileText,
  UserX,
  FileSpreadsheet,
  FileDown,
  Lock,
  Fingerprint,
  LogOut,
  History,
  Shield,
  Activity,
  Database,
  RefreshCcw,
  RotateCcw,
  Trash2,
  Cloud,
  MessageCircle,
  Facebook,
  CreditCard,
  Monitor,
  Info,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { motion } from 'motion/react';
import Toast from './Toast';

interface SettingsProps {
  user: Staff | null;
  staff: Staff[];
  onLogout: () => void;
  onBack: () => void;
}

export default function Settings({ onBack }: SettingsProps) {
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const sections = [
    {
      title: '🎨 APPEARANCE',
      items: [
        { icon: Moon, label: 'Dark/Light Theme', desc: 'অ্যাপের থিম পরিবর্তন করুন', color: 'bg-indigo-500' },
        { icon: Palette, label: 'Custom Color', desc: 'নিজের পছন্দের রঙ বেছে নিন', color: 'bg-amber-500' },
        { icon: Type, label: 'Font Size', desc: 'লেখার সাইজ ছোট/মাঝারি/বড়', color: 'bg-blue-500' },
        { icon: Type, label: 'Font Style', desc: 'লেখার ধরন পরিবর্তন করুন', color: 'bg-cyan-500' },
        { icon: Smartphone, label: 'App Icon Style', desc: 'হোম স্ক্রিন আইকন পরিবর্তন', color: 'bg-purple-500' },
        { icon: Layout, label: 'Card Design Style', desc: 'মেম্বার কার্ডের ডিজাইন পরিবর্তন', color: 'bg-pink-500' },
        { icon: Zap, label: 'Animation Speed', desc: 'অ্যাপের অ্যানিমেশন গতি', color: 'bg-yellow-500' },
        { icon: ImageIcon, label: 'Wallpaper/Background', desc: 'অ্যাপের ব্যাকগ্রাউন্ড পরিবর্তন', color: 'bg-emerald-500' },
      ]
    },
    {
      title: '🏢 BUSINESS INFO',
      items: [
        { icon: Briefcase, label: 'Business Name', desc: 'আপনার ব্যবসার নাম সেট করুন', color: 'bg-teal-600' },
        { icon: MapPin, label: 'Business Address', desc: 'ব্যবসার সম্পূর্ণ ঠিকানা', color: 'bg-red-500' },
        { icon: Phone, label: 'Business Phone', desc: 'ব্যবসার ফোন নম্বর', color: 'bg-green-600' },
        { icon: Mail, label: 'Business Email', desc: 'ব্যবসার ইমেইল ঠিকানা', color: 'bg-indigo-600' },
        { icon: ImageIcon, label: 'Business Logo', desc: 'ব্যবসার লোগো আপলোড করুন', color: 'bg-pink-500' },
        { icon: Globe, label: 'Business Website', desc: 'ওয়েবসাইট লিংক যোগ করুন', color: 'bg-blue-600' },
        { icon: Clock, label: 'Working Hours', desc: 'কাজের সময় নির্ধারণ করুন', color: 'bg-slate-600' },
        { icon: Share2, label: 'Social Media Links', desc: 'Facebook, Instagram লিংক', color: 'bg-blue-400' },
      ]
    },
    {
      title: '💰 LOYALTY & POINTS',
      items: [
        { icon: Zap, label: 'Points Per Purchase', desc: 'প্রতি ১০০ টাকায় কত পয়েন্ট', color: 'bg-yellow-500' },
        { icon: Target, label: 'Minimum Redeem Points', desc: 'সর্বনিম্ন কত পয়েন্ট রিডিম করা যাবে', color: 'bg-red-400' },
        { icon: Calendar, label: 'Points Expiry Date', desc: 'পয়েন্টের মেয়াদ কতদিন', color: 'bg-orange-500' },
        { icon: Trophy, label: 'Tier Thresholds', desc: 'Bronze/Silver/Gold/Platinum সীমা', color: 'bg-purple-600' },
        { icon: Cake, label: 'Birthday Bonus Points', desc: 'জন্মদিনে কত পয়েন্ট বোনাস', color: 'bg-pink-400' },
        { icon: UserPlus, label: 'Referral Bonus Points', desc: 'রেফারেল করলে কত পয়েন্ট', color: 'bg-blue-600' },
        { icon: Gift, label: 'Welcome Bonus Points', desc: 'নতুন কাস্টমারকে ওয়েলকাম পয়েন্ট', color: 'bg-teal-500' },
        { icon: Star, label: 'Double Points Day', desc: 'বিশেষ দিনে দ্বিগুণ পয়েন্ট', color: 'bg-yellow-600' },
        { icon: ArrowRightLeft, label: 'Points Transfer', desc: 'এক কাস্টমার থেকে অন্যজনে পয়েন্ট', color: 'bg-indigo-400' },
        { icon: TrendingUp, label: 'Bonus Multiplier', desc: 'বিশেষ অফারে পয়েন্ট গুণ করুন', color: 'bg-emerald-600' },
      ]
    },
    {
      title: '🔔 NOTIFICATIONS',
      items: [
        { icon: Bell, label: 'Push Notifications', desc: 'অ্যাপ নোটিফিকেশন চালু/বন্ধ', color: 'bg-teal-500' },
        { icon: MessageSquare, label: 'SMS Alerts', desc: 'কাস্টমারকে SMS পাঠান', color: 'bg-green-500' },
        { icon: Mail, label: 'Email Reports', desc: 'সাপ্তাহিক রিপোর্ট ইমেইলে', color: 'bg-indigo-600' },
        { icon: Calendar, label: 'Birthday Reminders', desc: 'জন্মদিনের আগে রিমাইন্ডার', color: 'bg-rose-500' },
        { icon: AlertTriangle, label: 'Low Points Alert', desc: 'পয়েন্ট কম হলে নোটিফিকেশন', color: 'bg-orange-400' },
        { icon: UserPlus, label: 'New Customer Alert', desc: 'নতুন কাস্টমার যোগ হলে জানান', color: 'bg-blue-500' },
        { icon: CheckCircle2, label: 'Redemption Alert', desc: 'পয়েন্ট রিডিম হলে জানান', color: 'bg-emerald-500' },
        { icon: BarChart2, label: 'Weekly Summary', desc: 'সাপ্তাহিক সারসংক্ষেপ পাঠান', color: 'bg-slate-500' },
      ]
    },
    {
      title: '📊 REPORTS & ANALYTICS',
      items: [
        { icon: BarChart2, label: 'Sales Report', desc: 'দৈনিক/সাপ্তাহিক বিক্রয় রিপোর্ট', color: 'bg-blue-500' },
        { icon: Users, label: 'Customer Report', desc: 'কাস্টমার বৃদ্ধির রিপোর্ট', color: 'bg-teal-500' },
        { icon: FileText, label: 'Points Report', desc: 'পয়েন্ট ইস্যু ও রিডিম রিপোর্ট', color: 'bg-indigo-500' },
        { icon: Trophy, label: 'Top Customers', desc: 'সর্বোচ্চ পয়েন্টধারী কাস্টমার', color: 'bg-yellow-600' },
        { icon: UserX, label: 'Inactive Customers', desc: 'দীর্ঘদিন আসেননি যারা', color: 'bg-red-400' },
        { icon: FileSpreadsheet, label: 'Export to Excel', desc: 'Excel ফাইলে ডেটা রপ্তানি', color: 'bg-green-600' },
        { icon: FileDown, label: 'Export to PDF', desc: 'PDF রিপোর্ট তৈরি করুন', color: 'bg-rose-600' },
      ]
    },
    {
      title: '🔐 SECURITY',
      items: [
        { icon: Lock, label: 'App Lock PIN', desc: 'অ্যাপ খুলতে PIN লাগবে', color: 'bg-slate-700' },
        { icon: Fingerprint, label: 'Fingerprint Lock', desc: 'আঙুলের ছাপে অ্যাপ খুলুন', color: 'bg-blue-600' },
        { icon: LogOut, label: 'Auto Logout Timer', desc: 'নির্দিষ্ট সময় পর অটো লগআউট', color: 'bg-orange-600' },
        { icon: History, label: 'Login History', desc: 'কে কখন লগইন করেছে দেখুন', color: 'bg-indigo-600' },
        { icon: Shield, label: 'IP Restriction', desc: 'নির্দিষ্ট IP থেকে লগইন', color: 'bg-red-600' },
        { icon: Activity, label: 'Activity Log', desc: 'সব কার্যক্রমের লগ দেখুন', color: 'bg-teal-600' },
      ]
    },
    {
      title: '💾 DATA & BACKUP',
      items: [
        { icon: Database, label: 'Auto Backup', desc: 'প্রতিদিন স্বয়ংক্রিয় ব্যাকআপ', color: 'bg-blue-700' },
        { icon: RefreshCcw, label: 'Manual Backup', desc: 'এখনই ব্যাকআপ নিন', color: 'bg-indigo-600' },
        { icon: RotateCcw, label: 'Restore Data', desc: 'পুরনো ডেটা ফিরিয়ে আনুন', color: 'bg-emerald-600' },
        { icon: Trash2, label: 'Clear Cache', desc: 'অ্যাপের ক্যাশ পরিষ্কার করুন', color: 'bg-orange-500' },
        { icon: Trash2, label: 'Delete All Data', desc: 'সব ডেটা মুছে ফেলুন', color: 'bg-red-500' },
        { icon: Cloud, label: 'Cloud Sync', desc: 'ক্লাউডে ডেটা সিঙ্ক করুন', color: 'bg-sky-500' },
      ]
    },
    {
      title: '🌐 INTEGRATIONS',
      items: [
        { icon: MessageCircle, label: 'WhatsApp Integration', desc: 'WhatsApp এ মেসেজ পাঠান', color: 'bg-green-500' },
        { icon: Facebook, label: 'Facebook Integration', desc: 'Facebook পেজে পোস্ট করুন', color: 'bg-blue-600' },
        { icon: CreditCard, label: 'bKash Payment', desc: 'bKash পেমেন্ট সংযুক্ত করুন', color: 'bg-pink-600' },
        { icon: Smartphone, label: 'Nagad Payment', desc: 'Nagad পেমেন্ট সংযুক্ত করুন', color: 'bg-orange-600' },
        { icon: Monitor, label: 'POS System', desc: 'পয়েন্ট অফ সেল সংযুক্ত করুন', color: 'bg-slate-600' },
      ]
    },
    {
      title: '📱 APP INFO',
      items: [
        { icon: Info, label: 'App Version', desc: 'Version 1.0.0 - Sky Automation Tech', color: 'bg-slate-500', isVersion: true },
        { icon: RefreshCw, label: 'Check for Updates', desc: 'নতুন আপডেট আছে কিনা দেখুন', color: 'bg-blue-500' },
        { icon: Star, label: 'Rate Our App', desc: 'অ্যাপটি রেট করুন ⭐⭐⭐⭐⭐', color: 'bg-yellow-500' },
      ]
    }
  ];

  const handleSoon = () => {
    setToastMsg('শীঘ্রই আসছে! 🚀');
    setShowToast(true);
  };

  return (
    <div className="flex flex-col h-full bg-bg-light">
      <header className="flex items-center gap-3 py-4 px-2 bg-white">
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={onBack} 
          className="p-2 -ml-2 text-gray-text hover:text-teal-primary transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </motion.button>
        <h1 className="text-xl font-black text-dark-text tracking-tight">App Settings</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-24 space-y-10 mt-4 no-scrollbar">
        {sections.map((section, idx) => (
          <div key={idx} className="space-y-4">
            <h3 className="text-[10px] font-black text-gray-text uppercase tracking-[0.3em] ml-4 flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-teal-primary/40" />
              {section.title}
            </h3>
            <div className="bg-white rounded-[2.5rem] p-2 shadow-sm border border-bg-light overflow-hidden">
              {section.items.map((item, i) => (
                <motion.button
                  key={i}
                  whileTap={{ scale: 0.98 }}
                  onClick={item.isVersion ? undefined : handleSoon}
                  className={`w-full flex items-center justify-between p-4 rounded-[2rem] transition-all hover:bg-bg-light group ${i !== section.items.length - 1 ? 'mb-1' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl ${item.color} flex items-center justify-center text-white shadow-lg shadow-black/5 group-hover:scale-110 transition-transform`}>
                      <item.icon className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <p className="text-[15px] font-black text-dark-text tracking-tight leading-tight">{item.label}</p>
                      <p className="text-[11px] font-bold text-gray-text mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                  {item.isVersion ? (
                    <span className="text-[10px] font-black text-teal-primary bg-teal-primary/10 px-4 py-1.5 rounded-full border border-teal-primary/10">V1.0.0</span>
                  ) : (
                    <span className="text-[7px] font-black text-teal-primary bg-teal-primary/10 px-2.5 py-1 rounded-full uppercase tracking-widest border border-teal-primary/10">
                      SOON 🚀
                    </span>
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Toast 
        show={showToast} 
        message={toastMsg} 
        type="success" 
        onClose={() => setShowToast(false)} 
      />
    </div>
  );
}
