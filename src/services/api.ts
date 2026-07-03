import axios, { type AxiosRequestConfig } from 'axios';

export const api = axios.create({
  baseURL: '/infinity',
  withCredentials: true,
});

const inFlightGets = new Map<string, Promise<unknown>>();

/**
 * Shares a single in-flight promise across identical concurrent GET requests,
 * collapsing duplicate network calls (e.g. React StrictMode's double-mount in dev).
 * The entry is released as soon as the request settles, so sequential reads still refetch.
 */
export function dedupedGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const key = config?.params != null ? `${url}?${JSON.stringify(config.params)}` : url;
  const existing = inFlightGets.get(key);
  if (existing != null) {
    return existing as Promise<T>;
  }

  const request = api
    .get<T>(url, config)
    .then((response) => response.data)
    .finally(() => {
      inFlightGets.delete(key);
    });

  inFlightGets.set(key, request);
  return request;
}
