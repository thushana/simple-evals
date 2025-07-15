import { apiClient, API_ENDPOINTS } from "../../../services/api";
import type {
  ExamTypesResponse,
  YearsResponse,
  UploadResponse,
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
  console.log(
    `[DEBUG ${new Date().toISOString()}] uploadExamFile called with:`,
    { file: file?.name, slug, examType, year, pdfUrl },
  );
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

  console.log(
    `[DEBUG ${new Date().toISOString()}] uploadExamFile calling apiClient.upload with URL:`,
    API_ENDPOINTS.exams.upload,
  );
  const result = await apiClient.upload<UploadResponse>(
    API_ENDPOINTS.exams.upload,
    formData,
  );
  console.log(
    `[DEBUG ${new Date().toISOString()}] uploadExamFile received response:`,
    result,
  );
  return result;
};

// Manifest API
export const fetchManifest = async (slug: string): Promise<Manifest> => {
  console.log(
    `[DEBUG ${new Date().toISOString()}] fetchManifest called with slug:`,
    slug,
  );
  console.log(
    `[DEBUG ${new Date().toISOString()}] fetchManifest URL:`,
    API_ENDPOINTS.exams.manifest(slug),
  );
  const result = await apiClient.get<Manifest>(
    API_ENDPOINTS.exams.manifest(slug),
  );
  console.log(
    `[DEBUG ${new Date().toISOString()}] fetchManifest result:`,
    result,
  );
  return result;
};
