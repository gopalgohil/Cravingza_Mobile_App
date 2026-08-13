// @ts-nocheck
// Cravingza Central API Client

// 🔹 BASE_URL configured with live backend fallback for React Native bundle
export const BASE_URL =
  (typeof process !== 'undefined' && process.env?.API_BASE_URL) ||
  'https://cravingza.onrender.com';

let globalAuthToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  globalAuthToken = token;
};

export const getAuthToken = () => globalAuthToken;

export const apiClient = async (endpoint: string, options: RequestInit = {}) => {
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (globalAuthToken) {
    defaultHeaders['Authorization'] = `Bearer ${globalAuthToken}`;
  }

  // Ensure /api prefix is formatted cleanly
  const apiPath = endpoint.startsWith('/api')
    ? endpoint
    : `/api${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const fullUrl = `${BASE_URL}${apiPath}`;
  // console.log(`[API Request] ${options.method || 'GET'} -> ${fullUrl}`);

  const response = await fetch(fullUrl, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  const responseText = await response.text();
  // console.log(`[API Response Status] ${response.status}`);

  let data;
  try {
    data = JSON.parse(responseText);
  } catch (err) {
    if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
      throw new Error(
        `Route Not Found (404 HTML). Please check if backend route is ${fullUrl}`
      );
    }
    throw new Error(`Invalid Response: ${responseText.substring(0, 100)}`);
  }

  if (!response.ok) {
    throw new Error(data.message || data.error || `HTTP ${response.status} Error`);
  }



  return data;
};

