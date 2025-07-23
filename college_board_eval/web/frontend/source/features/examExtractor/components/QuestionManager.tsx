import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Collapse,
} from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

interface QuestionManagerProps {
  questionKey: string | null;
}

interface QuestionTypeRegistryEntry {
  question_type: string;
  schemaUrl: string;
  question_emoji?: string;
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
  color: "#d32f2f", // match COLORS.question.primary
  border: "1px solid #d32f2f",
  boxShadow: "none",
};

export const QuestionManager: React.FC<QuestionManagerProps> = ({
  questionKey,
}) => {
  const [questionTypes, setQuestionTypes] = useState<
    QuestionTypeRegistryEntry[]
  >([]);
  const [selectedType, setSelectedType] = useState<string>("");
  const [schema, setSchema] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSchema, setShowSchema] = useState(false);

  // Load registry on mount
  useEffect(() => {
    fetch("/QuestionType/index.json")
      .then((res) => res.json())
      .then((data) => setQuestionTypes(data))
      .catch(() => setQuestionTypes([]));
  }, []);

  // Load schema when type changes
  useEffect(() => {
    if (!selectedType) return;
    const entry = questionTypes.find((q) => q.question_type === selectedType);
    if (!entry) return;
    setLoading(true);
    fetch(`/QuestionType/${entry.schemaUrl.replace("./", "")}`)
      .then((res) => res.json())
      .then((data) => setSchema(data))
      .catch(() => setSchema(null))
      .finally(() => setLoading(false));
  }, [selectedType, questionTypes]);

  return (
    <Box sx={{ p: 2 }}>
      {/* Header: Question Key */}
      <Box sx={{ mb: 2 }}>
        {questionKey ? (
          <Box sx={QUESTION_PILL_STYLE}>
            <Typography
              variant="body2"
              sx={{ fontWeight: 600, fontFamily: "Roboto Mono, monospace" }}
            >
              {questionKey}
            </Typography>
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No question selected
          </Typography>
        )}
      </Box>
      {/* Only show options if a question is selected */}
      {questionKey && (
        <>
          <FormControl fullWidth>
            <InputLabel id="question-type-label">Question Type</InputLabel>
            <Select
              labelId="question-type-label"
              value={selectedType}
              label="Question Type"
              onChange={(e) => setSelectedType(e.target.value)}
            >
              {questionTypes.length === 0 && (
                <MenuItem value="" disabled>
                  No types available
                </MenuItem>
              )}
              {questionTypes.map((qt) => (
                <MenuItem key={qt.question_type} value={qt.question_type}>
                  <span style={{ marginRight: 8 }}>
                    {qt.question_emoji ?? ""}
                  </span>
                  {qt.question_type
                    .replace(/_/g, " ")
                    .toLowerCase()
                    .replace(/\b\w/g, (c) => c.toUpperCase())}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {loading && <CircularProgress size={24} />}
          {selectedType && !loading && (
            <Box sx={{ mt: 0.25 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  mb: 0,
                  cursor: "pointer",
                  userSelect: "none",
                }}
                onClick={() => setShowSchema((prev) => !prev)}
                aria-label={showSchema ? "Hide schema" : "Show schema"}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => {
                  if (e.key === "Enter" || e.key === " ")
                    setShowSchema((prev) => !prev);
                }}
              >
                {showSchema ? (
                  <ExpandMoreIcon fontSize="small" />
                ) : (
                  <ChevronRightIcon fontSize="small" />
                )}
                <Typography variant="caption" color="text.secondary">
                  See Schema
                </Typography>
              </Box>
              <Collapse in={showSchema}>
                <Typography
                  variant="body2"
                  sx={{
                    mt: 1,
                    fontFamily: "monospace",
                    whiteSpace: "pre-wrap",
                    fontSize: "0.8em",
                  }}
                >
                  {schema
                    ? JSON.stringify(schema, null, 2)
                    : "No schema loaded."}
                </Typography>
              </Collapse>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};
