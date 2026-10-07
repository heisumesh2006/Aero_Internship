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

export interface MeasurementResponse {
  type: 'area' | 'length' | null
  value: number | null
  unit: string | null
  status: MeasurementStatus
  message: string | null
}

export interface FeatureMeasurement {
  feature_index: number
  external_feature_id: string | null
  geometry_type: string | null
  geometry: Geometry | null
  properties: Record<string, unknown>
  source_crs: string
  measurement_crs: string | null
  measurement: MeasurementResponse
}

