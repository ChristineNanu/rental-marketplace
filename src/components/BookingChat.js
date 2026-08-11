import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { API_BASE_URL } from '../constants';
import { apiFetch } from '../api';

export default function BookingChat({ booking, onClose }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const load = async () => {
    const res = await apiFetch(`${API_BASE_URL}/bookings/${booking.id}/messages`);
    if (res.ok) setMessages(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000); // poll every 5s
    return () => clearInterval(interval);
  }, [booking.id]); // eslint-disable-line

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    const res = await apiFetch(`${API_BASE_URL}/bookings/${booking.id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: text.trim() }),
    });
    if (res.ok) {
      const msg = await res.json();
      setMessages(prev => [...prev, msg]);
      setText('');
    }
    setSending(false);
  };

  const fmt = (iso) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) +
      ' · ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const modal = (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-[9999] animate-fade-in">
      <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col animate-slide-up" style={{ maxHeight: '90vh' }}>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-black shrink-0 shadow-md shadow-amber-200">
            💬
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-slate-900 text-sm truncate">{booking.listing.title}</p>
            <p className="text-xs text-slate-400">
              {new Date(booking.start_date).toLocaleDateString()} – {new Date(booking.end_date).toLocaleDateString()}
              {' · '}<span className={`font-bold ${
                booking.status === 'accepted' ? 'text-emerald-600' :
                booking.status === 'requested' ? 'text-amber-600' :
                booking.status === 'completed' ? 'text-blue-600' : 'text-slate-400'
              }`}>{booking.status}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 border-0 cursor-pointer transition-colors text-lg leading-none"
          >×</button>
        </div>

        {/* Info banner */}
        <div className="mx-4 mt-3 px-4 py-2.5 bg-amber-50 border border-amber-100 rounded-2xl text-xs text-amber-700 font-medium">
          💡 Use this to coordinate pickup, ask questions, or arrange a viewing before committing.
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-amber-300 border-t-amber-600 rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-4xl mb-3 animate-float inline-block">👋</div>
              <p className="font-bold text-slate-700 mb-1">No messages yet</p>
              <p className="text-sm text-slate-400">
                {booking.status === 'requested'
                  ? 'Ask the owner a question while your request is pending.'
                  : 'Coordinate pickup time, location, or anything else here.'}
              </p>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div
                key={msg.id}
                className={`flex ${msg.is_mine ? 'justify-end' : 'justify-start'} animate-fade-up`}
                style={{ animationDelay: `${i * 20}ms` }}
              >
                <div className={`max-w-[78%] ${msg.is_mine ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                  {!msg.is_mine && (
                    <span className="text-[10px] font-bold text-slate-400 px-1">{msg.sender_name}</span>
                  )}
                  <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.is_mine
                      ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-br-md'
                      : 'bg-slate-100 text-slate-800 rounded-bl-md'
                  }`}>
                    {msg.body}
                  </div>
                  <span className="text-[10px] text-slate-400 px-1">{fmt(msg.created_at)}</span>
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={send} className="flex items-center gap-2 px-4 py-3 border-t border-slate-100">
          <input
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2.5 rounded-2xl border-2 border-slate-200 bg-slate-50 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-4 focus:ring-amber-100 transition-all duration-200"
          />
          <button
            type="submit"
            disabled={sending || !text.trim()}
            className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center border-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-amber-300/40 transition-all duration-200 active:scale-95 shrink-0"
          >
            {sending
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <span className="text-base">↑</span>
            }
          </button>
        </form>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
