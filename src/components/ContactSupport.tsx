import React from 'react';
import { ArrowLeft, Phone, MessageCircle, Mail, Heart, ExternalLink, MapPin } from 'lucide-react';
import { motion } from 'motion/react';

interface ContactSupportProps {
  onBack: () => void;
}

export default function ContactSupport({ onBack }: ContactSupportProps) {
  const contacts = [
    { 
      icon: Phone, 
      label: 'সরাসরি কল', 
      value: '01967017506', 
      href: 'tel:01967017506', 
      color: 'bg-blue-500' 
    },
    { 
      icon: MessageCircle, 
      label: 'হোয়াটসঅ্যাপ', 
      value: '01577351518', 
      href: 'https://wa.me/8801577351518', 
      color: 'bg-green-500' 
    },
    { 
      icon: Mail, 
      label: 'ইমেইল করুন', 
      value: 'skyautomationtech@gmail.com', 
      href: 'mailto:skyautomationtech@gmail.com', 
      color: 'bg-orange-500' 
    },
  ];

  return (
    <div className="flex flex-col h-full bg-bg-light">
      <header className="flex items-center gap-3 py-4 px-2">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-text hover:text-teal-primary transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-black text-dark-text">সাপোর্ট সেন্টার</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-2 pb-24">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-bg-light rounded-[2.5rem] p-8 text-center shadow-sm mb-6"
        >
          <div className="w-24 h-24 mx-auto bg-teal-primary rounded-[2rem] flex items-center justify-center mb-6 shadow-xl shadow-teal-primary/20 rotate-3 group hover:rotate-0 transition-transform duration-500">
            <Heart className="w-12 h-12 text-white fill-white" />
          </div>
          <h2 className="text-2xl font-black text-dark-text mb-2">Sky Automation Tech</h2>
          <p className="text-sm font-bold text-gray-text mb-8">আমরা ২৪/৭ আপনার সেবায় নিয়োজিত</p>

          <div className="space-y-4">
            {contacts.map((contact, i) => (
              <motion.a
                key={i}
                href={contact.href}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center justify-between p-5 bg-bg-light rounded-2xl border border-transparent hover:border-teal-primary/20 active:scale-95 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl ${contact.color} flex items-center justify-center text-white shadow-lg shadow-black/5 group-hover:scale-110 transition-transform`}>
                    <contact.icon className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-black text-dark-text uppercase tracking-widest mb-0.5">{contact.label}</p>
                    <p className="text-sm font-black text-gray-text break-all">{contact.value}</p>
                  </div>
                </div>
                <ExternalLink className="w-5 h-5 text-gray-text/30 group-hover:text-teal-primary transition-colors shrink-0 ml-2" />
              </motion.a>
            ))}
          </div>

          <div className="mt-8 pt-8 border-t border-bg-light">
            <div className="flex items-center gap-4 p-4 bg-bg-light rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-teal-primary/10 flex items-center justify-center text-teal-primary shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black text-dark-text uppercase tracking-widest">ঠিকানা</p>
                <p className="text-xs font-bold text-gray-text">ঢাকা, বাংলাদেশ</p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="text-center py-4">
          <p className="text-[10px] font-black text-gray-text uppercase tracking-[0.2em]">Sky Automation Tech 🛠️</p>
        </div>
      </div>
    </div>
  );
}
