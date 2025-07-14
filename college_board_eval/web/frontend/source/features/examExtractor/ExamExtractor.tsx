import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
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
import { useExamData } from "./hooks/useExamData";
import type { ExamUploadForm } from "./types/examExtractor.types";

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

  const handleUpload = () => {
    // TODO: Implement file upload logic
    console.log("Upload form data:", formData);
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
                  .map((category) => [
                    <ListSubheader
                      key={`header-${category.category_id}`}
                      sx={{ fontWeight: "bold", color: "text.secondary" }}
                    >
                      {category.category_icon} {category.category_name}
                    </ListSubheader>,
                    ...category.exams.map((exam) => (
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
                {years?.years.map((year) => (
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
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
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
                    !formData.examType ||
                    !formData.sourceUrl ||
                    !formData.uploadMethod ||
                    (formData.uploadMethod === "upload" && !formData.file)
                  }
                  fullWidth
                >
                  Process PDF
                </Button>
              </>
                            )}
              </Stack>
            </Container>
          </>
        );
      };
