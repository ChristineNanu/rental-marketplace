import React from 'react';

const CATEGORY_ICONS = ['🔧', '⛺', '🔊', '🏠', '🅿️', '📷'];

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="page-bg min-h-screen flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 rounded-3xl overflow-hidden shadow-card">
        <div className="hidden md:flex flex-col justify-between bg-gradient-to-br from-amber-500 to-amber-700 p-10 text-white">
          <div>
            <p className="text-2xl font-black tracking-tight">📦 RentIt Nairobi</p>
            <p className="text-amber-100 mt-4 text-lg leading-relaxed">
              Borrow the drill instead of buying one. List the tent you use twice a year.
              Rent out the parking spot you're not using today.
            </p>
          </div>
          <div className="flex gap-3 text-2xl">
            {CATEGORY_ICONS.map((icon, i) => (
              <span key={i} className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center">{icon}</span>
            ))}
          </div>
        </div>
        <div className="bg-white p-8 sm:p-10 flex flex-col justify-center">
          <h1 className="text-2xl font-black text-slate-900 mb-1">{title}</h1>
          <p className="text-slate-500 text-sm mb-6">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
