import { CapacitorHttp } from '@capacitor/core';
import { isNative, isPlainWeb } from '../platform';
import { timeoutSignal } from './http';

export interface Req {
  url: string;
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
}

/**
 * HTTP for APIs that block browser CORS (OpenSubtitles): native HTTP on Android,
 * the dev server's /xhr relay in the browser. Returns status + parsed body (JSON when possible).
 */
export async function request<T = any>(r: Req): Promise<{ status: number; data: T }> {
  const method = r.method || 'GET';
  if (isNative) {
    const res = await CapacitorHttp.request({
      url: r.url, method, headers: r.headers || {}, data: r.body,
      connectTimeout: r.timeoutMs || 15000, readTimeout: r.timeoutMs || 15000,
    });
    let data = res.data;
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch {
        /* text body */
      }
    }
    return { status: res.status, data };
  }
  const headers: Record<string, string> = {};
  // browsers refuse to set User-Agent: the relay applies it (no relay on the published web build: dropped)
  for (const [k, v] of Object.entries(r.headers || {})) {
    if (k.toLowerCase() !== 'user-agent') headers[k] = v;
    else if (!isPlainWeb) headers['x-ua'] = v;
  }
  const res = await fetch(isPlainWeb ? r.url : `/xhr?u=${encodeURIComponent(r.url)}`, {
    method,
    headers,
    body: r.body !== undefined ? JSON.stringify(r.body) : undefined,
    signal: timeoutSignal(r.timeoutMs || 15000),
  });
  const text = await res.text();
  let data: any = text;
  try {
    data = JSON.parse(text);
  } catch {
    /* text body */
  }
  return { status: res.status, data };
}
