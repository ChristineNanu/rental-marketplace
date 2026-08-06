import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Register from './components/Register';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Browse from './components/Browse';
import ListingDetail from './components/ListingDetail';
import CreateListing from './components/CreateListing';
import MyListings from './components/MyListings';
import MyBookings from './components/MyBookings';
import { clearAuth, getAccessToken } from './api';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!getAccessToken());

  const handleLogout = () => {
    clearAuth();
    setIsLoggedIn(false);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to={isLoggedIn ? '/dashboard' : '/login'} replace />} />
        <Route path="/register" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <Register />} />
        <Route path="/login" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <Login onLogin={() => setIsLoggedIn(true)} />} />
        <Route path="/dashboard" element={isLoggedIn ? <Dashboard onLogout={handleLogout} /> : <Navigate to="/login" replace />} />
        <Route path="/browse" element={isLoggedIn ? <Browse onLogout={handleLogout} /> : <Navigate to="/login" replace />} />
        <Route path="/listings/new" element={isLoggedIn ? <CreateListing onLogout={handleLogout} /> : <Navigate to="/login" replace />} />
        <Route path="/listings/:id" element={isLoggedIn ? <ListingDetail onLogout={handleLogout} /> : <Navigate to="/login" replace />} />
        <Route path="/my-listings" element={isLoggedIn ? <MyListings onLogout={handleLogout} /> : <Navigate to="/login" replace />} />
        <Route path="/my-bookings" element={isLoggedIn ? <MyBookings onLogout={handleLogout} /> : <Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
