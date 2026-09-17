export interface HealthResponse {
  status: "ok";
  service: "redvital-api";
}
export type ApiRole = "donor" | "patient" | "admin";
export interface AuthenticatedUser { id: string; email: string; role: ApiRole; status: "active" | "disabled"; }
export interface AuthSession { user: AuthenticatedUser; accessToken?: string; refreshToken?: string; }
export interface UserProfile { firstName: string; lastName: string; phone: string | null; bloodType: "O" | "A" | "B" | "AB"; rhFactor: "+" | "-"; city: string; available: boolean; }
export interface RegisterInput { firstName: string; lastName: string; email: string; password: string; phone: string; bloodType: "O" | "A" | "B" | "AB"; rhFactor: "+" | "-"; city: string; role: "donor" | "patient"; available?: boolean; }

export interface RedVitalApiClientOptions {
  baseUrl: string;
  fetchImplementation?: typeof fetch;
}

export class RedVitalApiClient {
  private readonly baseUrl: string;
  private readonly fetchImplementation: typeof fetch;

  constructor({ baseUrl, fetchImplementation = fetch }: RedVitalApiClientOptions) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.fetchImplementation = fetchImplementation;
  }

  async health(): Promise<HealthResponse> {
    const response = await this.fetchImplementation(`${this.baseUrl}/health`);
    if (!response.ok) throw new Error(`API unavailable: ${response.status}`);
    return response.json() as Promise<HealthResponse>;
  }

  async register(input: RegisterInput): Promise<AuthenticatedUser> { return this.request("/auth/register", { method: "POST", body: JSON.stringify(input) }); }
  async login(email: string, password: string, client: "web" | "mobile" = "mobile"): Promise<AuthSession> { return this.request("/auth/login", { method: "POST", body: JSON.stringify({ email, password, client }) }); }
  async refresh(refreshToken?: string, client: "web" | "mobile" = "mobile"): Promise<AuthSession> { return this.request("/auth/refresh", { method: "POST", body: JSON.stringify({ refreshToken, client }) }); }
  async logout(refreshToken?: string, client: "web" | "mobile" = "mobile"): Promise<void> { await this.request("/auth/logout", { method: "POST", body: JSON.stringify({ refreshToken, client }) }); }
  async forgotPassword(email: string): Promise<void> { await this.request("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }); }
  async resetPassword(token: string, password: string): Promise<void> { await this.request("/auth/reset-password", { method: "POST", body: JSON.stringify({ token, password }) }); }
  async me(): Promise<AuthenticatedUser> { return this.request("/users/me", { method: "GET" }); }
  async myProfile(): Promise<UserProfile | null> { return this.request("/users/me/profile", { method: "GET" }); }
  private async request<T>(path: string, init: RequestInit): Promise<T> { const response = await this.fetchImplementation(`${this.baseUrl}${path}`, { ...init, headers: { "content-type": "application/json", ...init.headers }, credentials: "include" }); if (!response.ok) throw new Error(`API request failed: ${response.status}`); return response.status === 204 ? undefined as T : response.json() as Promise<T>; }
}
