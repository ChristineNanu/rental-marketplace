import React, { useState } from 'react';

export default function PhotoGallery({ photos }) {
  const list = (photos || '').split(',').map(s => s.trim()).filter(Boolean);
  const [active, setActive] = useState(0);
  const [failed, setFailed] = useState({});

  if (list.length === 0) {
    return (
      <div className="img-placeholder rounded-3xl aspect-[4/3]">
        <span className="text-6xl">📦</span>
      </div>
    );
  }

  const current = list[active];
  const currentFailed = failed[active];

  return (
    <div>
      {currentFailed ? (
        <div className="img-placeholder rounded-3xl aspect-[4/3]">
          <span className="text-6xl">📦</span>
        </div>
      ) : (
        <img
          src={current}
          alt=""
          onError={() => setFailed(f => ({ ...f, [active]: true }))}
          className="w-full aspect-[4/3] object-cover rounded-3xl bg-slate-100"
        />
      )}
      {list.length > 1 && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {list.map((url, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 cursor-pointer p-0 ${
                i === active ? 'border-amber-500' : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              {failed[i] ? (
                <div className="img-placeholder w-full h-full"><span className="text-lg">📦</span></div>
              ) : (
                <img src={url} alt="" onError={() => setFailed(f => ({ ...f, [i]: true }))} className="w-full h-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
