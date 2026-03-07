// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Types matching your Rust backend
export interface CreatePolicyRequest {
  city: string;
  threshold: number;
  payout: number;
}

export interface PolicyResponse {
  id: string;
  city: string;
  threshold: number;
  payout: number;
  created_at: string;
}

export interface WeatherCheckRequest {
  policy_id: string;
}

export interface WeatherResponse {
  location: string;
  rainfall: number;
  threshold: number;
  condition: string;
  temperature: string;
  triggered: boolean;
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
}

// API Client
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: response.statusText,
      }));
      throw new Error(error.message || 'API request failed');
    }

    return response.json();
  }

  // Create a new policy
  async createPolicy(data: CreatePolicyRequest): Promise<PolicyResponse> {
    return this.request<PolicyResponse>('/policies', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Check weather for a policy
  async checkWeather(policyId: string): Promise<WeatherResponse> {
    return this.request<WeatherResponse>(`/weather/${policyId}`, {
      method: 'GET',
    });
  }

  // Process payout
  async processPayout(data: PayoutRequest): Promise<PayoutResponse> {
    return this.request<PayoutResponse>('/payouts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
