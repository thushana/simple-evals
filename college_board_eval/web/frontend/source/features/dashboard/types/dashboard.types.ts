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
