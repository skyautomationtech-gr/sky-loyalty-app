import React, { memo } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Customer } from '../types';

interface CustomerCardProps {
  customer: Customer;
  id?: string; // For html2canvas targeting
}

function CustomerCard({ customer, id }: CustomerCardProps) {
  return (
    <div 
      id={id}
      className="relative w-full aspect-[1.586/1] bg-[#0D0D0D] rounded-[1.5rem] overflow-hidden shadow-[0_10px_30px_rgba(201,168,76,0.2)] border border-[rgba(201,168,76,0.2)] group"
    >
      {/* Polygon Texture Overlay */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M0 0 L100 0 L100 100 L0 100 Z" fill="url(#poly-grid)" />
          <defs>
            <pattern id="poly-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M0 20 L10 0 L20 20 Z" fill="none" stroke="#333333" strokeWidth="0.5" />
            </pattern>
          </defs>
        </svg>
      </div>

      {/* Gold Wave Decoration */}
      <div className="absolute top-0 right-0 h-full w-1/2 pointer-events-none overflow-hidden">
        <svg className="h-full w-full" viewBox="0 0 200 400" preserveAspectRatio="none">
          {/* Layered Curves */}
          <path 
            d="M200 0 C150 100 100 200 200 400 L200 400 L200 0 Z" 
            fill="#A67C3A" 
            className="animate-shimmer"
          />
          <path 
            d="M200 0 C120 120 80 280 200 400 L200 400 L200 0 Z" 
            fill="#C9A84C" 
            className="animate-shimmer delay-100"
          />
          <path 
            d="M200 0 C100 150 50 300 200 400 L200 400 L200 0 Z" 
            fill="#E8C96D" 
            className="animate-shimmer delay-200"
          />
          
          {/* Dot Texture on Gold */}
          <defs>
            <pattern id="gold-dots" width="4" height="4" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.5" fill="rgba(0,0,0,0.1)" />
            </pattern>
            <mask id="wave-mask">
              <path d="M200 0 C100 150 50 300 200 400 L200 400 L200 0 Z" fill="#FFFFFF" />
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="url(#gold-dots)" mask="url(#wave-mask)" />
        </svg>
      </div>

      {/* Content */}
      <div className="relative h-full p-6 flex flex-col justify-between z-10">
        {/* Top Left */}
        <div>
          <p className="text-[10px] text-[rgba(255,255,255,0.6)] font-light tracking-[2px] uppercase">
            Sky Automation Tech
          </p>
        </div>

        {/* Center Left */}
        <div className="space-y-1">
          <h3 className="text-2xl font-black text-[#C9A84C] tracking-[1px] uppercase">
            MEMBER CARD
          </h3>
          <p className="text-sm text-white font-medium tracking-[2px] uppercase truncate max-w-[60%]">
            {customer.name}
          </p>
        </div>

        {/* Middle Left - ID */}
        <div>
          <p className="text-xl font-bold text-[#C9A84C] tracking-[4px] font-mono">
            {customer.customerId}
          </p>
        </div>

        {/* Bottom Section */}
        <div className="flex items-end justify-between">
          <div className="flex gap-6">
            <div className="space-y-0.5">
              <p className="text-[8px] text-[rgba(255,255,255,0.4)] font-bold uppercase tracking-widest">Phone</p>
              <p className="text-[10px] text-white font-medium">{customer.phone}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[8px] text-[rgba(255,255,255,0.4)] font-bold uppercase tracking-widest">Tier</p>
              <span className="px-2 py-0.5 rounded-full bg-[rgba(201,168,76,0.2)] border border-[rgba(201,168,76,0.3)] text-[8px] text-[#C9A84C] font-black uppercase tracking-wider">
                {customer.tier}
              </span>
            </div>
            <div className="space-y-0.5">
              <p className="text-[8px] text-[rgba(255,255,255,0.4)] font-bold uppercase tracking-widest">Points</p>
              <p className="text-[10px] text-[#C9A84C] font-black">{customer.points.toLocaleString()}</p>
            </div>
          </div>

          {/* QR Code */}
          <div className="bg-white p-1 rounded-lg shadow-lg">
            <QRCodeCanvas 
              value={customer.customerId} 
              size={52} 
              level="H"
              includeMargin={false}
            />
          </div>
        </div>
      </div>

      {/* Shimmer Animation Style */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shimmer {
          0% { opacity: 0.8; transform: translateX(0); }
          50% { opacity: 1; transform: translateX(2px); }
          100% { opacity: 0.8; transform: translateX(0); }
        }
        .animate-shimmer {
          animation: shimmer 3s ease-in-out infinite;
        }
        .delay-100 { animation-delay: 0.5s; }
        .delay-200 { animation-delay: 1s; }
      `}} />
    </div>
  );
}

export default memo(CustomerCard);
