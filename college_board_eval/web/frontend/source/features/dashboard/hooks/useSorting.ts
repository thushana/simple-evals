import { useState, useMemo } from "react";
import type {
  ResultEntry,
  SortField,
  SortConfig,
} from "../types/dashboard.types";

interface UseSortingReturn {
  sortedData: ResultEntry[];
  sortConfig: SortConfig;
  handleSort: (field: SortField) => void;
}

export const useSorting = (data: ResultEntry[]): UseSortingReturn => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: "date",
    direction: "desc",
  });

  const sortedData = useMemo(() => {
    const sorted = [...data].sort((a, b) => {
      // Special case: sort by star (is_best)
      if (sortConfig.field === "star") {
        if (a.is_best === b.is_best) return 0;
        if (sortConfig.direction === "asc") {
          return a.is_best ? -1 : 1; // true first
        } else {
          return a.is_best ? 1 : -1; // false first
        }
      }

      let aValue: unknown = a[sortConfig.field];
      let bValue: unknown = b[sortConfig.field];

      // Handle special cases
      if (sortConfig.field === "date") {
        aValue = new Date(aValue as string).getTime();
        bValue = new Date(bValue as string).getTime();
      }

      // Handle numeric values
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortConfig.direction === "asc"
          ? aValue - bValue
          : bValue - aValue;
      }

      // Handle string values
      if (typeof aValue === "string" && typeof bValue === "string") {
        const comparison = aValue.localeCompare(bValue);
        return sortConfig.direction === "asc" ? comparison : -comparison;
      }

      return 0;
    });

    return sorted;
  }, [data, sortConfig]);

  const handleSort = (field: SortField) => {
    setSortConfig((prevConfig) => ({
      field,
      direction:
        prevConfig.field === field && prevConfig.direction === "asc"
          ? "desc"
          : "asc",
    }));
  };

  return { sortedData, sortConfig, handleSort };
};
