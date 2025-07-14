// API Configuration
export const API_BASE_URL = "http://localhost:8000";

// API Endpoints
export const API_ENDPOINTS = {
  // Results endpoints
  results: {
    index: `${API_BASE_URL}/api/v1/results/`,
    file: (filename: string) => `${API_BASE_URL}/api/v1/results/${filename}`,
  },
  // Exam endpoints
  exams: {
    types: `${API_BASE_URL}/api/v1/exams/types`,
    years: `${API_BASE_URL}/api/v1/exams/years`,
    upload: `${API_BASE_URL}/api/v1/exams/upload`,
    images: (examName: string) =>
      `${API_BASE_URL}/api/v1/exams/${examName}/images`,
    processing: (processingId: string) =>
      `${API_BASE_URL}/api/v1/exams/processing/${processingId}`,
  },
  // Health check
  health: `${API_BASE_URL}/health`,
} as const;

// API Client utilities
export const apiClient = {
  async get<T>(url: string): Promise<T> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}`,
      );
    }
    return response.json();
  },

  async post<T>(url: string, data?: unknown): Promise<T> {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!response.ok) {
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}`,
      );
    }
    return response.json();
  },

  async upload<T>(url: string, formData: FormData): Promise<T> {
    const response = await fetch(url, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}`,
      );
    }
    return response.json();
  },

  async download(url: string): Promise<Blob> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Download failed: ${response.status} ${response.statusText}`,
      );
    }
    return response.blob();
  },
};
