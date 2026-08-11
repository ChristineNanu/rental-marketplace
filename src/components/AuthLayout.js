import React from 'react';

const ITEMS = [
  { icon: '🔧', label: 'Tools',         delay: '0s' },
  { icon: '⛺', label: 'Camping Gear',  delay: '0.4s' },
  { icon: '🔊', label: 'Event Gear',    delay: '0.8s' },
  { icon: '🏠', label: 'Spare Rooms',   delay: '1.2s' },
  { icon: '🅿️', label: 'Parking',       delay: '1.6s' },
  { icon: '📷', label: 'Electronics',   delay: '2.0s' },
];

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="page-bg min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 rounded-3xl overflow-hidden shadow-[0_32px_80px_-16px_rgba(0,0,0,0.2)] animate-scale-in">

        {/* Left panel */}
        <div className="hidden md:flex flex-col justify-between p-10 text-white relative overflow-hidden"
          style={{ background: 'linear-gradient(145deg, #1e293b 0%, #334155 50%, #1e293b 100%)' }}>
          {/* Amber glow */}
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #f59e0b, transparent 70%)', transform: 'translate(30%, -30%)' }} />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #fbbf24, transparent 70%)', transform: 'translate(-30%, 30%)' }} />

          <div className="relative">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/40">
                <span className="text-xl">📦</span>
              </div>
              <span className="font-black text-xl tracking-tight">
                RentIt <span className="text-amber-400">Nairobi</span>
              </span>
            </div>
            <h2 className="text-2xl font-black leading-snug mb-3">
              Borrow the drill.<br />
              <span className="text-amber-400">Not the price tag.</span>
            </h2>
            <p className="text-slate-400 leading-relaxed text-sm">
              List the tent you use twice a year. Rent out the parking spot you're not using today.
              Peer-to-peer rentals, right in your neighbourhood.
            </p>
          </div>

          {/* Floating category icons */}
          <div className="relative grid grid-cols-3 gap-3">
            {ITEMS.map((item) => (
              <div
                key={item.icon}
                className="flex flex-col items-center gap-1.5 bg-white/8 rounded-2xl p-3 border border-white/10"
                style={{ animation: `float 3s ease-in-out infinite`, animationDelay: item.delay }}
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="text-[10px] font-bold text-slate-400 text-center">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="bg-white p-8 sm:p-10 flex flex-col justify-center">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-6 md:hidden">
            <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center">
              <span>📦</span>
            </div>
            <span className="font-black text-slate-900">RentIt <span className="text-amber-500">Nairobi</span></span>
          </div>

          <h1 className="text-2xl font-black text-slate-900 mb-1">{title}</h1>
          <p className="text-slate-500 text-sm mb-7">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
