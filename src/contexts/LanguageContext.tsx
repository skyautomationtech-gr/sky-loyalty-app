import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'bn' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    dashboard: 'Dashboard',
    customers: 'Customers',
    add_customer: 'Add Customer',
    scanner: 'Scanner',
    profile: 'Profile',
    points: 'Points',
    tier: 'Tier',
    search: 'Search...',
    logout: 'Logout',
    settings: 'Settings',
    staff: 'Staff Management',
    rules: 'Loyalty Rules',
    notifications: 'Notifications',
    about: 'About',
    edit_profile: 'Edit Profile',
    change_password: 'Change Password',
    app_lock: 'App Lock',
    sessions: 'Active Sessions',
    support: 'Support',
    rewards: 'Rewards',
    branches: 'Branches',
    import_export: 'Import/Export',
    reports: 'Reports',
    total_points: 'Total Points',
    current_tier: 'Current Tier',
    next_tier_progress: 'Next Tier Progress',
    transaction_history: 'Transaction History',
    points_management: 'Points Management',
    add_points: 'Add Points',
    redeem_points: 'Redeem Points',
    money_to_points: 'Money to Points',
    direct_points: 'Direct Points',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    name: 'Name',
    phone: 'Phone',
    address: 'Address',
    id: 'ID',
    last_visit: 'Last Visit',
    joined_at: 'Joined At',
    welcome: 'Welcome',
    login: 'Login',
    select_role: 'Select Role',
    admin: 'Admin',
    staff_member: 'Staff',
    forgot_password: 'Forgot Password?',
    verification: 'Verification',
    verify: 'Verify',
    resend: 'Resend',
    code_sent: 'Code sent to',
    new_password: 'New Password',
    confirm_password: 'Confirm Password',
    update_password: 'Update Password',
    success: 'Success',
    error: 'Error',
    loading: 'Loading...',
    no_data: 'No data found',
    scan_qr: 'Scan QR Code',
    manual_search: 'Manual Search',
    audit_logs: 'Audit Logs',
    analytics: 'Analytics',
    language: 'Language',
    theme: 'Theme',
  },
  bn: {
    dashboard: 'ড্যাশবোর্ড',
    customers: 'কাস্টমার',
    add_customer: 'কাস্টমার যোগ করুন',
    scanner: 'স্ক্যানার',
    profile: 'প্রোফাইল',
    points: 'পয়েন্ট',
    tier: 'টিয়ার',
    search: 'খুঁজুন...',
    logout: 'লগআউট',
    settings: 'সেটিংস',
    staff: 'স্টাফ ম্যানেজমেন্ট',
    rules: 'লয়্যালটি রুলস',
    notifications: 'নোটিফিকেশন',
    about: 'সম্পর্কে',
    edit_profile: 'প্রোফাইল এডিট',
    change_password: 'পাসওয়ার্ড পরিবর্তন',
    app_lock: 'অ্যাপ লক',
    sessions: 'অ্যাক্টিভ সেশন',
    support: 'সাপোর্ট',
    rewards: 'রিওয়ার্ডস',
    branches: 'ব্রাঞ্চ',
    import_export: 'ইমপোর্ট/এক্সপোর্ট',
    reports: 'রিপোর্ট',
    total_points: 'মোট পয়েন্ট',
    current_tier: 'বর্তমান টিয়ার',
    next_tier_progress: 'পরবর্তী টিয়ার প্রগ্রেস',
    transaction_history: 'লেনদেনের ইতিহাস',
    points_management: 'পয়েন্ট ম্যানেজমেন্ট',
    add_points: 'পয়েন্ট যোগ করুন',
    redeem_points: 'পয়েন্ট রিডিম করুন',
    money_to_points: 'টাকা থেকে পয়েন্ট',
    direct_points: 'সরাসরি পয়েন্ট',
    save: 'সেভ করুন',
    cancel: 'বাতিল',
    delete: 'ডিলিট',
    edit: 'এডিট',
    name: 'নাম',
    phone: 'ফোন',
    address: 'ঠিকানা',
    id: 'আইডি',
    last_visit: 'শেষ ভিজিট',
    joined_at: 'যোগদান',
    welcome: 'স্বাগতম',
    login: 'লগইন',
    select_role: 'রোল বেছে নিন',
    admin: 'অ্যাডমিন',
    staff_member: 'স্টাফ',
    forgot_password: 'পাসওয়ার্ড ভুলে গেছেন?',
    verification: 'ভেরিফিকেশন',
    verify: 'ভেরিফাই করুন',
    resend: 'আবার পাঠান',
    code_sent: 'কোড পাঠানো হয়েছে',
    new_password: 'নতুন পাসওয়ার্ড',
    confirm_password: 'পাসওয়ার্ড নিশ্চিত করুন',
    update_password: 'পাসওয়ার্ড আপডেট করুন',
    success: 'সফল',
    error: 'ত্রুটি',
    loading: 'লোড হচ্ছে...',
    no_data: 'কোনো তথ্য পাওয়া যায়নি',
    scan_qr: 'QR কোড স্ক্যান করুন',
    manual_search: 'ম্যানুয়াল সার্চ',
    audit_logs: 'অডিট লগ',
    analytics: 'অ্যানালিটিক্স',
    language: 'ভাষা',
    theme: 'থিম',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('sky_app_lang') as Language) || 'bn';
  });

  useEffect(() => {
    localStorage.setItem('sky_app_lang', language);
  }, [language]);

  const t = (key: string): string => {
    return (translations[language] as any)[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
