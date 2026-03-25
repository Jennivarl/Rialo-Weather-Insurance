// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface CreatePolicyRequest {
  city: string;
  threshold: number;
  payout: number;
  walletAddress?: string;
  weather_type?: 'rainfall' | 'temperature' | 'wind';
  trigger_direction?: 'above' | 'below';
  coverage_days?: number;
  lat?: number;
  lon?: number;
}

export interface PolicyResponse {
  id: string;
  city: string;
  location?: string;
  threshold: number;
  payout: number;
  weather_type: string;
  trigger_direction: string;
  coverage_days: number;
  created_at: string;
}

export interface WeatherResponse {
  location: string;
  rainfall: number;
  threshold: number;
  condition: string;
  temperature: string;
  triggered: boolean;
  weather_type: string;
  trigger_direction: string;
  coverage_days: number;
  unit: string;
}

export interface PayoutRequest {
  policy_id: string;
  payout_method: string;
}

export interface PayoutResponse {
  transaction_id: string;
  amount: number;
  status: string;
  payout_method: string;
  solana_explorer_url?: string | null;
}

export interface BalanceResponse {
  sol: number;
  usdc: number;
}

export interface FaucetResponse {
  success: boolean;
  transaction_id: string;
  amount: number;
  solana_explorer_url?: string;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options?.headers },
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || error.error || error.details || `API error ${response.status}`);
    }
    return response.json();
  }

  async createPolicy(data: CreatePolicyRequest): Promise<PolicyResponse> {
    return this.request<PolicyResponse>('/policies', { method: 'POST', body: JSON.stringify(data) });
  }

  async checkWeather(policyId: string): Promise<WeatherResponse> {
    return this.request<WeatherResponse>(`/weather/${policyId}`, { method: 'GET' });
  }

  async processPayout(data: PayoutRequest): Promise<PayoutResponse> {
    return this.request<PayoutResponse>('/payouts', { method: 'POST', body: JSON.stringify(data) });
  }

  async getBalance(walletAddress: string): Promise<BalanceResponse> {
    return this.request<BalanceResponse>(`/balance/${walletAddress}`, { method: 'GET' });
  }

  async requestFaucet(walletAddress: string): Promise<FaucetResponse> {
    return this.request<FaucetResponse>('/faucet', { method: 'POST', body: JSON.stringify({ walletAddress }) });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
