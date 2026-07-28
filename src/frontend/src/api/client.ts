const API_URL = `${import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, '') || ''}/api`;

export class ApiError extends Error {
  status: number;
  code?: string;
  detail: unknown;

  constructor(status: number, detail: unknown, code?: string) {
    const message = typeof detail === 'string' ? detail : code || `HTTP ${status}`;
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
    this.code = code;
  }

  get humanMessage(): string {
    if (this.detail && typeof this.detail === 'object' && this.detail !== null) {
      const d = this.detail as Record<string, unknown>;
      if (d.detalle && typeof d.detalle === 'string') return d.detalle;
    }
    if (this.detail && typeof this.detail === 'object' && this.detail !== null) {
      const d = this.detail as Record<string, unknown>;
      if (d.detail && typeof d.detail === 'object' && d.detail !== null) {
        const inner = d.detail as Record<string, unknown>;
        if (inner.detalle && typeof inner.detalle === 'string') return inner.detalle;
        if (inner.msg && typeof inner.msg === 'string') return inner.msg;
      }
      if (d.detail && typeof d.detail === 'string') return d.detail;
    }
    return this.message;
  }
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('token');
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

export async function request<T>(
  path: string,
  options?: {
    method?: string;
    body?: unknown;
    params?: Record<string, string | number | undefined>;
  }
): Promise<T> {
  const { method = 'GET', body, params } = options || {};

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
    ...getAuthHeaders(),
  };

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let detail: unknown = undefined;
    let code: string | undefined = undefined;
    try {
      const json = await res.json();
      detail = json;
      if (json.codigo) code = json.codigo;
      if (json.detail) {
        if (typeof json.detail === 'object' && json.detail !== null) {
          detail = json.detail;
          const d = json.detail as Record<string, unknown>;
          if (d.codigo) code = String(d.codigo);
        } else {
          detail = json.detail;
        }
      }
    } catch {
      detail = res.statusText;
    }
    throw new ApiError(res.status, detail, code);
  }

  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}
