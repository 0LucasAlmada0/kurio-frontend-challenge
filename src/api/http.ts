import axios from 'axios'
import type { ApiError } from './contracts'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 8_000,
  headers: { Accept: 'application/json' },
})

export function errorMessage(error: unknown) {
  if (axios.isAxiosError<ApiError>(error)) {
    return error.response?.data.message || 'Não foi possível conectar. Tente novamente.'
  }
  return 'Não foi possível carregar os dados.'
}
