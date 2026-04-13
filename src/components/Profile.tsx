import { useState, useMemo } from 'react';
import { Staff, Customer } from '../types';
import { 
  User, 
  Settings as SettingsIcon, 
  ClipboardList, 
  Users, 
  Bell, 
  Info, 
  LogOut, 
  ChevronRight,
  Shield,
  Key,
  Smartphone,
  Lock,
  Edit3,
  BarChart3,
  Palette,
  Languages,
  Phone,
  Star,
  Zap,
  Clock
} from 'lucide-react';
import { motion } from 'motion/react';
import ConfirmationModal from './ConfirmationModal';

interface ProfileProps {
  user: Staff | null;
  customers: Customer[];
  onLogout: () => void;
  onNavigate: (view: string) => void;
}

export default function Profile({ user, customers, onLogout, onNavigate }: ProfileProps) {
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const totalPoints = useMemo(() => customers.reduce((acc, curr) => acc + curr.points, 0), [customers]);
  const daysActive = useMemo(() => user && user.addedDate ? Math.floor((new Date().getTime() - new Date(user.addedDate).getTime()) / (1000 * 60 * 60 * 24)) : 0, [user?.addedDate]);

  const sections = useMemo(() => [
    {
      title: 'ম্যানেজমেন্ট',
      items: [
        { id: 'staff', icon: Users, label: 'স্টাফ ম্যানেজমেন্ট', sub: 'টিম মেম্বারদের পরিচালনা করুন', color: 'bg-purple-500' },
        { id: 'rules', icon: ClipboardList, label: 'লয়্যালটি রুলস', sub: 'পয়েন্ট রুলস কনফিগার করুন', color: 'bg-orange-500' },
        { id: 'reports', icon: BarChart3, label: 'রিপোর্ট ও অ্যানালিটিক্স', sub: 'ব্যবসায়িক তথ্য দেখুন', color: 'bg-blue-500', soon: true },
      ]
    },
    {
      title: 'নিরাপত্তা',
      items: [
        { id: 'password', icon: Key, label: 'পাসওয়ার্ড পরিবর্তন', sub: 'আপনার পাসওয়ার্ড আপডেট করুন', color: 'bg-teal-primary' },
        { id: 'sessions', icon: Smartphone, label: 'অ্যাক্টিভ সেশন', sub: 'লগ-ইন ডিভাইস ম্যানেজ করুন', color: 'bg-indigo-500' },
        { id: '2fa', icon: Shield, label: 'টু-ফ্যাক্টর অথ (2FA)', sub: 'ইমেইল OTP সুরক্ষা', color: 'bg-emerald-500' },
        { id: 'lock', icon: Lock, label: 'অ্যাপ লক (PIN)', sub: 'অ্যাপের শুরুতে পিন সুরক্ষা', color: 'bg-slate-700' },
      ]
    },
    {
      title: 'ডেঞ্জার জোন',
      items: [
        { id: 'logout', icon: LogOut, label: 'লগ-আউট', sub: 'অ্যাকাউন্ট থেকে বের হয়ে যান', color: 'bg-danger-red', isLogout: true },
      ]
    },
    {
      title: 'সেটিংস',
      items: [
        { id: 'settings', icon: SettingsIcon, label: 'অ্যাপ সেটিংস', sub: 'সাধারণ কনফিগারেশন', color: 'bg-blue-600' },
        { id: 'theme', icon: Palette, label: 'থিম (Theme)', sub: 'অ্যাপের লুক পরিবর্তন করুন', color: 'bg-pink-500', soon: true },
        { id: 'language', icon: Languages, label: 'ভাষা (Language)', sub: 'অ্যাপের ভাষা পরিবর্তন করুন', color: 'bg-amber-500', soon: true },
      ]
    },
    {
      title: 'সাপোর্ট',
      items: [
        { id: 'support', icon: Phone, label: 'সাপোর্ট যোগাযোগ', sub: 'স্কাই টেক থেকে সাহায্য নিন', color: 'bg-teal-600' },
        { id: 'about', icon: Info, label: 'অ্যাপ সম্পর্কে', sub: 'ভার্সন ও কোম্পানি তথ্য', color: 'bg-slate-500' },
        { id: 'rate', icon: Star, label: 'রেট অ্যাপ', sub: 'আপনার মতামত শেয়ার করুন', color: 'bg-yellow-500', soon: true },
      ]
    }
  ], []);

  const filteredSections = useMemo(() => sections.map(section => ({
    ...section,
    items: section.items.filter(item => {
      if (user?.role === 'Staff') {
        const adminOnly = ['staff', 'rules', 'settings'];
        return !adminOnly.includes(item.id);
      }
      return true;
    })
  })).filter(section => section.items.length > 0), [sections, user?.role]);

  return (
    <div className="flex flex-col min-h-full -mx-6 -mt-[50px] bg-[#F8FFFE]">
      {/* Gradient Header */}
      <div className="teal-gradient pt-8 pb-14 px-8 rounded-b-[3rem] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full -ml-24 -mb-24 blur-2xl" />
        
        <div className="flex flex-col items-center relative z-10">
          <div className="relative mb-3">
            <div className="absolute inset-0 bg-white/30 rounded-full blur-xl animate-pulse" />
            <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center text-teal-primary text-3xl font-black shadow-2xl border-4 border-white/50 relative">
              {user ? getInitials(user.name) : '??'}
            </div>
            <button 
              onClick={() => onNavigate('edit-profile')}
              className="absolute bottom-0 right-0 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-teal-primary border-2 border-teal-primary/10 active:scale-90 transition-all"
            >
              <Edit3 className="w-5 h-5" />
            </button>
          </div>
          
          <h2 className="text-2xl font-black text-white mb-1">{user?.name || 'User'}</h2>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-white rounded-full text-[10px] font-black uppercase tracking-widest border border-white/30">
              {user?.role}
            </span>
          </div>
          <p className="text-sm font-bold text-white/80">{user?.email}</p>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsLogoutModalOpen(true)}
            className="mt-4 px-6 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-white/20 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            লগ-আউট
          </motion.button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="px-6 -mt-8 relative z-20">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'কাস্টমার', value: customers.length, icon: Users },
            { label: 'মোট পয়েন্ট', value: totalPoints.toLocaleString(), icon: Zap },
            { label: 'দিন সক্রিয়', value: daysActive, icon: Clock },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-3xl p-3 shadow-lg shadow-black/5 border border-white flex flex-col items-center text-center">
              <stat.icon className="w-4 h-4 text-teal-primary/40 mb-2" />
              <p className="text-lg font-black text-teal-primary leading-none mb-1">{stat.value}</p>
              <p className="text-[8px] font-black text-gray-text uppercase tracking-widest">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Menu Sections */}
      <div className="p-4 pt-0 pb-12 space-y-3">
        {filteredSections.map((section, idx) => (
          <div key={idx} className="space-y-2">
            <h3 className="text-[10px] font-black text-gray-text uppercase tracking-[0.2em] ml-4">
              ── {section.title} ──
            </h3>
            <div className="bg-white rounded-[2.5rem] p-1 shadow-sm border border-[#E8F0EF] overflow-hidden">
              {section.items.map((item: any, i) => (
                <motion.button
                  key={item.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => item.isLogout ? setIsLogoutModalOpen(true) : onNavigate(item.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-[2rem] transition-all hover:bg-bg-light group ${i !== section.items.length - 1 ? 'mb-0' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-2xl ${item.color} flex items-center justify-center text-white shadow-lg shadow-black/5`}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-black tracking-tight ${item.isLogout ? 'text-danger-red' : 'text-dark-text'}`}>
                          {item.label}
                        </span>
                        {item.soon && (
                          <span className="px-2 py-0.5 bg-bg-light text-gray-text rounded-full text-[7px] font-black uppercase tracking-widest">
                            শীঘ্রই আসছে 🚀
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-black text-gray-text">{item.sub}</p>
                    </div>
                  </div>
                  {!item.soon && (
                    <ChevronRight className={`w-5 h-5 transition-colors ${item.isLogout ? 'text-danger-red/30' : 'text-gray-text group-hover:text-teal-primary'}`} />
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        ))}
        <div className="h-10" /> {/* Bottom Spacer */}
      </div>

      <ConfirmationModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={onLogout}
        title="লগ-আউট করবেন?"
        message="আলহামদুলিল্লাহ, আবার আসবেন! 🤲"
        confirmLabel="হ্যাঁ, লগ-আউট করুন"
        cancelLabel="না, থাকুক"
        type="danger"
        icon={<LogOut className="w-8 h-8" />}
      />
    </div>
  );
}
