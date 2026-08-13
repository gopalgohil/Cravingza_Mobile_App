// Cravingza Input Form Validation Utilities

export const validatePhone = (phone: string): { isValid: boolean; message?: string } => {
  const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
  if (!cleanPhone) {
    return { isValid: false, message: 'Phone number is required.' };
  }
  if (cleanPhone.length !== 10) {
    return { isValid: false, message: 'Phone number must be exactly 10 digits (e.g. 9876543210).' };
  }
  if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
    return { isValid: false, message: 'Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.' };
  }
  return { isValid: true };
};

export const validatePincode = (pincode: string): { isValid: boolean; message?: string } => {
  const cleanPincode = (pincode || '').replace(/[^0-9]/g, '');
  if (!cleanPincode) {
    return { isValid: false, message: 'Pincode is required.' };
  }
  if (cleanPincode.length !== 6) {
    return { isValid: false, message: 'Pincode must be exactly 6 digits (e.g. 390026).' };
  }
  return { isValid: true };
};

export const validateEmail = (email: string): { isValid: boolean; message?: string } => {
  const cleanEmail = (email || '').trim();
  if (!cleanEmail) {
    return { isValid: false, message: 'Email address is required.' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    return { isValid: false, message: 'Please enter a valid email address (e.g. name@domain.com).' };
  }
  return { isValid: true };
};

export const validateName = (name: string, fieldName = 'Name'): { isValid: boolean; message?: string } => {
  const cleanName = (name || '').trim();
  if (!cleanName) {
    return { isValid: false, message: `${fieldName} is required.` };
  }
  if (cleanName.length < 3) {
    return { isValid: false, message: `${fieldName} must be at least 3 characters long.` };
  }
  return { isValid: true };
};

export const validateBankAccount = (accountNumber: string): { isValid: boolean; message?: string } => {
  const cleanAcc = (accountNumber || '').replace(/[^0-9]/g, '');
  if (!cleanAcc) {
    return { isValid: false, message: 'Bank Account Number is required.' };
  }
  if (cleanAcc.length < 9 || cleanAcc.length > 18) {
    return { isValid: false, message: 'Bank Account Number must be between 9 and 18 digits.' };
  }
  return { isValid: true };
};

export const validateIFSC = (ifsc: string): { isValid: boolean; message?: string } => {
  const cleanIfsc = (ifsc || '').trim().toUpperCase();
  if (!cleanIfsc) {
    return { isValid: false, message: 'IFSC Code is required.' };
  }
  if (cleanIfsc.length !== 11) {
    return { isValid: false, message: 'IFSC Code must be exactly 11 characters (e.g. HDFC0001234).' };
  }
  return { isValid: true };
};
