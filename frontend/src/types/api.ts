export interface Document {
  id: number;
  user_id: number;
  filename: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
  lab_name?: string;
  report_date?: string;
  raw_extracted_data?: any;
  created_at: string;
  updated_at?: string;
  results?: Result[];
}

export interface Result {
  id: number;
  document_id: number;
  analyte_id?: number;
  source_label: string;
  raw_value: string;
  raw_unit?: string;
  raw_reference_range?: string;
  numeric_value?: number;
  normalized_unit?: string;
  normalized_reference_min?: number;
  normalized_reference_max?: number;
  is_numeric: boolean;
  is_out_of_range?: boolean;
  flag?: string;
  is_suspect: boolean;
  normalized: boolean;
  previous_result_id?: number;
  delta_value?: number;
  delta_percent?: number;
  lab_comments?: string;
  processing_notes?: any;
  created_at: string;
  analyte?: Analyte;
}

export interface Analyte {
  id: number;
  code: string;
  loinc_code?: string;
  name: string;
  description?: string;
  default_unit?: string;
  unit_category?: string;
  reference_ranges?: any;
  is_active: boolean;
}

export interface UploadResponse {
  id: number;
  filename: string;
  status: string;
  message?: string;
}

export interface TrendsData {
  [key: string]: {
    analyte_name: string;
    values: Array<{
      date: string;
      value?: number;
      unit?: string;
      is_out_of_range?: boolean;
    }>;
    out_of_range_count: number;
    suspect_count: number;
  };
}

export interface ApiError {
  detail: string;
  status_code?: number;
}

export interface User {
  id: number;
  email: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Stats {
  total_documents: number;
  total_results: number;
  total_analytes: number;
  processed_documents: number;
  pending_documents: number;
}

export interface DocumentCreate {
  user_id: number;
  filename: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  lab_name?: string;
  report_date?: string;
}

export interface AnalyteCreate {
  code: string;
  loinc_code?: string;
  name: string;
  description?: string;
  default_unit?: string;
  unit_category?: string;
  reference_ranges?: Record<string, any>;
}