/**
 * Input validation utilities for BuyBack Elite
 * Used across sell flow, registration, and profile forms.
 */

/** Validate Indian phone number (10 digits, optionally prefixed with +91) */
export function isValidPhone(phone) {
  if (!phone) return false
  const cleaned = phone.replace(/[\s\-\(\)]/g, '')
  return /^(\+91)?[6-9]\d{9}$/.test(cleaned)
}

/** Validate Indian pincode (6 digits) */
export function isValidPincode(pincode) {
  if (!pincode) return false
  return /^[1-9]\d{5}$/.test(pincode.trim())
}

/** Validate email format */
export function isValidEmail(email) {
  if (!email) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

/** Validate name (at least 2 characters, no special chars except space) */
export function isValidName(name) {
  if (!name) return false
  const trimmed = name.trim()
  return trimmed.length >= 2 && /^[a-zA-Z\s'.]+$/.test(trimmed)
}

/** Sanitize text input — strip HTML tags to prevent XSS */
export function sanitizeText(input) {
  if (!input) return ''
  return input.replace(/<[^>]*>/g, '').trim()
}

/** Validate UPI ID format (e.g. name@upi, number@paytm) */
export function isValidUPI(upiId) {
  if (!upiId) return false
  return /^[\w.\-]+@[\w]+$/.test(upiId.trim())
}

/** Validate IFSC code (4 letters + 0 + 6 alphanumeric) */
export function isValidIFSC(ifsc) {
  if (!ifsc) return false
  return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc.trim().toUpperCase())
}

/** Validate bank account number (9-18 digits) */
export function isValidAccountNumber(accNo) {
  if (!accNo) return false
  return /^\d{9,18}$/.test(accNo.trim())
}

/** Format phone number for display (e.g. +91 98765 43210) */
export function formatPhone(phone) {
  if (!phone) return ''
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`
  }
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`
  }
  return phone
}

/** Format price in INR (e.g. ₹45,000) */
export function formatINR(amount) {
  if (!amount && amount !== 0) return '₹0'
  return `₹${Number(amount).toLocaleString('en-IN')}`
}
