/** Base API path for all backend requests */
export const API = '/api';

/** Custom error class with HTTP status code */
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/**
 * Fetch JSON from the API with error handling.
 * @param url - Full URL path (e.g. '/api/tasks')
 * @param opts - Standard fetch RequestInit options
 * @returns Parsed JSON response typed as T
 * @throws ApiError on non-2xx responses
 */
export async function fetchJSON<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (res.status === 204) return null as T;
  if (!res.ok) throw new ApiError(res.status, await res.text());
  return res.json();
}
