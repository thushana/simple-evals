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

export const Dashboard: React.FC = () => {
  const { data, loading, error, refresh } = useResultsData();
  const { sortedData, sortConfig, handleSort } = useSorting(
    data?.results || [],
  );
  const { jsonViewerState, openJsonViewer, closeJsonViewer } = useJsonViewer();

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
          onViewJson={openJsonViewer}
        />
        <JsonViewer state={jsonViewerState} onClose={closeJsonViewer} />
        {/* Metadata at the bottom */}
        {data.metadata && (
          <Box sx={{ mt: 4, textAlign: 'center', color: 'text.secondary' }}>
            <Typography
              variant="body2"
              color="text.secondary"
            >
              Generated on {new Date(data.metadata.generated_on).toLocaleString()} by {data.metadata.author_name}
            </Typography>
          </Box>
        )}
      </Container>
    </>
  );
};
