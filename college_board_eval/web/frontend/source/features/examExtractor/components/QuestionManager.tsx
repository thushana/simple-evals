import React from "react";
import { Box, Typography } from "@mui/material";
import type { BoundingBox } from "../types/examExtractor.types";

interface QuestionManagerProps {
  selectedQuestion: BoundingBox | null;
  questionKey: string | null;
}

const QUESTION_PILL_STYLE = {
  display: "inline-flex",
  alignItems: "center",
  borderRadius: 1,
  fontFamily: "Roboto Mono, monospace",
  fontWeight: 600,
  fontSize: "0.95em",
  height: 32,
  minWidth: 120,
  px: 2,
  py: 0.5,
  bgcolor: "#ffebee", // match COLORS.question.light
  color: "#d32f2f",   // match COLORS.question.primary
  border: "1px solid #d32f2f",
  boxShadow: "none",
};

export const QuestionManager: React.FC<QuestionManagerProps> = ({ selectedQuestion, questionKey }) => {
  return (
    <Box sx={{ p: 2 }}>
      {selectedQuestion && questionKey ? (
        <Box sx={QUESTION_PILL_STYLE}>
          <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: "Roboto Mono, monospace" }}>
            {questionKey}
          </Typography>
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary">
          Select a question to view details.
        </Typography>
      )}
    </Box>
  );
}; 