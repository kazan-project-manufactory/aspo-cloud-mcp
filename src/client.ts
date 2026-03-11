import axios, { AxiosInstance } from "axios";

let instance: AxiosInstance | null = null;

export function getClient(): AxiosInstance {
  if (instance) return instance;

  const company = process.env.ASPRO_COMPANY;
  const apiKey = process.env.ASPRO_API_KEY;

  if (!company) throw new Error("ASPRO_COMPANY environment variable is required");
  if (!apiKey) throw new Error("ASPRO_API_KEY environment variable is required");

  instance = axios.create({
    baseURL: `https://${company}.aspro.cloud/api/v1/module`,
    params: { api_key: apiKey },
  });

  return instance;
}

export async function apiGet<T>(path: string, params?: Record<string, unknown>): Promise<T> {
  const client = getClient();
  const response = await client.get<{ response: T }>(path, { params });
  return response.data.response;
}

export async function apiPost<T>(path: string, data: Record<string, unknown>): Promise<T> {
  const client = getClient();
  const formData = new URLSearchParams();
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  }
  const response = await client.post<{ response: T }>(path, formData, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  return response.data.response;
}
