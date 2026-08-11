import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { API_BASE_URL } from '../constants';
import { apiFetch } from '../api';

const POLL_MS = 8000;

function fmt(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function MessageBell({ onOpenChat }) {
  const [unread, setUnread] = useState([]);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const btnRef = useRef(null);
  const dropRef = useRef(null);

  const load = async () => {
    try {
      const res = await apiFetch(`${API_BASE_URL}/messages/unread`);
      if (res.ok) setUnread(await res.json());
    } catch {}
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_MS);
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (!btnRef.current?.contains(e.target) && !dropRef.current?.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const toggle = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
    }
    setOpen(o => !o);
  };

  const totalUnread = unread.reduce((s, u) => s + u.unread_count, 0);

  const dropdown = open && createPortal(
    <div
      ref={dropRef}
      style={{ position: 'fixed', top: pos.top, right: pos.right, zIndex: 9999, width: 320 }}
      className="bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-scale-in"
    >
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <p className="font-black text-slate-900 text-sm">Messages</p>
        {totalUnread > 0 && (
          <span className="badge bg-amber-100 text-amber-700">{totalUnread} unread</span>
        )}
      </div>

      {unread.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <p className="text-2xl mb-2">💬</p>
          <p className="text-sm font-bold text-slate-500">No unread messages</p>
        </div>
      ) : (
        <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
          {unread.map(u => (
            <button
              key={u.booking_id}
              onClick={() => { setOpen(false); onOpenChat(u.booking_id); }}
              className="w-full text-left px-4 py-3 hover:bg-amber-50 transition-colors duration-150 cursor-pointer border-0 bg-transparent"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="font-black text-slate-900 text-sm line-clamp-1 flex-1">{u.listing_title}</p>
                <span className="shrink-0 w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-black flex items-center justify-center">
                  {u.unread_count}
                </span>
              </div>
              <p className="text-xs text-slate-500 line-clamp-1">
                <span className="font-semibold text-slate-700">{u.latest_sender}:</span> {u.latest_body}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">{fmt(u.latest_at)}</p>
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body
  );

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggle}
        className="relative w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center border-0 cursor-pointer transition-colors duration-200"
        title="Messages"
      >
        <span className="text-base">💬</span>
        {totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-black flex items-center justify-center animate-pulse-ring">
            {totalUnread > 9 ? '9+' : totalUnread}
          </span>
        )}
      </button>
      {dropdown}
    </>
  );
}
