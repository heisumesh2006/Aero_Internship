import type { Geometry } from 'geojson'

export type FileStatus = 'PROCESSING' | 'COMPLETED' | 'FAILED'
export type MeasurementStatus =
  | 'SUPPORTED'
  | 'NOT_REQUIRED'
  | 'UNSUPPORTED'
  | 'INVALID_GEOMETRY'
  | 'MEASUREMENT_FAILED'

export interface UploadedFile {
  id: string
  filename: string
  file_type: 'KML' | 'SHAPEFILE'
  feature_count: number
  source_crs: string | null
  measurement_crs: string | null
  status: FileStatus
  error_message: string | null
  created_at: string
  completed_at: string | null
}

export interface FileListResponse {
  total: number
  limit: number
  offset: number
  items: UploadedFile[]
}

