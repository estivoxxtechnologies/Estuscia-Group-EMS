import { apiRequest } from './client';
import { Branch } from '../types/branch';

export async function getBranches(): Promise<Branch[]> {
  return apiRequest<Branch[]>('/Branches', {
    method: 'GET',
  });
}