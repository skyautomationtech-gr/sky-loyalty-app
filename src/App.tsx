import { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, onSnapshot, query, where, doc, getDoc, addDoc } from 'firebase/firestore';
import { Staff, Customer, Notification } from './types';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Customers from './components/Customers';
import Settings from './components/Settings';
import Profile from './components/Profile';
import AddCustomer from './components/AddCustomer';
import QRScanner from './components/QRScanner';
import ComingSoon from './components/ComingSoon';
import StaffManagement from './components/StaffManagement';
import LoyaltyRules from './components/LoyaltyRules';
import Notifications from './components/Notifications';
import About from './components/About';
import EditProfile from './components/EditProfile';
import ChangePassword from './components/ChangePassword';
import AppLockSettings from './components/AppLockSettings';
import ActiveSessions from './components/ActiveSessions';
import TwoFactorAuth from './components/TwoFactorAuth';
import ContactSupport from './components/ContactSupport';
import PinLock from './components/PinLock';
import ErrorBoundary from './components/ErrorBoundary';
import Toast from './components/Toast';
import { 
  Home, 
  Users, 
  Settings as SettingsIcon, 
  Zap,
  PlusCircle,
  Camera,
  User,
  Plus,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { APP_LOGO, APP_NAME } from './constants';

export default function App() {
  const [staffInfo, setStaffInfo] = useState<Staff | null>(() => {
    const saved = localStorage.getItem('sky_tech_session');
    return saved ? JSON.parse(saved) : null;
  });
  const [showSplash, setShowSplash] = useState(true);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [isPinLocked, setIsPinLocked] = useState(() => localStorage.getItem('sky_app_lock_enabled') === 'true');
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [redeemCount, setRedeemCount] = useState(0);
  
  const [subView, setSubView] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    // Splash screen timer
    const splashTimer = setTimeout(() => setShowSplash(false), 2500);
    // Initial data load simulation - Minimum 1000ms to prevent flash
    const loadTimer = setTimeout(() => setLoading(false), 1000);
    return () => {
      clearTimeout(splashTimer);
      clearTimeout(loadTimer);
    };
  }, []);

  useEffect(() => {
    if (!staffInfo) return;

    // Track session
    const trackSession = async () => {
      const sessionId = localStorage.getItem('sky_session_id');
      if (!sessionId) {
        const newSessionId = Math.random().toString(36).substring(7);
        localStorage.setItem('sky_session_id', newSessionId);
        try {
          await addDoc(collection(db, 'sessions'), {
            id: newSessionId,
            staffId: staffInfo.id,
            deviceType: window.innerWidth < 430 ? 'Mobile' : 'Desktop',
            loginTime: new Date().toISOString(),
            location: 'Dhaka, Bangladesh', // Approximate
            isCurrent: true
          });
        } catch (err) {
          console.error('Session tracking failed:', err);
        }
      }
    };
    trackSession();

    const unsubStaff = onSnapshot(collection(db, 'staff'), (snap) => {
      const staff = snap.docs.map(d => ({ id: d.id, ...d.data() } as Staff));
      setStaffList(staff);
      
      // Update current staff info if it changed in DB
      const current = staff.find(s => s.id === staffInfo.id);
      if (current) {
        setStaffInfo(current);
        localStorage.setItem('sky_tech_session', JSON.stringify(current));
      }
    });

    return () => {
      unsubStaff();
    };
  }, [staffInfo?.id]); // Only resubscribe if staff ID changes

  useEffect(() => {
    if (!staffInfo) return;

    const unsubCustomers = onSnapshot(collection(db, 'customers'), (snap) => {
      setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() } as Customer)));
    });

    const unsubNotifs = onSnapshot(collection(db, 'notifications'), (snap) => {
      setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() } as Notification))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    });

    const unsubTransactions = onSnapshot(collection(db, 'transactions'), (snap) => {
      const redeems = snap.docs.filter(d => d.data().type === 'REDEEM').length;
      setRedeemCount(redeems);
    });

    return () => {
      unsubCustomers();
      unsubNotifs();
      unsubTransactions();
    };
  }, [staffInfo !== null]); // Only subscribe once when logged in

  const handleLogin = (staff: Staff) => {
    setStaffInfo(staff);
    localStorage.setItem('sky_tech_session', JSON.stringify(staff));
    setIsPinLocked(localStorage.getItem('sky_app_lock_enabled') === 'true');
  };

  const handleLogout = () => {
    setStaffInfo(null);
    localStorage.removeItem('sky_tech_session');
    localStorage.removeItem('sky_session_id');
    setActiveTab('dashboard');
    setSubView(null);
  };

  const handleScan = (decodedText: string) => {
    const customer = customers.find(c => c.customerId === decodedText);
    if (customer) {
      setActiveTab('customers');
    } else {
      setToastMsg('কাস্টমার খুঁজে পাওয়া যায়নি');
      setToastType('error');
      setShowToast(true);
    }
  };

  if (showSplash) {
    return (
      <div className="h-screen teal-gradient flex flex-col items-center justify-center text-white p-8">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative"
        >
          <div className="w-32 h-32 bg-white rounded-[2.5rem] flex items-center justify-center shadow-2xl overflow-hidden p-4">
            <img 
              src={APP_LOGO} 
              alt={APP_NAME} 
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="absolute -inset-4 border-2 border-white/30 rounded-[3rem] animate-[ping_3s_infinite]"
          />
        </motion.div>
        
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12 text-center"
        >
          <h1 className="text-3xl font-black tracking-tighter mb-2">Sky Automation Tech</h1>
          <p className="text-white/70 font-bold uppercase tracking-[0.3em] text-[10px]">Loyalty Management</p>
        </motion.div>

        <div className="absolute bottom-16 w-48 h-1 bg-white/20 rounded-full overflow-hidden">
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "0%" }}
            transition={{ duration: 2, ease: "easeInOut" }}
            className="h-full bg-white"
          />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#F8FFFE]">
        <div className="w-12 h-12 border-4 border-teal-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-bold text-gray-text uppercase tracking-widest">লোড হচ্ছে...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#F8FFFE] p-8 text-center">
        <div className="w-20 h-20 rounded-[2rem] bg-danger-red/10 flex items-center justify-center mb-6">
          <RefreshCw className="w-10 h-10 text-danger-red" />
        </div>
        <h2 className="text-xl font-black text-dark-text mb-2">সার্ভার সংযোগে সমস্যা</h2>
        <p className="text-gray-text text-sm mb-8">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="w-full h-14 teal-gradient text-white font-black rounded-2xl"
        >
          আবার চেষ্টা করুন
        </button>
      </div>
    );
  }

  if (!staffInfo) {
    return <Login onLogin={handleLogin} />;
  }

  if (isPinLocked) {
    return (
      <PinLock 
        correctPin={localStorage.getItem('sky_app_lock_pin') || '0000'}
        onSuccess={() => setIsPinLocked(false)}
        onLogout={handleLogout}
        onForgotPin={() => {
          setToastMsg('পিন রিসেট করতে আপনার ইমেইল OTP ব্যবহার করুন (শীঘ্রই আসছে)');
          setToastType('error');
          setShowToast(true);
        }}
      />
    );
  }

  const tabs = [
    { id: 'dashboard', icon: Home, label: 'Home' },
    { id: 'customers', icon: Users, label: 'Customers' },
    { id: 'add-customer', icon: Plus, label: 'Add' },
    { id: 'scanner', icon: Camera, label: 'Scanner' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-screen overflow-hidden bg-[#F8FFFE]">
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto pt-[50px] pb-[80px] px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={subView || activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {subView ? (
              subView === 'settings' ? (
                <Settings 
                  user={staffInfo} 
                  staff={staffList} 
                  onLogout={handleLogout}
                  onBack={() => setSubView(null)}
                />
              ) : subView === 'staff' ? (
                <StaffManagement 
                  currentUser={staffInfo}
                  onBack={() => setSubView(null)}
                />
              ) : subView === 'rules' ? (
                <LoyaltyRules 
                  currentUser={staffInfo}
                  onBack={() => setSubView(null)}
                />
              ) : subView === 'notifications' ? (
                <Notifications onBack={() => setSubView(null)} />
              ) : subView === 'about' ? (
                <About onBack={() => setSubView(null)} />
              ) : subView === 'edit-profile' ? (
                <EditProfile 
                  user={staffInfo} 
                  onBack={() => setSubView(null)} 
                  onUpdate={(u) => setStaffInfo(u)}
                />
              ) : subView === 'password' ? (
                <ChangePassword user={staffInfo} onBack={() => setSubView(null)} />
              ) : subView === 'lock' ? (
                <AppLockSettings onBack={() => setSubView(null)} />
              ) : subView === 'sessions' ? (
                <ActiveSessions user={staffInfo} onBack={() => setSubView(null)} onLogoutAll={handleLogout} />
              ) : subView === '2fa' ? (
                <TwoFactorAuth user={staffInfo} onBack={() => setSubView(null)} />
              ) : subView === 'support' ? (
                <ContactSupport onBack={() => setSubView(null)} />
              ) : (
                <ComingSoon 
                  featureName={
                    subView === 'reports' ? 'রিপোর্ট ও অ্যানালিটিক্স' :
                    subView === 'theme' ? 'থিম (Theme)' :
                    subView === 'language' ? 'ভাষা (Language)' :
                    subView === 'rate' ? 'রেট অ্যাপ' :
                    subView.charAt(0).toUpperCase() + subView.slice(1)
                  } 
                  onBack={() => setSubView(null)} 
                />
              )
            ) : (
              <>
                {activeTab === 'dashboard' && (
                  <Dashboard 
                    user={staffInfo} 
                    customers={customers} 
                    staff={staffList} 
                    notifications={notifications} 
                    redeemCount={redeemCount}
                    onAddCustomer={() => setActiveTab('add-customer')}
                  />
                )}
                {activeTab === 'customers' && (
                  <Customers 
                    user={staffInfo} 
                    customers={customers} 
                  />
                )}
                {activeTab === 'add-customer' && (
                  <AddCustomer 
                    onSuccess={() => setActiveTab('customers')} 
                  />
                )}
                {activeTab === 'scanner' && (
                  <QRScanner 
                    onScan={handleScan}
                    onClose={() => setActiveTab('dashboard')}
                  />
                )}
                {activeTab === 'profile' && (
                  <Profile 
                    user={staffInfo} 
                    customers={customers}
                    onLogout={handleLogout}
                    onNavigate={(view) => setSubView(view)}
                  />
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto bg-white border-t border-[#E8F0EF] px-2 h-[65px] flex justify-around items-center z-50 shadow-[0_-8px_30px_rgba(0,0,0,0.05)]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id && !subView;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setSubView(null);
                setActiveTab(tab.id);
              }}
              className="relative flex flex-col items-center justify-center gap-1 w-full h-full group"
            >
              <div className={`transition-all duration-300 ${
                isActive ? 'text-teal-primary scale-110' : 'text-[#8A9BA8] group-hover:text-[#6B8F8A]'
              }`}>
                <Icon className="w-6 h-6" />
              </div>
              <span className={`text-[10px] font-bold tracking-wider transition-colors ${
                isActive ? 'text-teal-primary' : 'text-[#8A9BA8]'
              }`}>
                {tab.label}
              </span>
              {isActive && (
                <motion.div 
                  layoutId="activeTabDot"
                  className="absolute bottom-1 w-1 h-1 bg-teal-primary rounded-full"
                />
              )}
            </button>
          );
        })}
      </nav>
      <Toast 
        show={showToast} 
        message={toastMsg} 
        type={toastType} 
        onClose={() => setShowToast(false)} 
      />
    </div>
    </ErrorBoundary>
  );
}
