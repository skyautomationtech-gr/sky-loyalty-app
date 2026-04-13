import { Customer, Staff, Notification } from '../types';
import { Users, Zap, ShieldCheck, ShoppingBag, Plus, TrendingUp, ArrowUpRight, Bell, Sparkles, Calendar } from 'lucide-react';
import { motion } from 'motion/react';
import { APP_LOGO, APP_NAME } from '../constants';

interface DashboardProps {
  user: Staff | null;
  customers: Customer[];
  staff: Staff[];
  notifications: Notification[];
  redeemCount: number;
  onAddCustomer: () => void;
}

export default function Dashboard({ user, customers, staff, notifications, redeemCount, onAddCustomer }: DashboardProps) {
  const totalPoints = customers.reduce((acc, m) => acc + m.points, 0);
  
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

  const stats = [
    { label: 'মোট কাস্টমার', value: customers.length, icon: Users, color: 'text-teal-primary', bg: 'bg-teal-primary/5' },
    { label: 'মোট পয়েন্ট', value: totalPoints.toLocaleString(), icon: Zap, color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: 'স্টাফ মেম্বার', value: staff.length, icon: ShieldCheck, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'রিডিম সংখ্যা', value: redeemCount.toLocaleString(), icon: ShoppingBag, color: 'text-purple-500', bg: 'bg-purple-50' },
  ];

  const tiers = [
    { name: 'Bronze', count: customers.filter(m => m.tier === 'BRONZE').length, color: 'bg-orange-600', max: customers.length || 1 },
    { name: 'Silver', count: customers.filter(m => m.tier === 'SILVER').length, color: 'bg-slate-400', max: customers.length || 1 },
    { name: 'Gold', count: customers.filter(m => m.tier === 'GOLD').length, color: 'bg-yellow-500', max: customers.length || 1 },
    { name: 'Platinum', count: customers.filter(m => m.tier === 'PLATINUM').length, color: 'bg-teal-400', max: customers.length || 1 },
  ];

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <header className="flex justify-between items-center bg-white py-2">
        <div className="flex items-center gap-3">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 rounded-xl bg-white flex items-center justify-center overflow-hidden border border-bg-light p-1.5"
          >
            <img 
              src={APP_LOGO} 
              alt={APP_NAME} 
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </motion.div>
          <div>
            <h1 className="text-base font-black text-dark-text leading-none">{APP_NAME}</h1>
            <span className="px-2 py-0.5 rounded-full bg-teal-primary/10 text-[8px] text-teal-primary font-black uppercase tracking-widest mt-1 inline-block border border-teal-primary/20">
              {user?.role === 'Admin' || user?.role === 'Master Admin' ? 'অ্যাডমিন' : 'অপারেটর'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <motion.button 
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 rounded-xl bg-bg-light flex items-center justify-center text-gray-text relative border border-transparent hover:border-teal-primary/20 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && (
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-danger-red rounded-full border-2 border-white animate-pulse" />
            )}
          </motion.button>
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="w-10 h-10 rounded-xl teal-gradient flex items-center justify-center text-white text-sm font-black shadow-lg shadow-teal-primary/20 border-2 border-white"
          >
            {user ? getInitials(user.name) : '??'}
          </motion.div>
        </div>
      </header>

      {/* Greeting Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-bg-light rounded-[2.5rem] p-6 shadow-[0_8px_30px_rgba(0,191,166,0.03)] relative overflow-hidden flex justify-between items-center group"
      >
        <div className="absolute left-0 top-0 bottom-0 w-1.5 teal-gradient" />
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-teal-primary/5 rounded-full blur-2xl group-hover:bg-teal-primary/10 transition-colors" />
        
        <div className="relative z-10 space-y-1">
          <h2 className="text-xl font-black text-dark-text tracking-tight flex items-center gap-2">
            আসসালামু আলাইকুম <motion.span animate={{ rotate: [0, 20, 0] }} transition={{ repeat: Infinity, duration: 2 }}>👋</motion.span>
          </h2>
          <p className="text-teal-primary font-black text-sm">
            {getGreeting()}, {user?.name.split(' ')[0] || 'Operator'}
          </p>
          <div className="flex items-center gap-2 pt-1">
            <Calendar className="w-3 h-3 text-gray-text" />
            <p className="text-gray-text text-[9px] font-black uppercase tracking-[0.2em]">
              {new Date().toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        <motion.div 
          whileHover={{ rotate: 10 }}
          className="w-16 h-16 rounded-2xl bg-bg-light p-1 flex items-center justify-center shadow-inner border border-bg-light"
        >
          <img 
            src={APP_LOGO} 
            alt={APP_NAME} 
            className="w-full h-full object-cover rounded-xl"
            referrerPolicy="no-referrer"
          />
        </motion.div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            whileHover={{ y: -4 }}
            className="bg-white border border-bg-light rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,191,166,0.02)] group hover:border-teal-primary/30 transition-all"
          >
            <div className={`p-2.5 rounded-2xl w-fit mb-3 ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-gray-text text-[9px] font-black uppercase tracking-widest mb-1">{stat.label}</p>
            <div className="flex items-baseline gap-1">
              <p className="text-xl font-black text-dark-text">{stat.value}</p>
              <ArrowUpRight className="w-3 h-3 text-teal-primary opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <section className="space-y-3">
        <h3 className="text-[10px] font-black text-dark-text uppercase tracking-widest ml-1">দ্রুত কাজ</h3>
        <div className="flex gap-3">
          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={onAddCustomer} 
            className="flex-1 flex items-center justify-center gap-2 teal-gradient text-white py-4 rounded-2xl font-black text-xs shadow-lg shadow-teal-primary/20"
          >
            <Plus className="w-4 h-4" /> কাস্টমার যোগ করুন
          </motion.button>
          <motion.button 
            whileTap={{ scale: 0.95 }}
            className="flex-1 flex items-center justify-center gap-2 bg-white border border-bg-light text-dark-text py-4 rounded-2xl font-black text-xs shadow-sm hover:border-teal-primary/20 transition-colors"
          >
            <Zap className="w-4 h-4 text-orange-500" /> পয়েন্ট দিন
          </motion.button>
        </div>
      </section>

      {/* Tier Breakdown */}
      <section className="bg-white border border-bg-light rounded-[2.5rem] p-6 shadow-[0_4px_20px_rgba(0,191,166,0.02)] space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-[10px] font-black text-dark-text uppercase tracking-widest">কাস্টমার টিয়ার</h3>
          <TrendingUp className="w-4 h-4 text-teal-primary" />
        </div>
        <div className="space-y-5">
          {tiers.map((tier, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${tier.color}`} />
                  <span className="text-gray-text">{tier.name}</span>
                </div>
                <span className="text-dark-text">{tier.count} কাস্টমার</span>
              </div>
              <div className="h-1.5 bg-bg-light rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(tier.count / tier.max) * 100}%` }}
                  transition={{ duration: 1, delay: idx * 0.1, ease: "easeOut" }}
                  className={`h-full ${tier.color} rounded-full`}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Activity */}
      <section className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-[10px] font-black text-dark-text uppercase tracking-widest">সাম্প্রতিক অ্যাক্টিভিটি</h3>
          <button className="text-[9px] font-black text-teal-primary uppercase tracking-widest hover:underline">সব দেখুন</button>
        </div>
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="bg-white border border-bg-light rounded-3xl p-10 text-center">
              <div className="w-12 h-12 bg-bg-light rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Bell className="w-6 h-6 text-gray-text/30" />
              </div>
              <p className="text-xs font-black text-gray-text uppercase tracking-widest">কোনো অ্যাক্টিভিটি পাওয়া যায়নি</p>
            </div>
          ) : (
            notifications.slice(0, 5).map((notif, idx) => (
              <motion.div 
                key={notif.id} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white border border-bg-light rounded-2xl p-4 flex gap-4 items-center shadow-sm hover:shadow-md transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-bg-light flex items-center justify-center text-teal-primary group-hover:scale-110 transition-transform">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-dark-text font-bold truncate">{notif.message}</p>
                  <p className="text-[9px] text-gray-text font-black uppercase mt-0.5">
                    {new Date(notif.timestamp).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </section>

      <div className="text-center pt-4">
        <p className="text-[10px] font-black text-gray-text uppercase tracking-[0.2em] flex items-center justify-center gap-2">
          <Sparkles className="w-3 h-3 text-teal-primary" /> Sky Automation Tech
        </p>
      </div>
    </div>
  );
}
