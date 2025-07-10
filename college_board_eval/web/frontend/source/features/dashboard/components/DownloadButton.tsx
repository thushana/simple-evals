import React from "react";
import { IconButton, Tooltip } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import { apiClient, API_ENDPOINTS } from "../../../services/api";

interface DownloadButtonProps {
  filename: string;
  exam: string;
  model: string;
}

export const DownloadButton: React.FC<DownloadButtonProps> = ({
  filename,
  exam,
  model,
}) => {
  const handleDownload = async () => {
    try {
      const blob = await apiClient.download(API_ENDPOINTS.results.file(filename));
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      // You could add a toast notification here if desired
    }
  };

  return (
    <Tooltip title={`Download ${exam} - ${model} results`}>
      <IconButton
        onClick={handleDownload}
        size="small"
        sx={{
          color: "#0677C9",
          "&:hover": {
            backgroundColor: "rgba(6, 119, 201, 0.1)",
          },
        }}
      >
        <DownloadIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
};
