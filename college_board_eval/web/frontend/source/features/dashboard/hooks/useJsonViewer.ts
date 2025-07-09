import { useState } from "react";
import type { JsonViewerState } from "../types/dashboard.types";

interface UseJsonViewerReturn {
  jsonViewerState: JsonViewerState;
  openJsonViewer: (filename: string, title: string) => Promise<void>;
  closeJsonViewer: () => void;
}

export const useJsonViewer = (): UseJsonViewerReturn => {
  const [jsonViewerState, setJsonViewerState] = useState<JsonViewerState>({
    isOpen: false,
    data: null,
    title: "",
    error: null,
  });

  const openJsonViewer = async (filename: string, title: string) => {
    try {
      setJsonViewerState({
        isOpen: true,
        data: null,
        title,
        error: null,
      });

      // Fetch the JSON file from the results directory
      const response = await fetch(`/results/${filename}`);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch JSON file: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();

      setJsonViewerState((prev) => ({
        ...prev,
        data,
        isOpen: true,
      }));
    } catch (error) {
      setJsonViewerState((prev) => ({
        ...prev,
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
        isOpen: true,
      }));
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
