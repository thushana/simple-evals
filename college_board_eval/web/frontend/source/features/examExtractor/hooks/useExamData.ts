import { useState, useEffect } from "react";
import type {
  ExamTypesResponse,
  YearsResponse,
} from "../types/examExtractor.types";
import { fetchExamTypes, fetchYears } from "../utils/api";

export const useExamData = () => {
  const [examTypes, setExamTypes] = useState<ExamTypesResponse | null>(null);
  const [years, setYears] = useState<YearsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadExamData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch exam types and years in parallel
        const [examTypesData, yearsData] = await Promise.all([
          fetchExamTypes(),
          fetchYears(),
        ]);

        setExamTypes(examTypesData);
        setYears(yearsData);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load exam data",
        );
      } finally {
        setLoading(false);
      }
    };

    loadExamData();
  }, []);

  return {
    examTypes,
    years,
    loading,
    error,
  };
};
