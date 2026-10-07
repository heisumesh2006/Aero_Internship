import type { ApiErrorBody, FileListResponse, FileMeasurementsResponse, UploadedFile } from '../types/api'

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')

export class ApiRequestError extends Error {
  constructor(message: string, public status: number, public code: string) {
    super(message)
    this.name = 'ApiRequestError'
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, options)
  } catch {
    throw new ApiRequestError('Cannot reach the API. Check that the FastAPI server is running.', 0, 'NETWORK_ERROR')
  }
  if (!response.ok) {
    let body: ApiErrorBody = {}
    try { body = await response.json() as ApiErrorBody } catch { /* HTTP status still provides an error. */ }
    const code = body.error?.code || 'REQUEST_FAILED'
    const messages: Record<string, string> = {
      UNSUPPORTED_FILE_TYPE: 'Unsupported file type. Upload a .kml file or a zipped Shapefile.',
      INVALID_SHAPEFILE_ARCHIVE: body.error?.message?.includes('missing')
        ? 'The archive is missing required Shapefile components.'
        : 'The ZIP must contain exactly one valid Shapefile dataset.',
      FILE_TOO_LARGE: 'The uploaded file exceeds the maximum allowed size.',
      FILE_NOT_FOUND: 'This dataset could not be found.',
      MISSING_CRS: 'The Shapefile needs a valid .prj file describing its coordinate system.',
    }
    throw new ApiRequestError(messages[code] || body.error?.message || `Request failed (${response.status}).`, response.status, code)
  }
  return response.json() as Promise<T>
}

export function getHealth(signal?: AbortSignal): Promise<{ status: string }> {
  return request('/health', { signal })
}

export function listFiles(limit = 20, offset = 0, signal?: AbortSignal): Promise<FileListResponse> {
  return request(`/api/files/?limit=${limit}&offset=${offset}`, { signal })
}

export async function getAllFiles(signal?: AbortSignal): Promise<UploadedFile[]> {
  const files: UploadedFile[] = []
  let offset = 0
  const limit = 100
  while (true) {
    const page = await listFiles(limit, offset, signal)
    files.push(...page.items)
    offset += page.items.length
    if (!page.items.length || offset >= page.total) return files
  }
}

export function uploadFile(file: File): Promise<UploadedFile> {
  const form = new FormData()
  form.append('file', file)
  return request('/api/files/', { method: 'POST', body: form })
}

export function getFile(id: string, signal?: AbortSignal): Promise<UploadedFile> {
  return request(`/api/files/${encodeURIComponent(id)}/`, { signal })
}

