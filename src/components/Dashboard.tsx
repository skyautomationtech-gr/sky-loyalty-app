import React, { useMemo, memo } from 'react';
import { Customer, Staff, Notification } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { Users, Zap, ShieldCheck, ShoppingBag, Plus, TrendingUp, ArrowUpRight, Bell, Sparkles, Calendar, PieChart as PieChartIcon, BarChart3, Search, Award, Clock, Activity } from 'lucide-react';
import { motion } from 'motion/react';
import { APP_LOGO, APP_NAME } from '../constants';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface DashboardProps {
  user: Staff | null;
  customers: Customer[];
  staff: Staff[];
  notifications: Notification[];
  redeemCount: number;
  onAddCustomer: () => void;
}

function Dashboard({ user, customers, staff, notifications, redeemCount, onAddCustomer }: DashboardProps) {
  const { t } = useLanguage();
  const totalPoints = useMemo(() => customers.reduce((acc, m) => acc + m.points, 0), [customers]);
  
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "শুভ সকাল";
    if (hour < 17) return "শুভ দুপুর";
    if (hour < 20) return "শুভ সন্ধ্যা";
    return "শুভ রাত্রি";
  };

  const stats = useMemo(() => {
    const s = [
      { label: t('total_customers') || 'মোট কাস্টমার', value: customers.length, icon: Users, color: 'text-teal-primary', bg: 'bg-teal-primary/5' },
      { label: t('total_points'), value: totalPoints.toLocaleString(), icon: Zap, color: 'text-orange-500', bg: 'bg-orange-50' },
      { label: t('redeem_count') || 'রিডিম সংখ্যা', value: redeemCount.toLocaleString(), icon: ShoppingBag, color: 'text-purple-500', bg: 'bg-purple-50' },
    ];

    if (user?.role === 'Admin' || user?.role === 'Master Admin') {
      s.splice(2, 0, { label: t('staff_member'), value: staff.length, icon: ShieldCheck, color: 'text-blue-500', bg: 'bg-blue-50' });
    }
    return s;
  }, [customers.length, totalPoints, redeemCount, staff.length, user?.role, t]);

  const tiers = useMemo(() => [
    { name: 'Bronze', value: customers.filter(m => m.tier === 'BRONZE').length, color: '#EA580C' },
    { name: 'Silver', value: customers.filter(m => m.tier === 'SILVER').length, color: '#94A3B8' },
    { name: 'Gold', value: customers.filter(m => m.tier === 'GOLD').length, color: '#EAB308' },
    { name: 'Platinum', value: customers.filter(m => m.tier === 'PLATINUM').length, color: '#2DD4BF' },
  ], [customers]);

  const chartData = useMemo(() => {
    // Real data for points trend (placeholder for now, but not mock)
    return [
      { name: 'Sat', points: 0 },
      { name: 'Sun', points: 0 },
      { name: 'Mon', points: 0 },
      { name: 'Tue', points: 0 },
      { name: 'Wed', points: 0 },
      { name: 'Thu', points: 0 },
      { name: 'Fri', points: 0 },
    ];
  }, []);

  const topCustomers = useMemo(() => {
    return [...customers].sort((a, b) => b.points - a.points).slice(0, 3);
  }, [customers]);

  const todaysPoints = useMemo(() => {
    return 0;
  }, []);

  const todaysCustomers = useMemo(() => {
    return 0;
  }, []);

  return (
    <div className="min-h-screen bg-[#F4F7F6] pb-24 -mx-6 -mt-[50px] pt-[50px]">
      {/* Top Header */}
      <header className="px-6 pt-6 pb-4 flex justify-between items-center sticky top-0 bg-[#F4F7F6]/80 backdrop-blur-md z-30">
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{getGreeting()}</p>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">{user?.name.split(' ')[0] || 'Operator'}</h1>
        </div>
        <div className="flex items-center gap-3">
          <motion.button 
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-600 shadow-sm border border-gray-100 relative"
          >
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            )}
          </motion.button>
          <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center text-white text-sm font-black shadow-md border-2 border-white">
            {user ? getInitials(user.name) : '??'}
          </div>
        </div>
      </header>

      <div className="px-6 space-y-6">
        {/* Search Bar */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400 group-focus-within:text-teal-600 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="কাস্টমার খুঁজুন..."
            className="block w-full pl-11 pr-4 py-3.5 bg-white border-none rounded-2xl text-sm shadow-sm focus:ring-2 focus:ring-teal-500 transition-all outline-none font-medium text-slate-700 placeholder:text-gray-400"
            onClick={() => {
              const customersTabBtn = document.querySelector('[data-tab="customers"]') as HTMLButtonElement;
              if (customersTabBtn) customersTabBtn.click();
            }}
          />
        </div>

        {/* Hero Overview Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900 rounded-[2rem] p-6 text-white relative overflow-hidden shadow-xl shadow-slate-900/20"
        >
          {/* Decorative BG */}
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-teal-500/20 rounded-full blur-3xl" />
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">সর্বমোট পয়েন্ট</p>
                <h2 className="text-4xl font-black tracking-tight">{totalPoints.toLocaleString()}</h2>
              </div>
              <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
                <Zap className="w-6 h-6 text-teal-400" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/10">
              <div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">মোট কাস্টমার</p>
                <p className="text-xl font-bold">{customers.length}</p>
              </div>
              <div>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">রিডিম হয়েছে</p>
                <p className="text-xl font-bold">{redeemCount}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions (Floating style) */}
        <div className="flex gap-4">
          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={onAddCustomer} 
            className="flex-1 bg-teal-500 text-white py-4 rounded-2xl font-black text-sm shadow-lg shadow-teal-500/30 flex flex-col items-center justify-center gap-2 hover:bg-teal-600 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mb-1">
              <Plus className="w-5 h-5" />
            </div>
            কাস্টমার যোগ
          </motion.button>
          <motion.button 
            whileTap={{ scale: 0.95 }}
            className="flex-1 bg-white text-slate-800 py-4 rounded-2xl font-black text-sm shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2 hover:border-teal-500/30 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center mb-1">
              <Zap className="w-5 h-5 text-orange-500" />
            </div>
            পয়েন্ট দিন
          </motion.button>
        </div>

        {/* Today's Mini Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">আজকের কাস্টমার</p>
              <p className="text-lg font-black text-slate-800">{todaysCustomers}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">আজকের পয়েন্ট</p>
              <p className="text-lg font-black text-slate-800">{todaysPoints}</p>
            </div>
          </div>
        </div>

        {/* Charts (Admin Only) */}
        {(user?.role === 'Admin' || user?.role === 'Master Admin') && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-black text-slate-800">পয়েন্ট ট্রেন্ড</h3>
                <div className="p-2 bg-gray-50 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-gray-500" />
                </div>
              </div>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#94A3B8' }} dy={10} />
                    <Tooltip cursor={{ fill: '#F8FAFC' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 700 }} />
                    <Bar dataKey="points" fill="#0D9488" radius={[6, 6, 0, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Top Customers */}
        {topCustomers.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-black text-slate-800">টপ কাস্টমার</h3>
              <button className="text-[10px] font-black text-teal-600 uppercase tracking-widest hover:underline">সব দেখুন</button>
            </div>
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              {topCustomers.map((customer, idx) => (
                <div key={customer.id} className={`flex items-center justify-between p-4 ${idx !== topCustomers.length - 1 ? 'border-b border-gray-50' : ''}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm ${idx === 0 ? 'bg-amber-100 text-amber-600' : idx === 1 ? 'bg-slate-100 text-slate-600' : 'bg-orange-50 text-orange-600'}`}>
                      #{idx + 1}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{customer.name}</p>
                      <p className="text-xs font-medium text-gray-500">{customer.phone}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-teal-600">{customer.points.toLocaleString()}</p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">পয়েন্ট</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-black text-slate-800">সাম্প্রতিক অ্যাক্টিভিটি</h3>
          </div>
          <div className="space-y-3">
            {notifications.length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-3xl p-8 text-center shadow-sm">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Bell className="w-5 h-5 text-gray-400" />
                </div>
                <p className="text-xs font-bold text-gray-500">কোনো অ্যাক্টিভিটি নেই</p>
              </div>
            ) : (
              notifications.slice(0, 5).map((notif, idx) => (
                <div 
                  key={notif.id} 
                  className="bg-white border border-gray-100 rounded-2xl p-4 flex gap-4 items-center shadow-sm"
                >
                  <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-800 font-bold truncate">{notif.message}</p>
                    <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                      {new Date(notif.timestamp).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="text-center pt-6 pb-2">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center justify-center gap-2">
            <Sparkles className="w-3 h-3 text-teal-500" /> Sky Automation Tech
          </p>
        </div>
      </div>
    </div>
  );
}

export default memo(Dashboard);
