import { getAccessToken } from './authStorage';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAccessToken();

  const headers = new Headers(options.headers);

  // ------------------------------------------------------------ // CONTENT TYPE // ------------------------------------------------------------ 
  // // JSON requests need application/json.
  //  // FormData requests MUST NOT manually set Content-Type. 
  // // The browser automatically sets: // multipart/form-data; boundary=...
  
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.message ||
      data?.title ||
      'Something went wrong. Please try again.'
    );
  }

  return data as T;
}