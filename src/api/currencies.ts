import { apiRequest } from './client';

export interface BackendCurrency {
  id: number;
  code: string;
  name: string;
  symbol: string;
  isActive: boolean;
}

export async function getCurrencies(): Promise<BackendCurrency[]> {
  return apiRequest<BackendCurrency[]>('/Currencies/combo', {
    method: 'GET',
  });
}