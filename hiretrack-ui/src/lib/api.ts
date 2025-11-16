// Simple API helper for backend calls with token handling

const TOKEN_KEY = 'ht_token';

// API base URL: uses VITE_API_BASE_URL in production, falls back to relative path for local dev
const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // ignore
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

function authHeaders() {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

async function handle(res: Response) {
  const ct = res.headers.get('content-type') || '';
  if (!res.ok) {
    if (ct.includes('application/json')) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `${res.status} ${res.statusText}`);
    }
    const text = await res.text().catch(() => '');
    throw new Error(text || `${res.status} ${res.statusText}`);
  }
  return ct.includes('application/json') ? res.json() : null;
}

export async function login(email: string, password: string): Promise<string> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await handle(res);
  const token = (data && data.token) || '';
  if (token) setToken(token);
  return token;
}

export async function getMe() {
  const res = await fetch(`${API_BASE}/api/auth/me`, { headers: { ...authHeaders() } });
  return handle(res);
}

export type JobInput = {
  title: string;
  description: string;
  department?: string;
  location?: string;
  type?: string;
  skills?: string[];
  requirements?: string[];
  postedDate?: string;
  status?: 'open' | 'closed';
  pipelineStages?: string[];
};

export async function getJobs() {
  const res = await fetch(`${API_BASE}/api/jobs`);
  return handle(res);
}

export async function getJob(id: string) {
  const res = await fetch(`${API_BASE}/api/jobs/${id}`);
  return handle(res);
}

export async function createJob(data: any) {
  const res = await fetch(`${API_BASE}/api/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  return handle(res);
}

export async function updateJob(id: string, data: any) {
  const res = await fetch(`${API_BASE}/api/jobs/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  return handle(res);
}

export async function deleteJob(id: string) {
  const res = await fetch(`${API_BASE}/api/jobs/${id}`, {
    method: 'DELETE',
    headers: { ...authHeaders() },
  });
  return handle(res);
}

export async function getCandidates(jobId: string) {
  const res = await fetch(`${API_BASE}/api/candidates/${jobId}`);
  return handle(res);
}

export async function moveStage(candidateId: string, to: string) {
  const res = await fetch(`${API_BASE}/api/movestage/${candidateId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ to }),
  });
  return handle(res);
}

export async function getDashboardStats() {
  const res = await fetch(`${API_BASE}/api/dashboard/stats`, { headers: { ...authHeaders() } });
  return handle(res);
}
