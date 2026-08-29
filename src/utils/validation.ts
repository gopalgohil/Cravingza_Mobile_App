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

export interface EmailValidationOptions {
  /** Optional flag to reject disposable/temporary email domains (default: false) */
  blockDisposable?: boolean;
  /** Custom disposable domain blocklist if disposable checking is enabled */
  disposableDomains?: string[];
}

export interface EmailValidationResult {
  isValid: boolean;
  message?: string;
  normalizedEmail?: string;
}

// Default common disposable email domains list (configurable)
const DEFAULT_DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  'tempmail.com',
  '10minutemail.com',
  'guerrillamail.com',
  'throwawaymail.com',
  'dispostable.com',
  'trashmail.com',
  'yopmail.com',
]);

/**
 * Production-Grade Email Address Validation System
 * Adheres strictly to RFC 5321 & RFC 5322 email standards while avoiding over-validation.
 */
export const validateEmail = (
  email: string,
  options: EmailValidationOptions = {}
): EmailValidationResult => {
  // 1. Basic Presence & Empty Check
  if (email === undefined || email === null) {
    return { isValid: false, message: 'Email address is required.' };
  }

  // Auto-remove accidental leading/trailing whitespace
  const trimmed = String(email).trim();
  if (!trimmed) {
    return { isValid: false, message: 'Email address is required.' };
  }

  // 2. Reject internal spaces (spaces, tabs, newlines)
  if (/\s/.test(trimmed)) {
    return { isValid: false, message: 'Email address cannot contain spaces.' };
  }

  // 3. Overall Length Check (RFC 5321: maximum 254 characters)
  if (trimmed.length > 254) {
    return { isValid: false, message: 'Email address is too long (maximum 254 characters).' };
  }

  // 4. Check for Non-ASCII / Internationalized Characters
  // Standard backend SMTP / DB providers in this stack expect standard ASCII email addresses.
  // Note: Documented limitation - Non-ASCII Internationalized Email (IDN) require Punycode encoding.
  if (/[^\x00-\x7F]/.test(trimmed)) {
    return {
      isValid: false,
      message: 'Internationalized non-ASCII characters are not supported. Please use standard ASCII characters.',
    };
  }

  // 5. Structure Check: Exactly one '@' separator
  const parts = trimmed.split('@');
  if (parts.length === 1) {
    return { isValid: false, message: 'Email address must contain an "@" symbol.' };
  }
  if (parts.length > 2) {
    return { isValid: false, message: 'Email address cannot contain more than one "@" symbol.' };
  }

  const [localPart, domainPart] = parts;

  // 6. Local-Part Validation
  if (!localPart) {
    return { isValid: false, message: 'Email username before "@" is missing.' };
  }

  if (localPart.length > 64) {
    return { isValid: false, message: 'Email username before "@" is too long (maximum 64 characters).' };
  }

  if (localPart.startsWith('.')) {
    return { isValid: false, message: 'Email username cannot start with a dot.' };
  }

  if (localPart.endsWith('.')) {
    return { isValid: false, message: 'Email username cannot end with a dot.' };
  }

  if (localPart.includes('..')) {
    return { isValid: false, message: 'Email username cannot contain consecutive dots ("..").' };
  }

  // Allowed unquoted local-part characters: A-Z, a-z, 0-9, !#$%&'*+-/=?^_`{|}~ and dot (.)
  const validLocalPartRegex = /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~.-]+$/;
  if (!validLocalPartRegex.test(localPart)) {
    return { isValid: false, message: 'Email username contains invalid characters.' };
  }

  // 7. Domain-Part Validation
  if (!domainPart) {
    return { isValid: false, message: 'Email domain after "@" is missing.' };
  }

  if (domainPart.length > 255) {
    return { isValid: false, message: 'Email domain after "@" is too long.' };
  }

  if (domainPart.startsWith('.')) {
    return { isValid: false, message: 'Email domain cannot start with a dot.' };
  }

  if (domainPart.endsWith('.')) {
    return { isValid: false, message: 'Email domain cannot end with a dot.' };
  }

  if (domainPart.includes('..')) {
    return { isValid: false, message: 'Email domain cannot contain consecutive dots ("..").' };
  }

  const domainLabels = domainPart.split('.');
  if (domainLabels.length < 2) {
    return { isValid: false, message: 'Email domain must include a valid top-level domain (e.g. .com, .org, .in).' };
  }

  // Validate each domain label (subdomains and main domain name)
  for (let i = 0; i < domainLabels.length; i++) {
    const label = domainLabels[i];

    if (!label) {
      return { isValid: false, message: 'Email domain contains invalid empty section.' };
    }

    if (label.length > 63) {
      return { isValid: false, message: `Domain section "${label}" is too long (maximum 63 characters).` };
    }

    if (label.startsWith('-') || label.endsWith('-')) {
      return { isValid: false, message: `Domain section "${label}" cannot start or end with a hyphen.` };
    }

    if (!/^[a-zA-Z0-9-]+$/.test(label)) {
      return { isValid: false, message: `Domain section "${label}" contains invalid characters.` };
    }
  }

  // 8. Top-Level Domain (TLD) Validation
  const tld = domainLabels[domainLabels.length - 1];
  // TLD must be at least 2 alphabetic characters (e.g., .com, .org, .co, .info, .app, .restaurant)
  if (!/^[a-zA-Z]{2,}$/.test(tld)) {
    return { isValid: false, message: 'Top-level domain (e.g. .com) must contain at least 2 letters.' };
  }

  // 9. Disposable Email Domain Check (Optional / Configurable)
  if (options.blockDisposable) {
    const customList = options.disposableDomains ? new Set(options.disposableDomains.map(d => d.toLowerCase())) : DEFAULT_DISPOSABLE_DOMAINS;
    if (customList.has(domainPart.toLowerCase())) {
      return { isValid: false, message: 'Disposable or temporary email addresses are not allowed.' };
    }
  }

  // 10. Normalize Email (Casing of domain normalized to lowercase, local-part preserved)
  const normalizedEmail = `${localPart}@${domainPart.toLowerCase()}`;

  return {
    isValid: true,
    normalizedEmail,
  };
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
