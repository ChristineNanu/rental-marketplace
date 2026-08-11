import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../constants';
import ListingThumb from './ListingThumb';

const CATEGORIES = [
  { icon: '🔧', name: 'Tools',          desc: 'Drills, saws, ladders' },
  { icon: '⛺', name: 'Camping Gear',   desc: 'Tents, sleeping bags' },
  { icon: '🔊', name: 'Event Gear',     desc: 'Speakers, lighting' },
  { icon: '📷', name: 'Electronics',    desc: 'Cameras, projectors' },
  { icon: '🏠', name: 'Spare Rooms',    desc: 'Short-term stays' },
  { icon: '🅿️', name: 'Parking Spots', desc: 'Daily & monthly' },
];

const HOW_IT_WORKS = [
  { step: '01', icon: '🔍', title: 'Browse listings',    desc: 'Search by area and category. Filter by price. Find exactly what you need in Nairobi.' },
  { step: '02', icon: '📅', title: 'Request to rent',    desc: 'Pick your dates, send a request. The owner accepts and you pay securely via M-Pesa.' },
  { step: '03', icon: '🤝', title: 'Pick up & enjoy',    desc: 'Collect the item, use it, return it. Deposit is refunded once the owner confirms return.' },
];

const TRUST_STATS = [
  { value: '500+', label: 'Items listed' },
  { value: 'KES 0', label: 'Listing fee' },
  { value: '2-way', label: 'Rating system' },
  { value: 'M-Pesa', label: 'Secure payments' },
];

