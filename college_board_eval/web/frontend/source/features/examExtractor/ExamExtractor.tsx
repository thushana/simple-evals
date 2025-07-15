import React, { useState } from "react";
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
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import type { ExamUploadForm, Manifest } from "./types/examExtractor.types";
import { uploadExamFile, fetchManifest } from "./utils/api";
import { useExamData } from "./hooks/useExamData";
import { API_ENDPOINTS } from "../../services/api";

export const ExamExtractor: React.FC = () => {
  const { examTypes, years, loading, error } = useExamData();
  const [formData, setFormData] = useState<ExamUploadForm>({
    examType: "",
    year: "", // No default year
    file: null,
    sourceUrl: "",
    pdfUrl: "",
    uploadMethod: null,
  });
  const [uploading, setUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [showProcessing, setShowProcessing] = useState(false);
  const [pollError, setPollError] = useState<string | null>(null);
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [manifestSlug, setManifestSlug] = useState<string | null>(null);

  // Poll manifest after upload
  React.useEffect(() => {
    if (!manifestSlug) {
      return; // Skip polling if no slug (normal on component mount)
    }
    console.log(
      `[DEBUG ${new Date().toISOString()}] Poll effect: started for manifestSlug`,
      manifestSlug,
    );

    let intervalId: number | null = null;
    let isStopped = false;

    const poll = async () => {
      if (isStopped) {
        console.log(
          `[DEBUG ${new Date().toISOString()}] Poll stopped, skipping...`,
        );
        return;
      }
      console.log(`[DEBUG ${new Date().toISOString()}] Polling manifest...`);
      try {
        const m = await fetchManifest(manifestSlug);
        console.log(`[DEBUG ${new Date().toISOString()}] Polled manifest:`, m);
        setManifest(m);
        if (m.metadata.processing_completed) {
          isStopped = true;
          console.log(
            `[DEBUG ${new Date().toISOString()}] Manifest processing completed, stopping poll.`,
          );
          if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
        }
      } catch (err) {
        console.error(
          `[DEBUG ${new Date().toISOString()}] Error polling manifest:`,
          err,
        );
      }
    };

    // Start polling immediately
    poll();

    // Set up interval for subsequent polls
    intervalId = setInterval(() => {
      if (!isStopped) {
        poll();
      }
    }, 1000); // Reduced from 2000ms to 1000ms for more responsive updates

    return () => {
      isStopped = true;
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      console.log(
        `[DEBUG ${new Date().toISOString()}] Poll effect: cleanup for manifestSlug`,
        manifestSlug,
      );
    };
  }, [manifestSlug]);

  const handleExamTypeChange = (event: SelectChangeEvent<string>) => {
    setFormData((prev) => ({ ...prev, examType: event.target.value }));
  };

  const handleYearChange = (event: SelectChangeEvent<string>) => {
    setFormData((prev) => ({ ...prev, year: event.target.value }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setFormData((prev) => ({ ...prev, file }));
  };

  const handleUploadMethodChange = (
    _event: React.MouseEvent<HTMLElement>,
    newMethod: "upload" | "grab" | null,
  ) => {
    if (newMethod !== null) {
      setFormData((prev) => ({ ...prev, uploadMethod: newMethod, file: null }));
    }
  };

  const handleSourceUrlChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setFormData((prev) => ({ ...prev, sourceUrl: event.target.value }));
  };

  const handleUpload = async () => {
    setUploading(true);
    setPollError(null);

    // Generate slug from examType and year
    const slug = `${formData.examType}_${formData.year}`;
    console.log(
      `[DEBUG ${new Date().toISOString()}] Uploading with slug:`,
      slug,
      formData,
    );

    // Start polling IMMEDIATELY when upload begins
    console.log(
      `[DEBUG ${new Date().toISOString()}] Starting manifest polling immediately for:`,
      slug,
    );
    setManifestSlug(slug);
    setManifest(null);

    // Show processing UI immediately
    setShowProcessing(true);

    try {
      if (formData.uploadMethod === "upload" && formData.file) {
        console.log(
          `[DEBUG ${new Date().toISOString()}] Calling uploadExamFile with file upload`,
        );
        await uploadExamFile(
          formData.file,
          slug,
          formData.examType,
          Number(formData.year),
        );
        console.log(
          `[DEBUG ${new Date().toISOString()}] uploadExamFile completed for file upload`,
        );
      } else if (formData.uploadMethod === "grab" && formData.sourceUrl) {
        console.log(
          `[DEBUG ${new Date().toISOString()}] Calling uploadExamFile with URL grab`,
        );
        await uploadExamFile(
          null,
          slug,
          formData.examType,
          Number(formData.year),
          formData.sourceUrl,
        );
        console.log(
          `[DEBUG ${new Date().toISOString()}] uploadExamFile completed for URL grab`,
        );
      } else {
        throw new Error("No file or URL provided");
      }

      setUploading(false);
      setUploadComplete(true);
      // Keep processing UI visible since we already set it to true
    } catch (err: unknown) {
      console.error(`[DEBUG ${new Date().toISOString()}] Upload error:`, err);
      setPollError(err instanceof Error ? err.message : "Upload failed");
      setUploading(false);
      // Clear manifestSlug on error to stop polling
      setManifestSlug(null);
    }
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
        <Typography variant="h6" gutterBottom>
          Exam Configuration
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Select the exam type and year to ensure conformant filenames.
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
                .map(
                  (
                    category: import("./types/examExtractor.types").ExamCategory,
                  ) => [
                    <ListSubheader
                      key={`header-${category.category_id}`}
                      sx={{ fontWeight: "bold", color: "text.secondary" }}
                    >
                      {category.category_icon} {category.category_name}
                    </ListSubheader>,
                    ...category.exams.map(
                      (exam: import("./types/examExtractor.types").Exam) => (
                        <MenuItem
                          key={exam.exam_id}
                          value={exam.exam_id}
                          sx={{ pl: 4 }}
                        >
                          {exam.exam_icon} {exam.exam_name}
                        </MenuItem>
                      ),
                    ),
                  ],
                )
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
                <Typography variant="body2" color="text.secondary">
                  Generated filename:{" "}
                  <Box component="span" fontWeight="bold" color="text.primary">
                    {formData.examType}_{formData.year}.pdf
                  </Box>
                </Typography>
              </Box>

              {/* Upload Method Selection */}
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Choose import method:
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

              {/* Source URL Field (always show when a method is selected) */}
              {formData.uploadMethod && (
                <TextField
                  fullWidth
                  label="Source URL"
                  placeholder="https://apcentral.collegeboard.org/media/pdf/..."
                  value={formData.sourceUrl}
                  onChange={handleSourceUrlChange}
                  helperText={
                    formData.uploadMethod === "grab"
                      ? "The URL to the PDF file (will be included in metadata)"
                      : "The original source URL for this exam (will be included in metadata)"
                  }
                  variant="outlined"
                />
              )}

              {/* File Upload (only show if upload method selected) */}
              {formData.uploadMethod === "upload" && (
                <Box>
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
                    >
                      {formData.file ? formData.file.name : "Choose PDF"}
                    </Button>
                  </label>
                </Box>
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
                    {manifest.pages?.map((page) => (
                      <Box
                        key={page.page_number}
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
                            src={API_ENDPOINTS.exams.image(manifest.metadata.slug, page.thumb.replace(/^images\//, ""))}
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
                              e.currentTarget.style.display = "none";
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
                    ))}
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
