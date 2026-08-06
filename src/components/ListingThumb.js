import React, { useState } from 'react';

// Renders a listing's first photo, falling back to a soft gradient + icon when
// there's no photo (or the URL 404s) — used everywhere a listing shows up as a
// thumbnail (Browse cards, My Listings, My Bookings) so there's never a broken-image icon.
export default function ListingThumb({ photos, alt, className = '', iconClassName = 'text-3xl' }) {
  const [failed, setFailed] = useState(false);
  const first = (photos || '').split(',').map(s => s.trim()).filter(Boolean)[0];

  if (!first || failed) {
    return (
      <div className={`img-placeholder ${className}`}>
        <span className={iconClassName}>📦</span>
      </div>
    );
  }

  return (
    <img
      src={first}
      alt={alt}
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  );
}
