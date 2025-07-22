import React, { useEffect } from "react";
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  CircularProgress,
  Stack,
  ListSubheader,
  Container,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Fade,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import type {
  ExamUploadForm,
  Manifest,
  ExamTypesResponse,
  YearsResponse,
  ExamCategory,
  Exam,
  ManifestPage,
} from "./types/examExtractor.types";
import { API_ENDPOINTS } from "../../services/api";

interface ExamSetupProps {
  examTypes: ExamTypesResponse;
  years: YearsResponse;
  loading: boolean;
  error: string | null;
  formData: ExamUploadForm;
  uploading: boolean;
  uploadComplete: boolean;
  showProcessing: boolean;
  pollError: string | null;
  manifest: Manifest | null;
  onBuildExam: () => void;
  handleExamTypeChange: (event: SelectChangeEvent<string>) => void;
  handleYearChange: (event: SelectChangeEvent<string>) => void;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleUploadMethodChange: (
    event: React.MouseEvent<HTMLElement>,
    newMethod: "upload" | "grab" | null,
  ) => void;
  handleSourceUrlChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleUpload: () => void;
}

export const ExamSetup: React.FC<ExamSetupProps> = ({
  examTypes,
  years,
  loading,
  error,
  formData,
  uploading,
  uploadComplete,
  showProcessing,
  pollError,
  manifest,
  onBuildExam,
  handleExamTypeChange,
  handleYearChange,
  handleFileChange,
  handleUploadMethodChange,
  handleSourceUrlChange,
  handleUpload,
}) => {
  useEffect(() => {
    if (manifest?.metadata.processing_completed) {
      onBuildExam();
    }
  }, [manifest?.metadata.processing_completed, onBuildExam]);

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
            Loading exam data...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ mt: 4 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      </Container>
    );
  }

  return (
    <>
      {/* Hero Section for Exam Extractor (full width) */}
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
            📝 Exam Extractor
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
            PDF ➜ Structured Exam Assets
          </Typography>
        </Container>
      </Box>
      {/* End Hero Section */}

      <Container maxWidth="xl" sx={{ py: 0 }}>
        <Typography variant="h3" gutterBottom>
          Exam Configuration
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Select the exam type and year to ensure conformant filenames
        </Typography>

        <Stack spacing={3}>
          {/* Exam Type Selection */}
          <FormControl fullWidth>
            <InputLabel id="exam-type-label">Exam Type</InputLabel>
            <Select
              labelId="exam-type-label"
              value={formData.examType}
              label="Exam Type"
              onChange={handleExamTypeChange}
            >
              {examTypes?.categories
                .map((category: ExamCategory) => [
                  <ListSubheader
                    key={`header-${category.category_id}`}
                    sx={{ fontWeight: "bold", color: "text.secondary" }}
                  >
                    {category.category_icon} {category.category_name}
                  </ListSubheader>,
                  ...category.exams.map((exam: Exam) => (
                    <MenuItem
                      key={exam.exam_id}
                      value={exam.exam_id}
                      sx={{ pl: 4 }}
                    >
                      {exam.exam_icon} {exam.exam_name}
                    </MenuItem>
                  )),
                ])
                .flat()}
            </Select>
          </FormControl>

          {/* Year Selection */}
          <FormControl fullWidth>
            <InputLabel id="year-label">Year</InputLabel>
            <Select
              labelId="year-label"
              value={formData.year}
              label="Year"
              onChange={handleYearChange}
            >
              <MenuItem value="" disabled>
                Select Year
              </MenuItem>
              {years?.years
                ?.slice()
                .sort((a: number, b: number) => b - a)
                .map((year: number) => (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>

          {/* Only show import method and subsequent fields if examType and year are selected */}
          {formData.examType && formData.year && (
            <>
              {/* Preview of generated filename */}
              <Box p={2} bgcolor="grey.50" borderRadius={1}>
                <Typography variant="h6" color="text.secondary">
                  Project Name:{" "}
                  <Box component="span" fontWeight="bold" color="text.primary">
                    {formData.examType}_{formData.year}
                  </Box>
                </Typography>
              </Box>

              {/* Upload Method Selection */}
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Choose import method
                </Typography>
                <ToggleButtonGroup
                  value={formData.uploadMethod}
                  exclusive
                  onChange={handleUploadMethodChange}
                  aria-label="upload method"
                  fullWidth
                >
                  <ToggleButton value="grab" aria-label="import from url">
                    🌐 Import from URL
                  </ToggleButton>
                  <ToggleButton value="upload" aria-label="upload pdf">
                    📁 Upload PDF
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>

              {/* Always show Source URL field (with explainer) below selector (and below file upload if present) */}
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 0, mt: 0 }}
              >
                Original PDF source URL
              </Typography>
              <TextField
                fullWidth
                label="Source URL"
                placeholder="https://apcentral.collegeboard.org/media/pdf/..."
                value={formData.sourceUrl}
                onChange={handleSourceUrlChange}
                variant="outlined"
                margin="none"
                sx={{ mt: 0, mb: 0 }}
              />

              {/* Show file upload button only if 'Upload PDF' is selected, directly under selector */}
              {formData.uploadMethod === "upload" && (
                <>
                  <input
                    accept=".pdf"
                    style={{ display: "none" }}
                    id="file-upload"
                    type="file"
                    onChange={handleFileChange}
                  />
                  <label htmlFor="file-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      fullWidth
                      disabled={!formData.examType}
                      sx={{ mt: 1 }}
                    >
                      {formData.file ? formData.file.name : "Choose PDF"}
                    </Button>
                  </label>
                </>
              )}

              {/* Process Button */}
              <Button
                variant="contained"
                size="large"
                onClick={handleUpload}
                disabled={
                  uploading ||
                  showProcessing ||
                  !formData.examType ||
                  !formData.sourceUrl ||
                  !formData.uploadMethod ||
                  (formData.uploadMethod === "upload" && !formData.file)
                }
                fullWidth
              >
                {uploading
                  ? "Uploading..."
                  : showProcessing
                    ? "Processing..."
                    : "Process PDF"}
              </Button>
              {/* Upload/Download Complete Message (show for 1.5s) */}
              {uploadComplete && (
                <Alert severity="success" sx={{ mt: 3 }}>
                  {formData.uploadMethod === "upload"
                    ? "PDF upload complete. Starting extraction..."
                    : "PDF downloaded successfully. Starting extraction..."}
                </Alert>
              )}

              {/* Manifest-based Processing Status UI */}
              {showProcessing && manifest && (
                <Box mt={3}>
                  <Box mt={1} mb={1}>
                    <Box
                      sx={{
                        width: "100%",
                        height: 16,
                        background: "#eee",
                        borderRadius: 5,
                        overflow: "hidden",
                      }}
                    >
                      <Box
                        sx={{
                          width: `${
                            manifest.metadata.file_total_pages > 0
                              ? (manifest.metadata.processing_pages_complete /
                                  manifest.metadata.file_total_pages) *
                                100
                              : 0
                          }%`,
                          height: "100%",
                          background: "#0677C9",
                          transition: "width 0.5s",
                        }}
                      />
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary" mb={2}>
                    {manifest.metadata.processing_status}
                  </Typography>
                  {/* Thumbnail grid */}
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "repeat(10, 1fr)",
                      gap: 1,
                      mt: 2,
                    }}
                  >
                    {manifest.pages?.map(
                      (page: ManifestPage, index: number) => (
                        <Fade
                          key={page.page_number}
                          in={true}
                          timeout={300 + index * 100}
                          style={{ transitionDelay: `${index * 50}ms` }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              width: "100%",
                            }}
                          >
                            <Box
                              sx={{
                                width: "100%",
                                borderRadius: 1,
                                border: "1px solid #eee",
                                bgcolor: "#fafbfc",
                                position: "relative",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                              }}
                            >
                              <img
                                src={API_ENDPOINTS.exams.image(
                                  manifest.metadata.slug,
                                  page.thumb.replace(/^images\//, ""),
                                )}
                                alt={`Page ${page.page_number}`}
                                style={{
                                  maxWidth: "100%",
                                  maxHeight: "100%",
                                  width: "auto",
                                  height: "auto",
                                  display: "block",
                                }}
                                onError={(e) => {
                                  console.error(
                                    `Failed to load image: ${page.thumb}`,
                                  );
                                  console.error(
                                    `Full URL: http://localhost:8000/api/v1/exams/${manifest.metadata.slug}/images/${page.thumb.replace(/^images\//, "")}`,
                                  );
                                  (
                                    e.currentTarget as HTMLImageElement
                                  ).style.display = "none";
                                }}
                                onLoad={() => {
                                  console.log(
                                    `Successfully loaded image: ${page.thumb}`,
                                  );
                                }}
                              />
                            </Box>
                            <Typography
                              variant="caption"
                              sx={{
                                color: "#aaa",
                                fontSize: "0.75rem",
                                textAlign: "center",
                                mt: 0.5,
                                mb: 0,
                                fontWeight: 500,
                                letterSpacing: "0.5px",
                              }}
                            >
                              {page.page_number}
                            </Typography>
                          </Box>
                        </Fade>
                      ),
                    )}
                  </Box>
                </Box>
              )}
              {pollError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {pollError}
                </Alert>
              )}
            </>
          )}
        </Stack>
      </Container>
    </>
  );
};
