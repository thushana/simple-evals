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

// Upload Response
export interface UploadResponse {
  message: string;
  filename: string;
  file_path: string;
  exam_folder: string;
  exam_processing_dir: string;
  size: number;
  upload_time: string;
  processing: string;
  processing_id: string;
}

// Processing Status
export interface ProcessingStatus {
  status: "uploaded" | "processing" | "completed" | "error";
  progress: number;
  message: string;
  filename: string;
  file_path: string;
  exam_folder: string;
  exam_processing_dir: string;
  size: number;
  upload_time: string;
  total_pages: number;
  processed_pages: number;
  error: string | null;
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
