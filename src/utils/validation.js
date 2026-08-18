/**
 * Input validation utilities for form submissions
 */

export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const validatePhone = (phone) => {
  // Accept format like 0712345678, +254712345678, 254712345678
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 9 || cleaned.length === 12;
};

export const validatePassword = (password) => {
  // Min 6 chars, at least one letter and one number
  return password.length >= 6 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
};

export const validateURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const validatePriceRange = (price) => {
  const num = parseFloat(price);
  return num > 0 && num <= 1000000;
};

export const validateDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return false;
  const start = new Date(startDate);
  const end = new Date(endDate);
  return end > start;
};

/**
 * User-friendly error messages
 */
export const getErrorMessage = (error) => {
  if (!error) return 'Something went wrong. Please try again.';
  
  const message = error.toString().toLowerCase();
  
  // Map specific errors to friendly messages
  if (message.includes('overlap')) {
    return '📅 These dates are already booked. Please choose different dates.';
  }
  if (message.includes('already') || message.includes('exist')) {
    return '⚠️ This already exists. Please try again.';
  }
  if (message.includes('not found')) {
    return '❌ Item not found. It may have been deleted.';
  }
  if (message.includes('unauthorized') || message.includes('401')) {
    return '🔐 Your session expired. Please log in again.';
  }
  if (message.includes('forbidden') || message.includes('403')) {
    return '🚫 You don\'t have permission to do this.';
  }
  if (message.includes('connection') || message.includes('network')) {
    return '📡 Connection error. Please check your internet and try again.';
  }
  if (message.includes('mpesa') || message.includes('payment')) {
    return '💳 Payment processing failed. Please try again or contact support.';
  }
  
  return '⚠️ Something went wrong. Please try again later.';
};

export const formatPhoneDisplay = (phone) => {
  // Format as 0712 345 678 or +254 712 345 678
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 9) return `0${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  if (cleaned.length === 12) return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
  return phone;
};
