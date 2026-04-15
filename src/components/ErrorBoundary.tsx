import * as React from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends (React.Component as any) {
  constructor(props: any) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: any) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-24 h-24 rounded-[2.5rem] bg-danger-red/10 flex items-center justify-center mb-6 border border-danger-red/10"
          >
            <AlertTriangle className="w-12 h-12 text-danger-red" />
          </motion.div>
          <h2 className="text-2xl font-black text-dark-text mb-2 tracking-tight">দুঃখিত, সমস্যা হয়েছে!</h2>
          <p className="text-gray-text font-bold mb-8 text-sm leading-relaxed">
            অ্যাপটি লোড করতে সমস্যা হচ্ছে। অনুগ্রহ করে আবার চেষ্টা করুন।
          </p>
          <motion.button 
            whileTap={{ scale: 0.98 }}
            onClick={this.handleRetry}
            className="w-full max-w-xs h-14 teal-gradient text-white font-black rounded-2xl shadow-xl shadow-teal-primary/20 flex items-center justify-center gap-3 uppercase tracking-widest"
          >
            <RefreshCw className="w-5 h-5" />
            আবার চেষ্টা করুন
          </motion.button>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
