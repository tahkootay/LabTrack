import axios from 'axios';
import { Document, Result, Analyte, TrendsData } from '../types/api';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Функция для обработки ошибок API
const handleApiError = (error: any) => {
  let errorMessage = 'Произошла неожиданная ошибка';
  
  if (error.response) {
    // Сервер вернул ошибку с кодом статуса
    const status = error.response.status;
    const data = error.response.data;
    
    switch (status) {
      case 400:
        errorMessage = data?.detail || 'Неверные данные запроса';
        break;
      case 401:
        errorMessage = 'Необходима авторизация';
        break;
      case 403:
        errorMessage = 'Доступ запрещен';
        break;
      case 404:
        errorMessage = 'Ресурс не найден';
        break;
      case 422:
        if (data?.detail && Array.isArray(data.detail)) {
          errorMessage = data.detail.map((err: any) => `${err.loc.join('.')}: ${err.msg}`).join(', ');
        } else {
          errorMessage = data?.detail || 'Ошибка валидации данных';
        }
        break;
      case 429:
        errorMessage = 'Слишком много запросов, попробуйте позже';
        break;
      case 500:
        errorMessage = 'Внутренняя ошибка сервера';
        break;
      default:
        errorMessage = data?.detail || data?.message || `Ошибка сервера (${status})`;
    }
  } else if (error.request) {
    // Запрос был отправлен, но ответа не получено
    errorMessage = 'Сервер не отвечает. Проверьте подключение к интернету.';
  } else {
    // Что-то еще
    errorMessage = error.message || 'Произошла неожиданная ошибка';
  }
  
  console.error('API Error:', error);
  
  const enhancedError = new Error(errorMessage);
  enhancedError.name = 'ApiError';
  (enhancedError as any).originalError = error;
  (enhancedError as any).status = error.response?.status;
  
  return enhancedError;
};

// Interceptors для обработки ошибок
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(handleApiError(error));
  }
);

export const documentsApi = {
  upload: async (file: File, labName?: string, reportDate?: string): Promise<Document> => {
    const formData = new FormData();
    formData.append('file', file);
    if (labName) formData.append('lab_name', labName);
    if (reportDate) formData.append('report_date', reportDate);

    const response = await apiClient.post<Document>('/api/v1/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getAll: async (params?: {
    skip?: number;
    limit?: number;
    status?: string;
  }): Promise<Document[]> => {
    const response = await apiClient.get<Document[]>('/api/v1/documents/', { params });
    return response.data;
  },

  getById: async (id: number): Promise<Document> => {
    const response = await apiClient.get<Document>(`/api/v1/documents/${id}`);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/v1/documents/${id}`);
  },

  reprocess: async (id: number): Promise<void> => {
    await apiClient.post(`/api/v1/documents/${id}/reprocess`);
  },
};

export const resultsApi = {
  getAll: async (params?: {
    skip?: number;
    limit?: number;
    analyte_id?: number;
    document_id?: number;
    date_from?: string;
    date_to?: string;
    out_of_range?: boolean;
    suspect?: boolean;
  }): Promise<Result[]> => {
    const response = await apiClient.get<Result[]>('/api/v1/results/', { params });
    return response.data;
  },

  getById: async (id: number): Promise<Result> => {
    const response = await apiClient.get<Result>(`/api/v1/results/${id}`);
    return response.data;
  },

  update: async (id: number, data: Partial<Result>): Promise<Result> => {
    const response = await apiClient.put<Result>(`/api/v1/results/${id}`, data);
    return response.data;
  },

  getAnalyteHistory: async (analyteId: number, params?: {
    skip?: number;
    limit?: number;
  }): Promise<Result[]> => {
    const response = await apiClient.get<Result[]>(`/api/v1/results/analyte/${analyteId}/history`, { params });
    return response.data;
  },

  getSummary: async (params?: {
    date_from?: string;
    date_to?: string;
    search?: string;
    lab_name?: string;
    out_of_range_only?: boolean;
  }): Promise<any[]> => {
    const response = await apiClient.get<any[]>('/api/v1/results/summary', { params });
    return response.data;
  },

  getTrends: async (params?: {
    analyte_ids?: number[];
    days?: number;
  }): Promise<TrendsData> => {
    const response = await apiClient.get<TrendsData>('/api/v1/results/trends/summary', { params });
    return response.data;
  },

  createManual: async (data: {
    document_id: number;
    analyte_id?: number;
    source_label: string;
    raw_value: string;
    raw_unit?: string;
    raw_reference_range?: string;
    lab_comments?: string;
  }): Promise<Result> => {
    const response = await apiClient.post<Result>('/api/v1/results/manual', data);
    return response.data;
  },
};

export const analytesApi = {
  getAll: async (params?: {
    skip?: number;
    limit?: number;
    search?: string;
    active_only?: boolean;
  }): Promise<Analyte[]> => {
    const response = await apiClient.get<Analyte[]>('/api/v1/analytes/', { params });
    return response.data;
  },

  getById: async (id: number): Promise<Analyte> => {
    const response = await apiClient.get<Analyte>(`/api/v1/analytes/${id}`);
    return response.data;
  },

  create: async (data: Omit<Analyte, 'id' | 'is_active'>): Promise<Analyte> => {
    const response = await apiClient.post<Analyte>('/api/v1/analytes/', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Analyte>): Promise<Analyte> => {
    const response = await apiClient.put<Analyte>(`/api/v1/analytes/${id}`, data);
    return response.data;
  },

  searchMappings: async (sourceLabel: string, labName?: string) => {
    const response = await apiClient.get('/api/v1/analytes/mappings/search', {
      params: { source_label: sourceLabel, lab_name: labName },
    });
    return response.data;
  },

  validateMapping: async (sourceLabel: string, analyteId: number, labName?: string) => {
    const response = await apiClient.post('/api/v1/analytes/mappings/validate', {
      source_label: sourceLabel,
      analyte_id: analyteId,
      lab_name: labName,
    });
    return response.data;
  },
};

export default apiClient;