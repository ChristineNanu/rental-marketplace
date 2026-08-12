import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import Register from './components/Register';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Browse from './components/Browse';
import ListingDetail from './components/ListingDetail';
import CreateListing from './components/CreateListing';
import MyListings from './components/MyListings';
import MyBookings from './components/MyBookings';
import Business from './components/Business';
import AdminRevenue from './components/AdminRevenue';
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
        <Route path="/" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
        <Route path="/register" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <Register />} />
        <Route path="/login" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <Login onLogin={() => setIsLoggedIn(true)} />} />
        <Route path="/dashboard" element={isLoggedIn ? <Dashboard onLogout={handleLogout} /> : <Navigate to="/login" replace />} />
        <Route path="/browse" element={<Browse onLogout={handleLogout} isLoggedIn={isLoggedIn} />} />
        <Route path="/listings/new" element={isLoggedIn ? <CreateListing onLogout={handleLogout} /> : <Navigate to="/login" replace />} />
        <Route path="/listings/:id" element={<ListingDetail onLogout={handleLogout} isLoggedIn={isLoggedIn} />} />
        <Route path="/my-listings" element={isLoggedIn ? <MyListings onLogout={handleLogout} /> : <Navigate to="/login" replace />} />
        <Route path="/my-bookings" element={isLoggedIn ? <MyBookings onLogout={handleLogout} /> : <Navigate to="/login" replace />} />
        <Route path="/business" element={isLoggedIn ? <Business onLogout={handleLogout} /> : <Navigate to="/login" replace />} />
        <Route path="/admin/revenue" element={isLoggedIn && !!localStorage.getItem('is_admin') ? <AdminRevenue onLogout={handleLogout} /> : <Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
