import { apiClient, API_ENDPOINTS } from "../../../services/api";
import type {
  ExamTypesResponse,
  YearsResponse,
  UploadResponse,
  ProcessingStatus,
  ExamImagesResponse,
  Manifest,
} from "../types/examExtractor.types";

// Exam Types API
export const fetchExamTypes = async (): Promise<ExamTypesResponse> => {
  return apiClient.get<ExamTypesResponse>(API_ENDPOINTS.exams.types);
};

// Years API
export const fetchYears = async (): Promise<YearsResponse> => {
  return apiClient.get<YearsResponse>(API_ENDPOINTS.exams.years);
};

// File Upload API
export const uploadExamFile = async (
  file: File | null,
  slug: string,
  examType?: string,
  year?: number,
  pdfUrl?: string,
): Promise<UploadResponse> => {
  const formData = new FormData();
  if (file) {
    formData.append("file", file);
  }
  formData.append("slug", slug);

  if (examType) {
    formData.append("exam_type", examType);
  }

  if (year) {
    formData.append("year", year.toString());
  }

  if (pdfUrl) {
    formData.append("pdf_url", pdfUrl);
  }

  return apiClient.upload<UploadResponse>(API_ENDPOINTS.exams.upload, formData);
};

// Processing Status API
export const fetchProcessingStatus = async (
  processingId: string,
): Promise<ProcessingStatus> => {
  return apiClient.get<ProcessingStatus>(
    API_ENDPOINTS.exams.processing(processingId),
  );
};

// Exam Images API
export const fetchExamImages = async (
  examName: string,
): Promise<ExamImagesResponse> => {
  return apiClient.get<ExamImagesResponse>(
    API_ENDPOINTS.exams.images(examName),
  );
};

// Manifest API
export const fetchManifest = async (slug: string): Promise<Manifest> => {
  return apiClient.get<Manifest>(API_ENDPOINTS.exams.manifest(slug));
};
