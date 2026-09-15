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
    console.error('API Error:', {
      endpoint,
      status: response.status,
      statusText: response.statusText,
      response: data,
    });

    // ------------------------------------------------------------
    // ASP.NET CORE VALIDATION ERRORS
    // ------------------------------------------------------------

    if (data?.errors) {
      const validationMessages = Object.entries(data.errors)
        .flatMap(([field, messages]) => {
          if (Array.isArray(messages)) {
            return messages.map(
              (message) => `${field}: ${message}`
            );
          }

          return [`${field}: ${String(messages)}`];
        });

      if (validationMessages.length > 0) {
        throw new Error(validationMessages.join('\n'));
      }
    }

    // ------------------------------------------------------------
    // NORMAL API ERROR
    // ------------------------------------------------------------

    throw new Error(
      data?.message ||
      data?.title ||
      'Something went wrong. Please try again.'
    );
  }


  return data as T;
}