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
  Button,
} from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { API_ENDPOINTS } from "../../../services/api";

interface QuestionManagerProps {
  questionKey: string | null;
  imageUrl?: string;
  extracting?: boolean;
  error?: boolean;
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

// Add PrettyJson component for pretty/styled JSON rendering (Light theme)
const LIGHT_THEME_COLORS = {
  key: "#267f99",
  string: "#a31515",
  number: "#098658",
  boolean: "#0000ff",
  null: "#0000ff",
  punctuation: "#333",
  text: "#333",
};

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

function PrettyJson({ data }: { data: JsonValue }) {
  function render(value: JsonValue, indent = 0) {
    if (typeof value === "string") {
      return (
        <span style={{ color: LIGHT_THEME_COLORS.string }}>
          &quot;{value}&quot;
        </span>
      );
    }
    if (typeof value === "number") {
      return <span style={{ color: LIGHT_THEME_COLORS.number }}>{value}</span>;
    }
    if (typeof value === "boolean") {
      return (
        <span style={{ color: LIGHT_THEME_COLORS.boolean }}>
          {String(value)}
        </span>
      );
    }
    if (value === null) {
      return <span style={{ color: LIGHT_THEME_COLORS.null }}>null</span>;
    }
    if (Array.isArray(value)) {
      return (
        <>
          <span style={{ color: LIGHT_THEME_COLORS.punctuation }}>[</span>
          {value.map((item, i) => (
            <div key={i} style={{ marginLeft: 20 }}>
              {render(item, indent + 2)}
              {i < value.length - 1 ? (
                <span style={{ color: LIGHT_THEME_COLORS.punctuation }}>,</span>
              ) : null}
            </div>
          ))}
          <span style={{ color: LIGHT_THEME_COLORS.punctuation }}>]</span>
        </>
      );
    }
    if (typeof value === "object") {
      const entries = Object.entries(value);
      return (
        <>
          <span style={{ color: LIGHT_THEME_COLORS.punctuation }}>{"{"}</span>
          {entries.map(([k, v], i) => (
            <div key={k} style={{ marginLeft: 20 }}>
              <span
                style={{ color: LIGHT_THEME_COLORS.key, fontWeight: "bold" }}
              >
                &quot;{k}&quot;
              </span>
              <span style={{ color: LIGHT_THEME_COLORS.punctuation }}>: </span>
              {render(v, indent + 2)}
              {i < entries.length - 1 ? (
                <span style={{ color: LIGHT_THEME_COLORS.punctuation }}>,</span>
              ) : null}
            </div>
          ))}
          <span style={{ color: LIGHT_THEME_COLORS.punctuation }}>{"}"}</span>
        </>
      );
    }
    return (
      <span style={{ color: LIGHT_THEME_COLORS.text }}>{String(value)}</span>
    );
  }
  return (
    <pre
      style={{
        fontFamily: "Roboto Mono, monospace",
        fontSize: "0.8em",
        background: "none",
        color: LIGHT_THEME_COLORS.text,
        padding: 0,
        borderRadius: 0,
        overflowX: "auto",
        whiteSpace: "pre-wrap",
        border: "none",
        boxShadow: "none",
        margin: 0,
      }}
    >
      {render(data)}
    </pre>
  );
}

export const QuestionManager: React.FC<QuestionManagerProps> = ({
  questionKey,
  imageUrl,
  extracting,
  error,
}) => {
  const [questionTypes, setQuestionTypes] = useState<
    QuestionTypeRegistryEntry[]
  >([]);
  const [selectedType, setSelectedType] = useState<string>("");
  const [schema, setSchema] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSchema, setShowSchema] = useState(false);
  const [extractingJson, setExtractingJson] = useState(false);
  const [extractedJson, setExtractedJson] = useState<JsonValue | null>(null);

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

  useEffect(() => {
    setExtractedJson(null);
    setExtractingJson(false);
  }, [questionKey]);

  const handleExtractJson = async () => {
    if (!imageUrl || !schema) return;
    setExtractingJson(true);
    setExtractedJson(null);
    try {
      const resp = await fetch(API_ENDPOINTS.exams.extractJsonFromImage, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_url: imageUrl, json_schema: schema }),
      });
      const data = await resp.json();
      setExtractedJson(data.result_json || data);
    } catch {
      setExtractedJson({ error: "Failed to extract JSON" });
    } finally {
      setExtractingJson(false);
    }
  };

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
      {/* Show image extraction state */}
      {questionKey && (
        <Box sx={{ mb: 2 }}>
          {extracting ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CircularProgress size={20} />
              <Typography variant="body2">Extracting image…</Typography>
            </Box>
          ) : error ? (
            <Typography variant="body2" color="error">
              Error extracting image
            </Typography>
          ) : imageUrl ? (
            <Box
              sx={{ border: "1px solid #eee", borderRadius: 1, p: 1, mb: 1 }}
            >
              <img
                src={imageUrl}
                alt="Extracted question"
                style={{
                  maxWidth: "100%",
                  maxHeight: 200,
                  display: "block",
                  margin: "0 auto",
                }}
              />
            </Box>
          ) : null}
        </Box>
      )}
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
      {selectedType && imageUrl && schema && (
        <Box sx={{ mt: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleExtractJson}
            disabled={extractingJson}
            startIcon={
              extractingJson ? (
                <CircularProgress size={18} color="inherit" />
              ) : null
            }
          >
            {extractingJson ? "Extracting..." : "Extract from image"}
          </Button>
          {extractedJson && (
            <Box sx={{ mt: 2, bgcolor: "#fff", p: 2, borderRadius: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, color: "#009cde" }}>
                Extracted JSON:
              </Typography>
              <PrettyJson data={extractedJson} />
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};
