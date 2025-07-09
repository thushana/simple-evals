import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import type { JsonViewerState } from "../types/dashboard.types";

interface JsonViewerProps {
  state: JsonViewerState;
  onClose: () => void;
}

export const JsonViewer: React.FC<JsonViewerProps> = ({ state, onClose }) => {
  const syntaxHighlight = (json: string): string => {
    return json.replace(/(".*?":|".*?"|true|false|null|\d+)/g, (match) => {
      let className = "";
      if (match.endsWith(":")) {
        className = "json-key";
      } else if (match.startsWith('"') && match.endsWith('"')) {
        className = "json-string";
      } else if (match === "true" || match === "false") {
        className = "json-boolean";
      } else if (match === "null") {
        className = "json-null";
      } else {
        className = "json-number";
      }

      return `<span class="${className}">${match}</span>`;
    });
  };

  return (
    <Dialog
      open={state.isOpen}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: "90vh",
          minHeight: "60vh",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "#f5f5f5",
          borderBottom: "1px solid #e0e0e0",
        }}
      >
        <Typography variant="h6" sx={{ color: "#0677C9" }}>
          {state.title}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ padding: 0 }}>
        {state.error ? (
          <Alert severity="error" sx={{ margin: 2 }}>
            {state.error}
          </Alert>
        ) : state.data ? (
          <Box
            sx={{
              padding: 2,
              backgroundColor: "#f8f8f8",
              borderRadius: 1,
              margin: 2,
              fontFamily: "Roboto Mono, monospace",
              fontSize: "0.875rem",
              overflow: "auto",
              maxHeight: "70vh",
              whiteSpace: "pre",
              "& .json-key": {
                color: "#1e3a8a",
                fontWeight: "bold",
              },
              "& .json-string": {
                color: "#6b7280",
              },
              "& .json-number": {
                color: "#6b7280",
              },
              "& .json-boolean": {
                color: "#6b7280",
              },
              "& .json-null": {
                color: "#6b7280",
                fontStyle: "italic",
              },
            }}
            dangerouslySetInnerHTML={{
              __html: syntaxHighlight(JSON.stringify(state.data, null, 2)),
            }}
          />
        ) : (
          <Box sx={{ padding: 2, textAlign: "center" }}>
            <Typography>Loading...</Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};
