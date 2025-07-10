import { useState, useEffect } from "react";
import type { ResultsData } from "../types/dashboard.types";
import { apiClient, API_ENDPOINTS } from "../../../services/api";

interface UseResultsDataReturn {
  data: ResultsData | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export const useResultsData = (): UseResultsDataReturn => {
  const [data, setData] = useState<ResultsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const jsonData: ResultsData = await apiClient.get(API_ENDPOINTS.results.index);
      setData(jsonData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred",
      );
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    fetchData();
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, error, refresh };
};
