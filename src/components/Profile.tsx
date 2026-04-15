import { useState, useMemo, memo } from 'react';
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
  Clock,
  ShieldCheck,
  Activity,
  Award,
  Gift,
  MapPin,
  FileSpreadsheet,
  History,
  Globe
} from 'lucide-react';
import { motion } from 'motion/react';
import ConfirmationModal from './ConfirmationModal';

interface ProfileProps {
  user: Staff | null;
  customers: Customer[];
  onLogout: () => void;
  onNavigate: (view: string) => void;
}

function Profile({ user, customers, onLogout, onNavigate }: ProfileProps) {
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReferralBonus = async () => {
    if (!referralCode) return;
    setLoading(true);
    // TODO: Implement referral logic (find customer, add points, log transaction)
    console.log('Awarding bonus for:', referralCode);
    setLoading(false);
    setReferralCode('');
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const totalPoints = useMemo(() => customers.reduce((acc, curr) => acc + curr.points, 0), [customers]);
  const daysActive = useMemo(() => {
    if (!user || !user.addedDate) return 0;
    const start = new Date(user.addedDate).getTime();
    const now = new Date().getTime();
    const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24));
    return diff >= 0 ? diff : 0;
  }, [user?.addedDate]);

  const sections = useMemo(() => [
    {
      title: 'অ্যাডমিন প্যানেল',
      icon: ShieldCheck,
      items: [
        { id: 'staff', icon: Users, label: 'স্টাফ ম্যানেজমেন্ট', sub: 'টিম মেম্বারদের পরিচালনা করুন', color: 'text-purple-600', bg: 'bg-purple-50' },
        { id: 'rules', icon: ClipboardList, label: 'লয়্যালটি রুলস', sub: 'পয়েন্ট রুলস কনফিগার করুন', color: 'text-orange-600', bg: 'bg-orange-50' },
        { id: 'rewards', icon: Gift, label: 'রিওয়ার্ডস', sub: 'পুরস্কার তালিকা ম্যানেজ করুন', color: 'text-teal-600', bg: 'bg-teal-50' },
        { id: 'branches', icon: MapPin, label: 'ব্রাঞ্চ ম্যানেজমেন্ট', sub: 'ব্রাঞ্চ ও লোকেশন ম্যানেজ করুন', color: 'text-blue-600', bg: 'bg-blue-50', masterOnly: true },
        { id: 'import-export', icon: FileSpreadsheet, label: 'ইমপোর্ট ও এক্সপোর্ট', sub: 'CSV ডেটা ম্যানেজমেন্ট', color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { id: 'reports', icon: BarChart3, label: 'রিপোর্ট ও অ্যানালিটিক্স', sub: 'ব্যবসায়িক তথ্য দেখুন', color: 'text-indigo-600', bg: 'bg-indigo-50', soon: true },
      ]
    },
    {
      title: 'নিরাপত্তা ও প্রাইভেসি',
      icon: Lock,
      items: [
        { id: 'password', icon: Key, label: 'পাসওয়ার্ড পরিবর্তন', sub: 'আপনার পাসওয়ার্ড আপডেট করুন', color: 'text-teal-600', bg: 'bg-teal-50' },
        { id: 'sessions', icon: Smartphone, label: 'অ্যাক্টিভ সেশন', sub: 'লগ-ইন ডিভাইস ম্যানেজ করুন', color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { id: '2fa', icon: Shield, label: 'টু-ফ্যাক্টর অথ (2FA)', sub: 'ইমেইল OTP সুরক্ষা', color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { id: 'lock', icon: Lock, label: 'অ্যাপ লক (PIN)', sub: 'অ্যাপের শুরুতে পিন সুরক্ষা', color: 'text-slate-700', bg: 'bg-slate-100' },
        { id: 'audit-logs', icon: History, label: 'অডিট লগ', sub: 'সিস্টেমের সকল অ্যাক্টিভিটি দেখুন', color: 'text-amber-600', bg: 'bg-amber-50', masterOnly: true },
      ]
    },
    {
      title: 'অ্যাপ সেটিংস',
      icon: SettingsIcon,
      items: [
        { id: 'settings', icon: SettingsIcon, label: 'সাধারণ সেটিংস', sub: 'অ্যাপের বেসিক কনফিগারেশন', color: 'text-blue-600', bg: 'bg-blue-50' },
        { id: 'customer-portal', icon: Globe, label: 'কাস্টমার পোর্টাল', sub: 'কাস্টমার সেলফ-সার্ভিস পোর্টাল', color: 'text-cyan-600', bg: 'bg-cyan-50' },
        { id: 'theme', icon: Palette, label: 'থিম (Theme)', sub: 'অ্যাপের লুক পরিবর্তন করুন', color: 'text-pink-600', bg: 'bg-pink-50', soon: true },
        { id: 'language', icon: Languages, label: 'ভাষা (Language)', sub: 'অ্যাপের ভাষা পরিবর্তন করুন', color: 'text-amber-600', bg: 'bg-amber-50', soon: true },
      ]
    },
    {
      title: 'হেল্প ও সাপোর্ট',
      icon: Info,
      items: [
        { id: 'support', icon: Phone, label: 'সাপোর্ট যোগাযোগ', sub: 'স্কাই টেক থেকে সাহায্য নিন', color: 'text-teal-600', bg: 'bg-teal-50' },
        { id: 'about', icon: Info, label: 'অ্যাপ সম্পর্কে', sub: 'ভার্সন ও কোম্পানি তথ্য', color: 'text-slate-600', bg: 'bg-slate-50' },
        { id: 'rate', icon: Star, label: 'রেট অ্যাপ', sub: 'আপনার মতামত শেয়ার করুন', color: 'text-yellow-600', bg: 'bg-yellow-50', soon: true },
      ]
    }
  ], []);

  const filteredSections = useMemo(() => sections.map(section => ({
    ...section,
    items: section.items.filter(item => {
      if (item.masterOnly && user?.role !== 'Master Admin') return false;
      if (user?.role === 'Staff') {
        const adminOnly = ['staff', 'rules', 'settings', 'rewards', 'branches', 'import-export', 'audit-logs'];
        return !adminOnly.includes(item.id);
      }
      return true;
    })
  })).filter(section => section.items.length > 0), [sections, user?.role]);

  return (
    <div className="flex flex-col min-h-full -mx-6 -mt-[50px] bg-[#F9FAFB]">
      {/* Professional Header */}
      <div className="bg-white pt-12 pb-8 px-6 shadow-sm border-b border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 teal-gradient opacity-10" />
        
        <div className="flex items-center gap-5 relative z-10">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-teal-primary text-2xl font-black shadow-md border-2 border-gray-50">
              {user ? getInitials(user.name) : '??'}
            </div>
            <button 
              onClick={() => onNavigate('edit-profile')}
              className="absolute bottom-0 right-0 w-7 h-7 bg-white rounded-full shadow-md flex items-center justify-center text-gray-600 border border-gray-100 hover:text-teal-primary transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>
          
          <div className="flex-1">
            <h2 className="text-xl font-black text-dark-text mb-1">{user?.name || 'User'}</h2>
            <p className="text-xs font-bold text-gray-500 mb-2">{user?.email}</p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-teal-primary/10 text-teal-primary rounded-md text-[10px] font-black uppercase tracking-widest">
              <ShieldCheck className="w-3 h-3" />
              {user?.role}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'কাস্টমার', value: customers.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'মোট পয়েন্ট', value: totalPoints.toLocaleString(), icon: Zap, color: 'text-orange-600', bg: 'bg-orange-50' },
            { label: 'দিন সক্রিয়', value: daysActive, icon: Clock, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col items-center text-center">
              <div className={`w-8 h-8 rounded-full ${stat.bg} ${stat.color} flex items-center justify-center mb-2`}>
                <stat.icon className="w-4 h-4" />
              </div>
              <p className="text-lg font-black text-dark-text leading-none mb-1">{stat.value}</p>
              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Menu Sections */}
      <div className="px-6 pb-24 space-y-6">
        {filteredSections.map((section, idx) => (
          <div key={idx} className="space-y-3">
            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 ml-1">
              <section.icon className="w-3.5 h-3.5" />
              {section.title}
            </h3>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {section.items.map((item: any, i) => (
                <div key={item.id}>
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      if (item.isLogout) {
                        setIsLogoutModalOpen(true);
                      } else if (item.id === 'customer-portal') {
                        window.open('?view=customer', '_blank');
                      } else {
                        onNavigate(item.id);
                      }
                    }}
                    className="w-full flex items-center justify-between p-4 transition-colors hover:bg-gray-50 group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center ${item.color}`}>
                        <item.icon className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-dark-text group-hover:text-teal-primary transition-colors">
                            {item.label}
                          </span>
                          {item.soon && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-md text-[8px] font-black uppercase tracking-widest">
                              শীঘ্রই আসছে
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-medium text-gray-500 mt-0.5">{item.sub}</p>
                      </div>
                    </div>
                    {!item.soon && (
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-teal-primary transition-colors" />
                    )}
                  </motion.button>
                  {i !== section.items.length - 1 && (
                    <div className="h-px bg-gray-50 ml-16" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Referral Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-primary/10 flex items-center justify-center text-teal-primary">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-dark-text">রেফারেল বোনাস</h3>
              <p className="text-[10px] text-gray-500 font-medium">রেফারেল কোড দিয়ে পয়েন্ট প্রদান করুন</p>
            </div>
          </div>
          <div className="space-y-3">
            <input 
              type="text"
              placeholder="রেফারেল কোড বা কাস্টমার আইডি"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              className="w-full bg-bg-light rounded-xl p-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-teal-primary/20"
            />
            <motion.button 
              whileTap={{ scale: 0.98 }}
              onClick={handleReferralBonus}
              disabled={loading || !referralCode}
              className="w-full py-3 bg-teal-primary text-white rounded-xl font-bold text-xs shadow-lg shadow-teal-primary/20 disabled:opacity-50"
            >
              {loading ? 'প্রসেস হচ্ছে...' : 'বোনাস পয়েন্ট প্রদান করুন'}
            </motion.button>
          </div>
        </div>

        {/* Logout Button */}
        <div className="pt-4">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsLogoutModalOpen(true)}
            className="w-full bg-white border border-danger-red/20 rounded-2xl p-4 flex items-center justify-center gap-2 text-danger-red hover:bg-danger-red/5 transition-colors shadow-sm"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-bold">লগ-আউট করুন</span>
          </motion.button>
        </div>
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

export default memo(Profile);
