import React, { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Alert,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Fade,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import type { JsonViewerState } from "../types/dashboard.types";

interface JsonViewerProps {
  state: JsonViewerState;
  onClose: () => void;
  questionId?: string;
}

interface QuestionInfo {
  id: string;
  type: string;
  isCorrect: boolean;
  modelAnswer: string;
  correctAnswer: string;
}

interface QuestionData {
  id: string;
  question: {
    type: string;
    question_text?: string;
    question_context?: string;
    question_image?: string;
    options?: Record<string, string>;
  };
  answer: {
    correct: string;
    explanation: string;
  };
  Response: {
    model_answer: string;
    model_answer_no_options?: string;
    explanation: string;
    generation_time: number;
  };
}

interface JsonData {
  exam_metadata: {
    exam_identifier: string;
    model_name: string;
    model_provider: string;
    score: number;
    score_average: number;
    time_timestamp: string;
    time_total_generation: number;
    questions_count: number;
  };
  questions: QuestionData[];
}

const KEY_COLOR = {
  correct: "#176b2c", // dark green
  incorrect: "#b91c1c", // dark red
  default: "#1e3a8a", // blue
};

export const JsonViewer: React.FC<JsonViewerProps> = ({
  state,
  onClose,
  questionId,
}) => {
  const [selectedQuestion, setSelectedQuestion] = useState<string>("");
  const [highlighted, setHighlighted] = useState<string>("");
  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const navigate = useNavigate();
  const { examSlug } = useParams<{ examSlug?: string }>();

  // Extract question information from the JSON data
  const dropdownQuestions = useMemo(() => {
    if (!state.data || typeof state.data !== "object") return [];
    const data = state.data as JsonData;
    if (!data.questions || !Array.isArray(data.questions)) return [];
    return data.questions.map((q: QuestionData) => {
      const isCorrect = q.Response?.model_answer === q.answer?.correct;
      const type = q.question?.type || "UNKNOWN";
      const typeDisplay =
        type === "MULTIPLE_CHOICE"
          ? "Multiple Choice"
          : type === "FREE_RESPONSE"
            ? "Free Response"
            : type === "SHORT_ANSWER"
              ? "Short Answer"
              : type;
      return {
        id: q.id,
        type: typeDisplay,
        isCorrect,
        modelAnswer: q.Response?.model_answer || "N/A",
        correctAnswer: q.answer?.correct || "N/A",
      };
    });
  }, [state.data]);

  // On open, if questionId is present, select and scroll to that question
  useEffect(() => {
    if (
      state.isOpen &&
      questionId &&
      dropdownQuestions.some((q) => q.id === questionId)
    ) {
      setSelectedQuestion(questionId);
      setTimeout(() => scrollToQuestion(questionId), 200);
    }
  }, [state.isOpen, questionId, dropdownQuestions]);

  // Helper to render JSON with colored keys
  const renderJson = (
    obj: unknown,
    indent = 0,
    keyColor = KEY_COLOR.default,
  ) => {
    if (typeof obj !== "object" || obj === null) {
      return <span style={{ color: "#6b7280" }}>{JSON.stringify(obj)}</span>;
    }
    if (Array.isArray(obj)) {
      return (
        <>
          [
          {obj.map((item) => (
            <div style={{ marginLeft: 20 }}>
              {renderJson(item, indent + 2, keyColor)}
            </div>
          ))}
          ]
        </>
      );
    }
    return (
      <>
        {"{"}
        {Object.entries(obj as Record<string, unknown>).map(([k, v]) => (
          <div key={k} style={{ marginLeft: 20 }}>
            <span style={{ color: keyColor, fontWeight: "bold" }}>"{k}":</span>{" "}
            {renderJson(v, indent + 2, keyColor)}
          </div>
        ))}
        {"}"}
      </>
    );
  };

  // Render all questions as separate blocks with anchors
  const renderQuestions = (data: JsonData) => {
    return data.questions.map((q) => {
      const isCorrect = q.Response?.model_answer === q.answer?.correct;
      const keyColor = isCorrect
        ? KEY_COLOR.correct
        : q.Response
          ? KEY_COLOR.incorrect
          : KEY_COLOR.default;
      return (
        <Fade in key={q.id} timeout={highlighted === q.id ? 400 : 0}>
          <div
            id={`question-${q.id}`}
            ref={(el) => {
              questionRefs.current[q.id] = el;
            }}
            style={{
              marginBottom: 16,
              borderRadius: 4,
              background: highlighted === q.id ? "#e0f7fa" : "transparent",
              transition: "background 0.5s",
              border: highlighted === q.id ? "2px solid #0677C9" : "none",
              padding: 8,
            }}
          >
            <span style={{ color: keyColor, fontWeight: "bold" }}>
              "id": "{q.id}"
            </span>
            {", "}
            {renderJson(q, 2, keyColor)}
          </div>
        </Fade>
      );
    });
  };

  const scrollToQuestion = (questionId: string) => {
    if (!questionId) return;
    const el = questionRefs.current[questionId];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setHighlighted(questionId);
      setTimeout(() => setHighlighted(""), 1200);
    }
  };

  const handleQuestionSelect = (questionId: string) => {
    setSelectedQuestion(questionId);
    scrollToQuestion(questionId);
    // Update the URL to include the selected question
    if (examSlug) {
      navigate(`/dashboard/${examSlug}/${questionId}`);
    }
  };

  // Render the rest of the JSON (metadata, etc.)
  const renderRestJson = (data: JsonData) => {
    const rest = { ...data } as Partial<JsonData>;
    delete rest.questions;
    return renderJson(rest, 0, KEY_COLOR.default);
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
        <Typography variant="h6" component="span" sx={{ color: "#0677C9" }}>
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
          <>
            {/* Question Navigation Dropdown */}
            {dropdownQuestions.length > 0 && (
              <Box sx={{ padding: 2, borderBottom: "1px solid #e0e0e0" }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Jump to Question</InputLabel>
                  <Select
                    value={selectedQuestion}
                    label="Jump to Question"
                    onChange={(e) => handleQuestionSelect(e.target.value)}
                  >
                    <MenuItem value="">
                      <em>Select a question...</em>
                    </MenuItem>
                    {dropdownQuestions.map((question: QuestionInfo) => (
                      <MenuItem key={question.id} value={question.id}>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <span>
                            {question.isCorrect ? "✅" : "❌"} {question.id} –{" "}
                            {question.type} 📃
                          </span>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            )}
            {/* JSON Content */}
            <Box
              data-json-scroll-container
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
              }}
            >
              {/* Render metadata and other fields */}
              {state.data && renderRestJson(state.data as JsonData)}
              {/* Render questions as separate blocks */}
              {state.data && renderQuestions(state.data as JsonData)}
            </Box>
          </>
        ) : (
          <Box sx={{ padding: 2, textAlign: "center" }}>
            <Typography>Loading...</Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};
