import React from "react";
import { IconButton, Tooltip } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";

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
  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = `/results/${filename}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
