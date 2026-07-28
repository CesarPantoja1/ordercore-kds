const API_URL = `${import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, '') || ''}/api`;

export class ApiError extends Error {
  public statusCode: number;
  public code: string | null;
  public detail: string;

  constructor(statusCode: number, detail: string, code: string | null = null) {
    super(detail);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.detail = detail;
  }
}

export function getToken(): string | null {
  return localStorage.getItem('auth_token');
}

export function setToken(token: string): void {
  localStorage.setItem('auth_token', token);
}

export function removeToken(): void {
  localStorage.removeItem('auth_token');
}

export function setUser(user: unknown): void {
  localStorage.setItem('auth_user', JSON.stringify(user));
}

export function removeUser(): void {
  localStorage.removeItem('auth_user');
}

export function getUser<T = unknown>(): T | null {
  try {
    const raw = localStorage.getItem('auth_user');
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

async function parseErrorResponse(res: Response): Promise<ApiError> {
  try {
    const body = await res.json();
    // FastAPI structured error: {"detail": {"detalle": "...", "codigo": "..."}}
    if (body?.detail && typeof body.detail === 'object') {
      return new ApiError(
        res.status,
        body.detail.detalle || JSON.stringify(body.detail),
        body.detail.codigo || null
      );
    }
    // FastAPI simple error: {"detail": "..."}
    if (body?.detail && typeof body.detail === 'string') {
      return new ApiError(res.status, body.detail, null);
    }
    return new ApiError(res.status, body?.message || `Error ${res.status}`, null);
  } catch {
    return new ApiError(res.status, `Error ${res.status}: ${res.statusText}`, null);
  }
}

export async function request<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    params?: Record<string, string | number | undefined>;
    auth?: boolean;
  } = {}
): Promise<T> {
  const { method = 'GET', body, params, auth = false } = options;

  let url = `${API_URL}${path}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.set(key, String(value));
      }
    });
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (auth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    throw await parseErrorResponse(res);
  }

  // Handle 204 No Content
  if (res.status === 204) {
    return undefined as unknown as T;
  }

  return res.json() as Promise<T>;
}
