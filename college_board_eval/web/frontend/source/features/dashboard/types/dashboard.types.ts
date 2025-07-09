export interface ResultsData {
  metadata: {
    generated_on: string;
    author_name: string;
    author_email: string;
  };
  results: ResultEntry[];
}

export interface ResultEntry {
  exam: string;
  model: string;
  provider: string;
  accuracy: number;
  score: number;
  total_possible: number;
  questions: number;
  time: number;
  date: string;
  is_best: boolean;
  results: string; // filename
}

export type SortField =
  | "star"
  | "exam"
  | "model"
  | "provider"
  | "accuracy"
  | "score"
  | "time"
  | "date";
export type SortDirection = "asc" | "desc";

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

export interface JsonViewerState {
  isOpen: boolean;
  data: unknown | null;
  title: string;
  error: string | null;
}

export interface JsonData {
  exam_metadata: {
    exam_identifier: string;
    model_name: string;
    model_provider: string;
    score: number;
    score_average: number;
    time_timestamp: string;
    time_total_generation: number;
    questions_count: number;
  };
  questions: Array<{
    id: string;
    question: {
      type: string;
      question_text?: string;
      question_context?: string;
      question_image?: string;
      options?: Record<string, string>;
    };
    answer: {
      correct: string;
      explanation: string;
    };
    Response: {
      model_answer: string;
      model_answer_no_options?: string;
      explanation: string;
      generation_time: number;
    };
    metadata?: Record<string, unknown>;
  }>;
}
