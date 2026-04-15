import { useState, useEffect, useCallback, useMemo } from 'react';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { collection, onSnapshot, query, where, doc, getDoc, getDocs, addDoc, orderBy, limit } from 'firebase/firestore';
import { Staff, Customer, Notification } from './types';
import { logAction } from './services/auditService';
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
import RewardCatalog from './components/RewardCatalog';
import BranchManagement from './components/BranchManagement';
import BulkImportExport from './components/BulkImportExport';
import CustomerPortal from './components/CustomerPortal';
import AuditLogs from './components/AuditLogs';
import { useLanguage } from './contexts/LanguageContext';
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
  const { t } = useLanguage();
  const [staffInfo, setStaffInfo] = useState<Staff | null>(() => {
    const saved = localStorage.getItem('sky_tech_session');
    return saved ? JSON.parse(saved) : null;
  });
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'STAFF' | 'CUSTOMER'>('STAFF');
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [isPinLocked, setIsPinLocked] = useState(() => localStorage.getItem('sky_app_lock_enabled') === 'true');
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [redeemCount, setRedeemCount] = useState(0);
  const [scannedCustomerId, setScannedCustomerId] = useState<string | null>(null);
  
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (user) {
        if (!staffInfo) {
          try {
            const q = query(collection(db, 'staff'), where('uid', '==', user.uid));
            const snap = await getDocs(q);
            if (!snap.empty) {
              const userData = { id: snap.docs[0].id, ...snap.docs[0].data() } as Staff;
              setStaffInfo(userData);
              localStorage.setItem('sky_tech_session', JSON.stringify(userData));
            } else if (user.email === "skyautomationtech@gmail.com") {
              const masterAdmin: Staff = {
                id: 'master-admin',
                uid: user.uid,
                name: 'Master Admin',
                email: 'skyautomationtech@gmail.com',
                role: 'Master Admin',
                pin: '0000',
                addedBy: 'System',
                addedDate: new Date('2024-01-01T00:00:00.000Z').toISOString(),
                status: 'active'
              };
              setStaffInfo(masterAdmin);
              localStorage.setItem('sky_tech_session', JSON.stringify(masterAdmin));
            }
          } catch (err) {
            console.error('Auth sync error:', err);
          }
        }
      } else {
        if (staffInfo) {
          setStaffInfo(null);
          localStorage.removeItem('sky_tech_session');
        }
      }
      setIsAuthReady(true);
    });
    return unsub;
  }, [staffInfo]);

  const [subView, setSubView] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  // Handle UI Back Button
  const handleBack = useCallback(() => {
    const currentHash = window.location.hash;
    window.history.back();
    
    setTimeout(() => {
      if (window.location.hash === currentHash) {
        // Fallback if history.back() didn't do anything
        if (subView) {
          setSubView(null);
          window.location.hash = activeTab;
        } else {
          setActiveTab('dashboard');
          window.location.hash = 'dashboard';
        }
      }
    }, 50);
  }, [activeTab, subView]);

  // Listen to browser back/forward (hashchange)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (!hash) {
        setActiveTab('dashboard');
        setSubView(null);
        return;
      }
      
      const parts = hash.split('/');
      const tab = parts[0];
      const view = parts[1] || null;
      
      const validTabs = ['dashboard', 'customers', 'add-customer', 'scanner', 'profile'];
      if (validTabs.includes(tab)) {
        setActiveTab(tab);
        setSubView(view);
      } else {
        setActiveTab('dashboard');
        setSubView(null);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    
    if (window.location.hash) {
      handleHashChange();
    } else {
      window.history.replaceState(null, '', '#dashboard');
      setActiveTab('dashboard');
    }

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Sync state to URL hash
  useEffect(() => {
    const expectedHash = subView ? `#${activeTab}/${subView}` : `#${activeTab}`;
    if (window.location.hash !== expectedHash) {
      window.location.hash = expectedHash;
    }
  }, [activeTab, subView]);

  // Session Timeout Logic
  useEffect(() => {
    if (!staffInfo || isPinLocked) return;

    let timeoutId: any;
    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsPinLocked(true);
        setToastMsg('নিরাপত্তার জন্য অ্যাপটি লক করা হয়েছে');
        setToastType('info' as any);
        setShowToast(true);
      }, 5 * 60 * 1000); // 5 minutes inactivity
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => document.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(event => document.removeEventListener(event, resetTimer));
    };
  }, [staffInfo, isPinLocked]);

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

  // Firebase Connection Retry Logic
  useEffect(() => {
    if (error && retryCount < 5) {
      setIsRetrying(true);
      const timer = setTimeout(() => {
        setRetryCount(prev => prev + 1);
        window.location.reload(); // Simple reload to retry connection
      }, 3000);
      return () => clearTimeout(timer);
    } else if (error && retryCount >= 5) {
      setIsRetrying(false);
      setError('ইন্টারনেট চেক করুন');
    }
  }, [error, retryCount]);

  useEffect(() => {
    if (!staffInfo) return;

    // Track session
    const trackSession = async () => {
      const sessionId = localStorage.getItem('sky_session_id');
      if (!sessionId) {
        const newSessionId = Math.random().toString(36).substring(7);
        localStorage.setItem('sky_session_id', newSessionId);
        try {
          const path = 'sessions';
          await addDoc(collection(db, path), {
            id: newSessionId,
            staffId: staffInfo.id,
            deviceType: window.innerWidth < 430 ? 'Mobile' : 'Desktop',
            loginTime: new Date().toISOString(),
            location: 'Dhaka, Bangladesh', // Approximate
            isCurrent: true
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, 'sessions');
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
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'staff');
    });

    return () => {
      unsubStaff();
    };
  }, [staffInfo?.id]); // Only resubscribe if staff ID changes

  useEffect(() => {
    if (!staffInfo) return;

    const unsubCustomers = onSnapshot(collection(db, 'customers'), (snap) => {
      setCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() } as Customer)));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'customers');
    });

    const unsubNotifs = onSnapshot(query(collection(db, 'notifications'), orderBy('timestamp', 'desc'), limit(20)), (snap) => {
      setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() } as Notification)));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'notifications');
    });

    const unsubTransactions = onSnapshot(collection(db, 'transactions'), (snap) => {
      const redeems = snap.docs.filter(d => d.data().type === 'REDEEM').length;
      setRedeemCount(redeems);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'transactions');
    });

    return () => {
      unsubCustomers();
      unsubNotifs();
      unsubTransactions();
    };
  }, [staffInfo !== null]); // Only subscribe once when logged in

  const handleLogin = useCallback((staff: Staff) => {
    setStaffInfo(staff);
    localStorage.setItem('sky_tech_session', JSON.stringify(staff));
    setIsPinLocked(localStorage.getItem('sky_app_lock_enabled') === 'true');
  }, []);

  const handleLogout = useCallback(async () => {
    if (staffInfo) {
      logAction({
        action: 'LOGOUT',
        staffId: staffInfo.id,
        staffName: staffInfo.name,
        details: 'User logged out'
      });
    }
    await auth.signOut();
    setStaffInfo(null);
    localStorage.removeItem('sky_tech_session');
    localStorage.removeItem('sky_session_id');
    setActiveTab('dashboard');
    setSubView(null);
  }, [staffInfo]);

  const handleScan = useCallback((decodedText: string) => {
    const customer = customers.find(c => c.customerId === decodedText);
    if (customer) {
      setScannedCustomerId(decodedText);
      setActiveTab('customers');
    } else {
      setToastMsg('কাস্টমার খুঁজে পাওয়া যায়নি');
      setToastType('error');
      setShowToast(true);
    }
  }, [customers]);

  const tabs = useMemo(() => [
    { id: 'dashboard', icon: Home, label: t('dashboard') },
    { id: 'customers', icon: Users, label: t('customers') },
    { id: 'add-customer', icon: Plus, label: t('add_customer') },
    { id: 'scanner', icon: Camera, label: t('scanner') },
    { id: 'profile', icon: User, label: t('profile') },
  ], [t]);

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
      <div className="h-screen flex flex-col items-center justify-center bg-white">
        <div className="w-12 h-12 border-4 border-teal-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-bold text-gray-text uppercase tracking-widest">লোড হচ্ছে...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white p-8 text-center">
        <div className="w-20 h-20 rounded-[2rem] bg-danger-red/10 flex items-center justify-center mb-6">
          <RefreshCw className={`w-10 h-10 text-danger-red ${isRetrying ? 'animate-spin' : ''}`} />
        </div>
        <h2 className="text-xl font-black text-dark-text mb-2">
          {isRetrying ? 'সংযোগ হচ্ছে...' : 'সার্ভার সংযোগে সমস্যা'}
        </h2>
        <p className="text-gray-text text-sm mb-8">{error}</p>
        <button 
          onClick={() => {
            setRetryCount(0);
            setError(null);
            window.location.reload();
          }}
          className="w-full h-14 teal-gradient text-white font-black rounded-2xl"
        >
          আবার চেষ্টা করুন
        </button>
      </div>
    );
  }

  if (!staffInfo) {
    if (viewMode === 'CUSTOMER') {
      return <CustomerPortal onBack={() => setViewMode('STAFF')} />;
    }
    return <Login onLogin={handleLogin} onCustomerPortal={() => setViewMode('CUSTOMER')} />;
  }

  if (isPinLocked) {
    return (
      <PinLock 
        correctPin={localStorage.getItem('sky_app_lock_pin') || '0000'}
        userEmail={staffInfo?.email}
        onSuccess={() => setIsPinLocked(false)}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-screen overflow-hidden bg-white">
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto pt-[50px] pb-[80px] px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={subView || activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="h-full"
          >
            {subView ? (
              subView === 'settings' ? (
                <Settings 
                  user={staffInfo} 
                  staff={staffList} 
                  onLogout={handleLogout}
                  onBack={handleBack}
                  onNavigate={(view) => setSubView(view)}
                />
              ) : subView === 'staff' ? (
                <StaffManagement 
                  currentUser={staffInfo}
                  onBack={handleBack}
                />
              ) : subView === 'rules' ? (
                <LoyaltyRules 
                  currentUser={staffInfo}
                  onBack={handleBack}
                />
              ) : subView === 'notifications' ? (
                <Notifications onBack={handleBack} />
              ) : subView === 'about' ? (
                <About onBack={handleBack} />
              ) : subView === 'edit-profile' ? (
                <EditProfile 
                  user={staffInfo} 
                  onBack={handleBack} 
                  onUpdate={(u) => setStaffInfo(u)}
                />
              ) : subView === 'password' ? (
                <ChangePassword user={staffInfo} onBack={handleBack} />
              ) : subView === 'lock' ? (
                <AppLockSettings onBack={handleBack} />
              ) : subView === 'sessions' ? (
                <ActiveSessions user={staffInfo} onBack={handleBack} onLogoutAll={handleLogout} />
              ) : subView === '2fa' ? (
                <TwoFactorAuth user={staffInfo} onBack={handleBack} />
              ) : subView === 'support' ? (
                <ContactSupport onBack={handleBack} />
              ) : subView === 'rewards' ? (
                <RewardCatalog currentUser={staffInfo} onBack={handleBack} />
              ) : subView === 'branches' ? (
                <BranchManagement currentUser={staffInfo} onBack={handleBack} />
              ) : subView === 'import-export' ? (
                <BulkImportExport onBack={handleBack} />
              ) : subView === 'audit-logs' ? (
                <AuditLogs onBack={handleBack} />
              ) : (
                <ComingSoon 
                  featureName={
                    subView === 'reports' ? 'রিপোর্ট ও অ্যানালিটিক্স' :
                    subView === 'theme' ? 'থিম (Theme)' :
                    subView === 'language' ? 'ভাষা (Language)' :
                    subView === 'rate' ? 'রেট অ্যাপ' :
                    subView.charAt(0).toUpperCase() + subView.slice(1)
                  } 
                  onBack={handleBack} 
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
                    initialSelectedId={scannedCustomerId}
                    onClearInitialId={() => setScannedCustomerId(null)}
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
                    onClose={handleBack}
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
                if (activeTab === tab.id && !subView) return;
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
