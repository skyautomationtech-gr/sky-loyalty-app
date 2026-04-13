import React, { useEffect, useRef, useState } from 'react';
import { BrowserQRCodeReader } from '@zxing/library';
import { ArrowLeft, Flashlight, Camera, CheckCircle2, Zap, Search, RefreshCw, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Customer } from '../types';
import Toast from './Toast';

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [scannedCustomer, setScannedCustomer] = useState<Customer | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [showFlash, setShowFlash] = useState(false);
  const [manualId, setManualId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserQRCodeReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: 'environment' } 
    })
    .then(stream => {
      stream.getTracks().forEach(t => t.stop())
      setHasPermission(true);
    })
    .catch(err => {
      console.error("Camera permission denied:", err);
      setHasPermission(false);
      setToastMsg('ক্যামেরা অনুমতি দিন: Settings → Apps → Sky Loyalty → Permissions → Camera → Allow');
      setToastType('error');
      setShowToast(true);
    })
  }, [])

  useEffect(() => {
    const startScanner = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        streamRef.current = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        const codeReader = new BrowserQRCodeReader();
        codeReaderRef.current = codeReader;

        codeReader.decodeFromVideoDevice(
          undefined, 
          videoRef.current!, 
          (result) => {
            if (result && isScanning) {
              handleSuccessfulScan(result.getText());
            }
          }
        );
      } catch (err) {
        console.error("Camera error:", err);
      }
    };

    if (isScanning && !scannedCustomer && hasPermission === true) {
      startScanner();
    }

    return () => {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [isScanning, scannedCustomer, hasPermission]);

  const handleSuccessfulScan = async (decodedText: string) => {
    if (!decodedText) return;
    setIsScanning(false);
    setIsSearching(true);
    setShowFlash(true);
    
    // Stop camera immediately on success
    if (codeReaderRef.current) codeReaderRef.current.reset();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setTimeout(() => setShowFlash(false), 500);

    if (navigator.vibrate) navigator.vibrate(200);

    try {
      const q = query(collection(db, 'customers'), where('customerId', '==', decodedText.toUpperCase()));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        const customer = { id: snap.docs[0].id, ...snap.docs[0].data() } as Customer;
        setScannedCustomer(customer);
      } else {
        setToastMsg('কাস্টমার খুঁজে পাওয়া যায়নি!');
        setToastType('error');
        setShowToast(true);
        setIsScanning(true);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setToastMsg('সার্ভার ত্রুটি হয়েছে।');
      setToastType('error');
      setShowToast(true);
      setIsScanning(true);
    } finally {
      setIsSearching(false);
    }
  };

  const toggleFlash = async () => {
    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      try {
        const newState = !isFlashOn;
        await track.applyConstraints({
          advanced: [{ torch: newState } as any]
        });
        setIsFlashOn(newState);
      } catch (err) {
        console.error("Flash error:", err);
        setToastMsg("ফ্ল্যাশ এই ডিভাইসে কাজ করছে না");
        setToastType('error');
        setShowToast(true);
      }
    }
  };

  const handleScanAgain = () => {
    setScannedCustomer(null);
    setIsScanning(true);
    setManualId('');
  };

  if (hasPermission === false) {
    return (
      <div className="fixed inset-0 bg-white z-[60] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-24 h-24 rounded-[2rem] bg-teal-primary/10 flex items-center justify-center mb-6 border border-teal-primary/10">
          <Camera className="w-12 h-12 text-teal-primary" />
        </div>
        <h2 className="text-2xl font-black text-dark-text mb-2 tracking-tight">ক্যামেরা অ্যাক্সেস দিন</h2>
        <p className="text-gray-text font-bold mb-8 text-sm leading-relaxed">QR কোড স্ক্যান করার জন্য আপনার ক্যামেরার অনুমতি প্রয়োজন। ব্রাউজার সেটিং থেকে ক্যামেরা পারমিশন এলাউ করুন।</p>
        <motion.button 
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setHasPermission(null);
            setIsScanning(true);
          }}
          className="w-full h-14 teal-gradient text-white font-black rounded-2xl shadow-xl shadow-teal-primary/20 uppercase tracking-widest"
        >
          অনুমতি দিন
        </motion.button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-[60] flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/60 to-transparent flex items-center justify-between px-6 z-20">
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={onClose} 
          className="p-3 text-white bg-white/10 rounded-2xl backdrop-blur-md border border-white/10"
        >
          <ArrowLeft className="w-6 h-6" />
        </motion.button>
        <h2 className="text-white font-black text-xs uppercase tracking-[0.3em] drop-shadow-lg">কিউআর স্ক্যানার</h2>
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={toggleFlash} 
          className={`p-3 rounded-2xl backdrop-blur-md transition-all border ${isFlashOn ? 'bg-teal-primary text-white border-teal-primary' : 'bg-white/10 text-white border-white/10'}`}
        >
          <Flashlight className="w-6 h-6" />
        </motion.button>
      </div>

      {/* Camera View */}
      <div className="flex-1 relative">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="w-full h-full object-cover"
        />
        
        {/* Scanning Overlay */}
        {isScanning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
            <div className="relative w-72 h-72">
              {/* Corners */}
              <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-teal-primary rounded-tl-[2.5rem]" />
              <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-teal-primary rounded-tr-[2.5rem]" />
              <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-teal-primary rounded-bl-[2.5rem]" />
              <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-teal-primary rounded-br-[2.5rem]" />
              
              {/* Scanning Line */}
              <motion.div 
                animate={{ top: ['5%', '95%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute left-4 right-4 h-1 bg-teal-primary shadow-[0_0_20px_rgba(0,191,166,1)] z-20 rounded-full"
              />

              {/* Pulse Frame */}
              <motion.div 
                animate={{ opacity: [0.1, 0.4, 0.1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-4 bg-teal-primary/10 rounded-[2rem]"
              />
            </div>
            <p className="mt-12 text-white font-black text-xs uppercase tracking-[0.3em] bg-black/40 px-8 py-3 rounded-2xl backdrop-blur-md border border-white/10">
              QR কোড ফ্রেমে ধরুন
            </p>
          </div>
        )}

        {/* Flash Effect */}
        <AnimatePresence>
          {showFlash && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-teal-primary/30 z-30"
            />
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Section */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-2xl flex flex-col items-center justify-center p-10 text-center z-20 rounded-t-[3.5rem] border-t border-white/10">
        <div className="w-full max-w-sm space-y-5">
          <div className="flex items-center gap-2 text-white/40 mb-1 justify-center">
            <Search className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">ম্যানুয়াল আইডি সার্চ</span>
          </div>
          <div className="flex gap-3">
            <input 
              type="text" 
              placeholder="SKY-00001 লিখুন..." 
              value={manualId}
              onChange={(e) => setManualId(e.target.value)}
              className="flex-1 h-14 bg-white/10 border border-white/20 rounded-2xl px-6 text-white font-bold placeholder:text-white/20 focus:outline-none focus:border-teal-primary focus:ring-4 focus:ring-teal-primary/10 transition-all text-sm"
            />
            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSuccessfulScan(manualId)}
              disabled={!manualId || isSearching}
              className="h-14 px-8 teal-gradient text-white font-black rounded-2xl shadow-xl shadow-teal-primary/20 disabled:opacity-50 transition-all flex items-center justify-center"
            >
              {isSearching ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'খুঁজুন'}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Success Popup */}
      <AnimatePresence>
        {scannedCustomer && (
          <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 backdrop-blur-sm p-6">
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="w-full max-w-[430px] bg-white rounded-[3rem] p-8 shadow-2xl space-y-8 border border-bg-light relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />
              
              <div className="flex items-center gap-5 relative z-10">
                <div className="w-20 h-20 rounded-[2rem] bg-teal-primary/10 flex items-center justify-center border-4 border-white shadow-xl">
                  <CheckCircle2 className="w-12 h-12 text-teal-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-dark-text tracking-tight">{scannedCustomer.name}</h3>
                  <p className="text-[10px] font-black text-gray-text uppercase tracking-[0.3em] mt-1">{scannedCustomer.customerId}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 relative z-10">
                <div className="p-5 bg-bg-light rounded-[2rem] border border-bg-light">
                  <p className="text-[9px] font-black text-gray-text uppercase tracking-widest mb-2">বর্তমান টিয়ার</p>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-teal-primary fill-teal-primary" />
                    <span className="text-sm font-black text-dark-text">{scannedCustomer.tier}</span>
                  </div>
                </div>
                <div className="p-5 bg-bg-light rounded-[2rem] border border-bg-light">
                  <p className="text-[9px] font-black text-gray-text uppercase tracking-widest mb-2">মোট পয়েন্ট</p>
                  <p className="text-sm font-black text-dark-text">{scannedCustomer.points.toLocaleString()}</p>
                </div>
              </div>

              <div className="space-y-4 pt-2 relative z-10">
                <motion.button 
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onScan(scannedCustomer.customerId)}
                  className="w-full h-14 teal-gradient text-white font-black rounded-2xl shadow-xl shadow-teal-primary/20 uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all"
                >
                  <span>প্রোফাইল দেখুন</span>
                  <ArrowLeft className="w-5 h-5 rotate-180" />
                </motion.button>
                <motion.button 
                  whileTap={{ scale: 0.98 }}
                  onClick={handleScanAgain}
                  className="w-full h-14 bg-bg-light text-dark-text font-black rounded-2xl uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  আবার স্ক্যান করুন
                </motion.button>
              </div>

              <button 
                onClick={onClose}
                className="absolute top-6 right-6 p-2 bg-bg-light rounded-full text-gray-text hover:text-dark-text transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Toast 
        show={showToast} 
        message={toastMsg} 
        type={toastType} 
        onClose={() => setShowToast(false)} 
      />
    </div>
  );
}
