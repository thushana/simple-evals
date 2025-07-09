import { useState, useEffect } from 'react';
import type { ResultsData } from '../types/dashboard.types';

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
      
      // Fetch from the existing index.json location
      const response = await fetch('/results/index.json');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
      }
      
      const jsonData: ResultsData = await response.json();
      setData(jsonData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
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