function FeaturedCard({ listing, onClick, delay }) {
  return (
    <div
      onClick={onClick}
      style={{ animationDelay: `${delay}ms` }}
      className="card overflow-hidden cursor-pointer group animate-fade-up"
    >
      <div className="relative overflow-hidden">
        <ListingThumb
          photos={listing.photos}
          alt={listing.title}
          className="w-full aspect-[4/3] group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <span className="absolute bottom-3 left-3 badge bg-white/90 backdrop-blur-sm text-slate-700 shadow-sm text-xs font-black">
          📍 {listing.area?.name}
        </span>
      </div>
      <div className="p-5">
        <p className="text-xs font-black text-amber-600 uppercase tracking-widest mb-1">{listing.category?.name}</p>
        <h3 className="font-black text-slate-900 mb-1 line-clamp-1 group-hover:text-amber-600 transition-colors duration-200">
          {listing.title}
        </h3>
        <p className="text-sm text-slate-500 line-clamp-2 mb-3">{listing.description}</p>
        <div className="flex items-center justify-between">
          <span className="font-black text-slate-900">KES {listing.price_per_day?.toLocaleString()}<span className="text-xs text-slate-400 font-normal">/day</span></span>
          <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">View →</span>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [featured, setFeatured] = useState([]);
  const statsRef = useRef(null);
  const [, setStatsVisible] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/listings?limit=6`)
      .then(r => r.json())
      .then(data => setFeatured(Array.isArray(data) ? data.slice(0, 6) : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen" style={{ background: '#0f172a' }}>

      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-white/5 backdrop-blur-xl bg-slate-900/80">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2.5 bg-transparent border-0 cursor-pointer">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <span className="text-lg">📦</span>
            </div>
            <span className="font-black text-white text-lg tracking-tight">
              RentIt <span className="text-amber-400">Nairobi</span>
            </span>
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/browse')}
              className="text-sm font-bold text-slate-400 hover:text-white transition-colors duration-200 bg-transparent border-0 cursor-pointer hidden sm:block"
            >Browse</button>
            <button
              onClick={() => navigate('/login')}
              className="text-sm font-bold text-slate-300 bg-white/10 hover:bg-white/15 border border-white/10 px-4 py-2 rounded-xl cursor-pointer transition-all duration-200"
            >Sign in</button>
            <button
              onClick={() => navigate('/register')}
              className="btn-primary text-sm px-4 py-2"
            >Get started</button>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-20 pb-32 px-6">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl"
            style={{ background: 'radial-gradient(circle, #f59e0b, transparent 70%)' }} />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full opacity-10 blur-3xl"
            style={{ background: 'radial-gradient(circle, #fbbf24, transparent 70%)' }} />
          {/* Grid lines */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full mb-8 animate-fade-up">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Now live in Kilimani, Nairobi
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.05] mb-6 animate-fade-up" style={{ animationDelay: '80ms' }}>
            Borrow instead<br />
            of <span className="relative inline-block">
              <span className="relative z-10 text-transparent bg-clip-text"
                style={{ backgroundImage: 'linear-gradient(135deg, #f59e0b, #fbbf24, #f59e0b)', backgroundSize: '200%', animation: 'gradientShift 3s ease infinite' }}>
                buying.
              </span>
              <span className="absolute -bottom-1 left-0 right-0 h-1 rounded-full bg-amber-500/40" />
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-up" style={{ animationDelay: '160ms' }}>
            Rent tools, camping gear, event equipment, spare rooms, and parking spots
            from people in your neighbourhood — no need to buy what you'll use once.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up" style={{ animationDelay: '240ms' }}>
            <button
              onClick={() => navigate('/register')}
              className="btn-primary px-8 py-4 text-base w-full sm:w-auto animate-pulse-ring"
            >
              Start renting free →
            </button>
            <button
              onClick={() => navigate('/browse')}
              className="text-sm font-bold text-slate-300 bg-white/8 hover:bg-white/12 border border-white/10 px-8 py-4 rounded-2xl cursor-pointer transition-all duration-200 w-full sm:w-auto"
            >
              Browse listings
            </button>
          </div>

          {/* Floating category pills */}
          <div className="flex flex-wrap justify-center gap-2.5 mt-12 animate-fade-up" style={{ animationDelay: '320ms' }}>
            {CATEGORIES.map((c, i) => (
              <button
                key={c.name}
                onClick={() => navigate('/browse')}
                style={{ animationDelay: `${320 + i * 60}ms` }}
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-500/30 text-slate-300 hover:text-amber-400 text-sm font-semibold px-4 py-2 rounded-full cursor-pointer transition-all duration-200 animate-fade-up"
              >
                <span>{c.icon}</span>{c.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust stats ────────────────────────────────────────────────── */}
      <section ref={statsRef} className="border-y border-white/5 bg-white/[0.02] py-12 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8">
          {TRUST_STATS.map((s, i) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-black text-amber-400 mb-1">{s.value}</p>
              <p className="text-sm text-slate-500 font-semibold">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-black text-amber-500 uppercase tracking-widest mb-3">Simple process</p>
            <h2 className="text-3xl sm:text-4xl font-black text-white">How RentIt works</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.step} className="relative group animate-fade-up" style={{ animationDelay: `${i * 100}ms` }}>
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-full w-full h-px bg-gradient-to-r from-amber-500/30 to-transparent z-10 -translate-y-1/2" />
                )}
                <div className="bg-white/[0.04] hover:bg-white/[0.07] border border-white/8 hover:border-amber-500/20 rounded-3xl p-7 transition-all duration-300 h-full">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-200">
                      {step.icon}
                    </div>
                    <span className="text-xs font-black text-amber-500/60 tracking-widest">{step.step}</span>
                  </div>
                  <h3 className="text-lg font-black text-white mb-2">{step.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured listings ──────────────────────────────────────────── */}
      {featured.length > 0 && (
        <section className="py-16 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-xs font-black text-amber-500 uppercase tracking-widest mb-2">Live now</p>
                <h2 className="text-3xl font-black text-white">Available to rent</h2>
              </div>
              <button
                onClick={() => navigate('/browse')}
                className="text-sm font-bold text-amber-400 hover:text-amber-300 bg-transparent border-0 cursor-pointer transition-colors duration-200 hidden sm:block"
              >View all →</button>
            </div>
            {/* Cards on dark bg need white bg override */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {featured.map((listing, i) => (
                <FeaturedCard
                  key={listing.id}
                  listing={listing}
                  delay={i * 80}
                  onClick={() => navigate(`/listings/${listing.id}`)}
                />
              ))}
            </div>
            <div className="text-center mt-8 sm:hidden">
              <button onClick={() => navigate('/browse')} className="btn-primary px-6 py-2.5 text-sm">
                View all listings →
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ── Categories grid ────────────────────────────────────────────── */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-black text-amber-500 uppercase tracking-widest mb-3">What's available</p>
            <h2 className="text-3xl font-black text-white">Browse by category</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 stagger">
            {CATEGORIES.map((cat, i) => (
              <button
                key={cat.name}
                onClick={() => navigate('/browse')}
                style={{ animationDelay: `${i * 60}ms` }}
                className="group bg-white/[0.04] hover:bg-amber-500/10 border border-white/8 hover:border-amber-500/30 rounded-3xl p-6 text-left cursor-pointer transition-all duration-300 animate-fade-up hover:-translate-y-1"
              >
                <span className="text-3xl mb-4 block group-hover:scale-110 transition-transform duration-200">{cat.icon}</span>
                <p className="font-black text-white text-sm mb-1">{cat.name}</p>
                <p className="text-xs text-slate-500">{cat.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Owner CTA ──────────────────────────────────────────────────── */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl p-10 sm:p-14 text-center"
            style={{ background: 'linear-gradient(135deg, #92400e 0%, #b45309 40%, #d97706 100%)' }}>
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/4" />
            <div className="relative">
              <div className="text-4xl mb-4 animate-float inline-block">💰</div>
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
                Turn idle stuff into income
              </h2>
              <p className="text-amber-100 text-lg mb-8 max-w-xl mx-auto leading-relaxed">
                That drill you use twice a year. The tent gathering dust. The parking spot you're not using.
                List it in 2 minutes and start earning.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => navigate('/register')}
                  className="bg-white text-amber-700 font-black px-8 py-3.5 rounded-2xl hover:bg-amber-50 transition-colors duration-200 cursor-pointer border-0 w-full sm:w-auto"
                >
                  List your first item free
                </button>
                <button
                  onClick={() => navigate('/browse')}
                  className="bg-white/15 backdrop-blur-sm text-white font-bold px-8 py-3.5 rounded-2xl hover:bg-white/25 transition-colors duration-200 cursor-pointer border border-white/20 w-full sm:w-auto"
                >
                  See how it works
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <span>📦</span>
            </div>
            <span className="font-black text-white">RentIt <span className="text-amber-400">Nairobi</span></span>
          </div>
          <p className="text-slate-600 text-sm">Peer-to-peer rentals in Nairobi. No buying required.</p>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/browse')} className="text-sm text-slate-500 hover:text-slate-300 bg-transparent border-0 cursor-pointer transition-colors">Browse</button>
            <button onClick={() => navigate('/login')} className="text-sm text-slate-500 hover:text-slate-300 bg-transparent border-0 cursor-pointer transition-colors">Sign in</button>
            <button onClick={() => navigate('/register')} className="text-sm text-slate-500 hover:text-slate-300 bg-transparent border-0 cursor-pointer transition-colors">Register</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
