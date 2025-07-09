import { useState } from "react";
import type { JsonViewerState, ResultEntry } from "../types/dashboard.types";
import type { JsonData } from "../types/dashboard.types";

interface UseJsonViewerReturn {
  jsonViewerState: JsonViewerState;
  openJsonViewer: (opts: {
    title: string;
    data: ResultEntry | JsonData;
    questionId?: string;
  }) => void;
  closeJsonViewer: () => void;
}

export const useJsonViewer = (): UseJsonViewerReturn => {
  const [jsonViewerState, setJsonViewerState] = useState<JsonViewerState>({
    isOpen: false,
    data: null,
    title: "",
    error: null,
  });

  const openJsonViewer = async (opts: {
    title: string;
    data: ResultEntry | JsonData;
    questionId?: string;
  }) => {
    // If data has a questions array, use it directly
    if (opts.data && Array.isArray((opts.data as JsonData).questions)) {
      setJsonViewerState({
        isOpen: true,
        data: opts.data,
        title: opts.title,
        error: null,
      });
      return;
    }
    // Otherwise, treat as ResultEntry and fetch the full JSON
    try {
      setJsonViewerState({
        isOpen: true,
        data: null,
        title: opts.title,
        error: null,
      });
      const filename = (opts.data as ResultEntry).results;
      const response = await fetch(`/results/${filename}`);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch JSON file: ${response.status} ${response.statusText}`,
        );
      }
      const data = await response.json();
      setJsonViewerState({
        isOpen: true,
        data,
        title: opts.title,
        error: null,
      });
    } catch (error) {
      setJsonViewerState({
        isOpen: true,
        data: null,
        title: opts.title,
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  };

  const closeJsonViewer = () => {
    setJsonViewerState({
      isOpen: false,
      data: null,
      title: "",
      error: null,
    });
  };

  return { jsonViewerState, openJsonViewer, closeJsonViewer };
};
