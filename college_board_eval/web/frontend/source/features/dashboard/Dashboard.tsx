import React from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Container,
} from "@mui/material";
import { useResultsData } from "./hooks/useResultsData";
import { useSorting } from "./hooks/useSorting";
import { useJsonViewer } from "./hooks/useJsonViewer";
import { ResultsTable } from "./components/ResultsTable";
import { JsonViewer } from "./components/JsonViewer";
import { useParams, useNavigate } from "react-router-dom";
import type { ResultEntry } from "./types/dashboard.types";

export const Dashboard: React.FC = () => {
  const { examSlug, questionId } = useParams<{
    examSlug?: string;
    questionId?: string;
  }>();
  const navigate = useNavigate();
  const { data, loading, error, refresh } = useResultsData();
  const { sortedData, sortConfig, handleSort } = useSorting(
    data?.results || [],
  );
  const { jsonViewerState, openJsonViewer, closeJsonViewer } = useJsonViewer();
  const lastAutoOpened = React.useRef<{
    examSlug?: string;
    questionId?: string;
  }>({});

  // Auto-open JSON viewer for deep link
  React.useEffect(() => {
    if (!examSlug || !data || !data.results) return;
    // Only auto-open if we haven't already for this slug/question
    if (
      lastAutoOpened.current.examSlug === examSlug &&
      lastAutoOpened.current.questionId === questionId
    ) {
      return;
    }
    const exam = data.results.find(
      (r) => r.results.replace(/\.json$/, "") === examSlug,
    );
    if (exam) {
      openJsonViewer({
        title: `${exam.exam} - ${exam.model} (${exam.provider})`,
        data: exam,
        questionId: questionId || undefined,
      });
      lastAutoOpened.current = { examSlug, questionId };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examSlug, questionId, data]);

  // When user opens a question, update the URL
  const handleViewJson = (exam: ResultEntry, questionId?: string) => {
    const slug = exam.results.replace(/\.json$/, "");
    if (questionId) {
      navigate(`/dashboard/${slug}/${questionId}`);
    } else {
      navigate(`/dashboard/${slug}`);
    }
    openJsonViewer(
      {
        title: `${exam.exam} - ${exam.model} (${exam.provider})`,
        data: exam,
        questionId: questionId || undefined,
      },
      // TODO: Pass only the required argument here. Replace with the correct value or remove the extra argument.
    );
  };

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "400px",
            gap: 2,
          }}
        >
          <CircularProgress size={60} sx={{ color: "#0677C9" }} />
          <Typography variant="h6" color="text.secondary">
            Loading evaluation results...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ mt: 4 }}>
          <Alert
            severity="error"
            sx={{ mb: 2 }}
            action={
              <Typography
                component="span"
                sx={{ cursor: "pointer", textDecoration: "underline" }}
                onClick={refresh}
              >
                Retry
              </Typography>
            }
          >
            Failed to load evaluation results: {error}
          </Alert>
        </Box>
      </Container>
    );
  }

  if (!data || !data.results.length) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ mt: 4, textAlign: "center" }}>
          <Alert severity="info">
            No evaluation results found. Please run some evaluations first.
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <>
      {/* Hero Section for Dashboard (full width) */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #009cde 0%, #0077c8 100%)",
          color: "#fff",
          py: { xs: 4, md: 5 },
          px: 2,
          textAlign: "center",
          mb: 4,
        }}
      >
        <Container maxWidth="md">
          <Typography
            variant="h1"
            component="h1"
            sx={{
              fontWeight: 700,
              color: "#fff",
              mb: 2,
              fontSize: { xs: "1.5rem", md: "2.2rem" },
            }}
          >
            <span role="img" aria-label="trending">
              📊
            </span>{" "}
            AP Evaluation Results Dashboard
          </Typography>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 500,
              color: "#fff",
              mb: 0,
              fontSize: { xs: "1.2rem", md: "1.5rem" },
            }}
          >
            View and analyze model performance
          </Typography>
        </Container>
      </Box>
      {/* End Hero Section */}
      <Container maxWidth="xl" sx={{ py: 0 }}>
        <ResultsTable
          data={sortedData}
          sortConfig={sortConfig}
          onSort={handleSort}
          onViewJson={handleViewJson}
        />
        <JsonViewer
          state={jsonViewerState}
          onClose={closeJsonViewer}
          questionId={questionId}
        />
        {/* Metadata at the bottom */}
        {data.metadata && (
          <Box sx={{ mt: 4, textAlign: "center", color: "text.secondary" }}>
            <Typography variant="body2" color="text.secondary">
              Generated on{" "}
              {new Date(data.metadata.generated_on).toLocaleString()} by{" "}
              {data.metadata.author_name}
            </Typography>
          </Box>
        )}
      </Container>
    </>
  );
};
