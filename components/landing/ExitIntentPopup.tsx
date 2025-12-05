'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface ExitIntentPopupProps {
  onClose: () => void;
  onClaimDiscount: () => void;
}

export function ExitIntentPopup({ onClose, onClaimDiscount }: ExitIntentPopupProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl p-8 md:p-10 max-w-md w-full shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
          aria-label="Close popup"
        >
          <X className="w-6 h-6" />
        </button>
        
        <div className="text-center">
          <div className="mb-4">
            <span className="text-4xl">⚡</span>
          </div>
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
            Wait! Before You Go...
          </h3>
          <p className="text-slate-300 mb-6 leading-relaxed">
            Get <strong className="text-white">20% off</strong> your first year
          </p>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 mb-6">
            <p className="text-sm text-slate-400 mb-2">Use code:</p>
            <p className="text-2xl font-bold text-white font-mono">PRACTICE20</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onClaimDiscount}
              className="flex-1 px-6 py-3 bg-white text-slate-900 rounded-xl font-semibold hover:bg-slate-100 transition-all shadow-lg"
            >
              Claim My Discount
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-slate-800/50 border border-slate-700/50 text-slate-300 rounded-xl font-medium hover:bg-slate-800/70 hover:border-slate-600/50 transition-all"
            >
              No Thanks
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function useExitIntent(hasSession: boolean = false) {
  const [showPopup, setShowPopup] = useState(false);
  const [hasShownPopup, setHasShownPopup] = useState(false);

  useEffect(() => {
    // Don't show popup for logged-in users
    if (hasSession) return;
    
    // Check if user has already seen the popup (using sessionStorage)
    if (typeof window === 'undefined') return;
    
    const hasSeenPopup = sessionStorage.getItem('exitIntentShown');
    if (hasSeenPopup) {
      setHasShownPopup(true);
      return;
    }

    const handleMouseLeave = (e: MouseEvent) => {
      // Only trigger if mouse leaves from the top of the page
      if (e.clientY <= 0 && !hasShownPopup && !showPopup) {
        setShowPopup(true);
        sessionStorage.setItem('exitIntentShown', 'true');
        setHasShownPopup(true);
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [hasShownPopup, showPopup, hasSession]);

  const handleClose = () => {
    setShowPopup(false);
  };

  return {
    showPopup,
    handleClose,
  };
}


