// Exam Types API Response
export interface ExamCategory {
  category_id: string;
  category_name: string;
  category_icon: string;
  exams: Exam[];
}

export interface Exam {
  exam_id: string;
  exam_name: string;
  exam_icon: string;
  exam_details_url: string;
}

export interface ExamTypesResponse {
  categories: ExamCategory[];
}

// Years API Response
export interface YearsResponse {
  years: number[];
}

// Upload Form State
export interface ExamUploadForm {
  examType: string;
  year: string; // changed from number to string
  file: File | null;
  sourceUrl: string;
  pdfUrl: string;
  uploadMethod: "upload" | "grab" | null;
}

// Upload Response (now returns manifest metadata)
export interface UploadResponse {
  slug: string;
  exam_id: string;
  exam_year: number;
  file_name: string;
  file_original_url: string | null;
  file_size_bytes: number;
  file_total_pages: number;
  processing_started: string;
  processing_completed: boolean;
  processing_pages_complete: number;
  processing_status: string;
  error: string | null;
  exam_processing_dir: string;
}

// Image Result
export interface ExamImage {
  filename: string;
  type: "thumbnail" | "full_resolution";
  path: string;
}

export interface ExamImagesResponse {
  exam_name: string;
  images: ExamImage[];
  total_pages: number;
}

// Manifest types
export interface ManifestPage {
  page_number: number;
  full: string;
  preview: string;
  thumb: string;
}

export interface ManifestMetadata {
  slug: string;
  exam_id: string;
  exam_year: number;
  file_name: string;
  file_original_url: string | null;
  file_size_bytes: number;
  file_total_pages: number;
  processing_started: string;
  processing_completed: boolean;
  processing_pages_complete: number;
  processing_status: string;
  error: string | null;
  exam_processing_dir: string;
}

export interface Manifest {
  metadata: ManifestMetadata;
  pages: ManifestPage[];
}
