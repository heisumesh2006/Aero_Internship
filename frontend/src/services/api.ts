import type { ApiErrorBody, FileListResponse, FileMeasurementsResponse, UploadedFile } from '../types/api'

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')

export class ApiRequestError extends Error {
  constructor(message: string, public status: number, public code: string) {
    super(message)
    this.name = 'ApiRequestError'
  }
}

