import React, { useEffect, useRef, useState, memo } from 'react';
import { BrowserQRCodeReader } from '@zxing/library';
import { ArrowLeft, Flashlight, Camera, CheckCircle2, Zap, Search, RefreshCw, Sparkles, X, ScanLine, Focus, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Customer } from '../types';
import Toast from './Toast';

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

function QRScanner({ onScan, onClose }: QRScannerProps) {
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
    const startScanner = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('ক্যামেরা এই ব্রাউজারে সাপোর্ট করে না');
        }

        setHasPermission(null);
        
        const requestCamera = async () => {
          try {
            const stream = await navigator.mediaDevices
              .getUserMedia({ 
                video: { 
                  facingMode: 'environment',
                  width: { ideal: 1280 },
                  height: { ideal: 720 }
                } 
              });
            return stream;
          } catch (err: any) {
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
              alert('ক্যামেরা অনুমতি দিন:\nSettings → Site Settings → Camera → Allow');
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
              alert('ক্যামেরা পাওয়া যাচ্ছে না!');
            }
            return null;
          }
        };

        const stream = await requestCamera();
        
        if (!stream) {
          setHasPermission(false);
          return;
        }

        streamRef.current = stream;
        setHasPermission(true);
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try {
            await videoRef.current.play();
          } catch (playErr) {
            console.warn("Autoplay blocked, user interaction might be needed:", playErr);
          }
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
      } catch (err: any) {
        console.error("Camera error:", err);
        setHasPermission(false);
      }
    };

    if (isScanning && !scannedCustomer) {
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
  }, [isScanning, scannedCustomer]);

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
        <div className="w-32 h-32 rounded-full bg-teal-primary/10 flex items-center justify-center mb-6">
          <Camera className="w-16 h-16 text-teal-primary" />
        </div>
        <h2 className="text-2xl font-black text-dark-text mb-2 tracking-tight">ক্যামেরা অনুমতি দরকার</h2>
        <p className="text-gray-text font-bold mb-8 text-sm leading-relaxed">
          QR কোড স্ক্যান করতে ক্যামেরা অ্যাক্সেস দিন
        </p>
        <div className="w-full space-y-3">
          <motion.button 
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setHasPermission(null);
              setIsScanning(true);
            }}
            className="w-full h-14 bg-[#00BFA6] text-white font-black rounded-2xl shadow-xl shadow-teal-primary/20 uppercase tracking-widest"
          >
            অনুমতি দিন
          </motion.button>
          
          <p className="text-xs text-gray-text mt-4">
            যদি কাজ না করে: Settings → Site Settings → Camera → Allow
          </p>
          
          <button 
            onClick={onClose}
            className="w-full h-14 text-gray-text font-bold text-sm mt-4"
          >
            ফিরে যান
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-[60] overflow-hidden font-sans">
      {/* Camera View */}
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted 
        className="absolute inset-0 w-full h-full object-cover"
      />
      
      {/* HUD Overlay */}
      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
        {/* Cutout using box-shadow */}
        <div className="relative w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] rounded-[3rem] shadow-[0_0_0_9999px_rgba(0,0,0,0.7)] border-2 border-white/10 overflow-hidden">
          
          {/* Animated Corner Brackets */}
          <motion.div 
            animate={{ scale: [1, 1.05, 1] }} 
            transition={{ duration: 2, repeat: Infinity }} 
            className="absolute inset-0"
          >
            <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-teal-primary rounded-tl-[3rem]" />
            <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-teal-primary rounded-tr-[3rem]" />
            <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-teal-primary rounded-bl-[3rem]" />
            <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-teal-primary rounded-br-[3rem]" />
          </motion.div>

          {/* Laser Scan Line */}
          {isScanning && (
            <motion.div 
              animate={{ top: ['0%', '100%', '0%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute left-0 right-0 h-[2px] bg-teal-primary shadow-[0_0_20px_4px_rgba(0,191,166,0.6)] z-20"
            />
          )}

          {/* Center Reticle */}
          <div className="absolute inset-0 flex items-center justify-center opacity-30">
            <Focus className="w-16 h-16 text-teal-primary" />
          </div>
        </div>
        
        {isScanning && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 flex items-center gap-3 bg-black/50 backdrop-blur-md px-6 py-3 rounded-full border border-white/10"
          >
            <div className="w-2 h-2 rounded-full bg-teal-primary animate-pulse" />
            <span className="text-white font-black text-xs uppercase tracking-[0.3em]">স্ক্যান করা হচ্ছে...</span>
          </motion.div>
        )}
      </div>

      {/* Top Floating Bar */}
      <div className="absolute top-8 left-0 right-0 flex justify-center px-6 z-20">
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-full px-2 py-2 flex items-center gap-6 shadow-2xl">
          <motion.button 
            whileTap={{ scale: 0.9 }} 
            onClick={onClose} 
            className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
          <div className="flex flex-col items-center px-4">
            <span className="text-white font-black text-xs uppercase tracking-[0.3em]">Scanner</span>
            <span className="text-teal-primary text-[9px] font-bold tracking-widest">SYSTEM ACTIVE</span>
          </div>
          <motion.button 
            whileTap={{ scale: 0.9 }} 
            onClick={toggleFlash} 
            className={`w-12 h-12 flex items-center justify-center rounded-full transition-colors ${isFlashOn ? 'bg-teal-primary text-white shadow-[0_0_15px_rgba(0,191,166,0.5)]' : 'bg-white/10 hover:bg-white/20 text-white'}`}
          >
            <Flashlight className="w-5 h-5" />
          </motion.button>
        </div>
      </div>

      {/* Flash Effect */}
      <AnimatePresence>
        {showFlash && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-teal-primary/30 z-30 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Bottom Floating Panel */}
      <div className="absolute bottom-8 left-4 right-4 z-20">
        <div className="bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-5 shadow-2xl max-w-sm mx-auto">
          <div className="flex items-center gap-2 mb-4 justify-center">
            <ScanLine className="w-4 h-4 text-teal-primary" />
            <span className="text-white text-[10px] font-black uppercase tracking-[0.2em]">ম্যানুয়াল এন্ট্রি</span>
          </div>
          <div className="relative w-full">
            <input 
              type="text" 
              placeholder="SKY-00001" 
              value={manualId}
              onChange={(e) => setManualId(e.target.value.toUpperCase())}
              className="w-full h-14 bg-white/10 border border-white/20 rounded-2xl pl-5 pr-[100px] text-white font-black tracking-widest placeholder:text-white/30 focus:outline-none focus:border-teal-primary focus:bg-white/20 transition-all text-sm uppercase"
            />
            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSuccessfulScan(manualId)}
              disabled={!manualId || isSearching}
              className="absolute right-1.5 top-1.5 bottom-1.5 w-[85px] bg-teal-primary text-white font-black rounded-xl shadow-[0_0_15px_rgba(0,191,166,0.4)] disabled:opacity-50 transition-all flex items-center justify-center text-xs"
            >
              {isSearching ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'খুঁজুন'}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Success Popup */}
      <AnimatePresence>
        {scannedCustomer && (
          <div className="absolute inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-[380px] bg-white rounded-[3rem] p-1 shadow-2xl relative overflow-hidden"
            >
              <div className="bg-bg-light rounded-[2.8rem] p-8 relative overflow-hidden">
                {/* Decorative Background */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-teal-primary/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-teal-primary/20 rounded-full blur-3xl" />
                
                <button 
                  onClick={handleScanAgain} 
                  className="absolute top-6 right-6 p-2 bg-white rounded-full text-gray-text hover:text-dark-text shadow-sm z-20 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex flex-col items-center text-center relative z-10 mt-4">
                  <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center border-4 border-teal-primary/20 shadow-xl mb-6 relative">
                    <div className="absolute inset-0 rounded-full border-4 border-teal-primary border-t-transparent animate-spin" style={{ animationDuration: '3s' }} />
                    <CheckCircle2 className="w-12 h-12 text-teal-primary" />
                  </div>
                  
                  <h3 className="text-3xl font-black text-dark-text tracking-tight mb-1">{scannedCustomer.name}</h3>
                  <div className="bg-white px-4 py-1.5 rounded-full border border-bg-light shadow-sm inline-flex items-center gap-2 mb-8">
                    <div className="w-2 h-2 rounded-full bg-teal-primary animate-pulse" />
                    <p className="text-[10px] font-black text-gray-text uppercase tracking-[0.2em]">{scannedCustomer.customerId}</p>
                  </div>

                  <div className="w-full grid grid-cols-2 gap-3 mb-8">
                    <div className="bg-white p-4 rounded-3xl border border-bg-light shadow-sm flex flex-col items-center justify-center">
                      <Zap className="w-5 h-5 text-teal-primary mb-2" />
                      <p className="text-[9px] font-black text-gray-text uppercase tracking-widest mb-1">টিয়ার</p>
                      <span className="text-sm font-black text-dark-text">{scannedCustomer.tier}</span>
                    </div>
                    <div className="bg-white p-4 rounded-3xl border border-bg-light shadow-sm flex flex-col items-center justify-center">
                      <Sparkles className="w-5 h-5 text-yellow-500 mb-2" />
                      <p className="text-[9px] font-black text-gray-text uppercase tracking-widest mb-1">পয়েন্ট</p>
                      <p className="text-sm font-black text-dark-text">{scannedCustomer.points.toLocaleString()}</p>
                    </div>
                  </div>

                  <motion.button 
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onScan(scannedCustomer.customerId)}
                    className="w-full h-16 teal-gradient text-white font-black rounded-2xl shadow-xl shadow-teal-primary/30 uppercase tracking-widest flex items-center justify-center gap-3"
                  >
                    <span>প্রোফাইল দেখুন</span>
                    <ArrowLeft className="w-5 h-5 rotate-180" />
                  </motion.button>
                </div>
              </div>
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

export default memo(QRScanner);
