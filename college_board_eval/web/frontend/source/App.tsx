import React, { useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Typography,
  Alert,
  CircularProgress,
  Chip,
  Tab,
  Tabs,
} from "@mui/material";
import { CloudUpload, UploadFile, CheckCircle } from "@mui/icons-material";
import { Dashboard } from "./features/dashboard/Dashboard";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";
import type { ChangeEvent, DragEvent } from "react";

interface UploadState {
  file: File | null;
  isUploading: boolean;
  error: string | null;
  success: boolean;
}

interface ExamExtractorPageProps {
  uploadState: UploadState;
  handleFileSelect: (event: ChangeEvent<HTMLInputElement>) => void;
  handleUpload: () => void;
  handleDragOver: (event: DragEvent) => void;
  handleDrop: (event: DragEvent) => void;
}

function ProjectPage() {
  useEffect(() => {
    document.title = "College Board – LLM Evals";
  }, []);
  return (
    <>
      <Box
        sx={{
          background: "linear-gradient(135deg, #009cde 0%, #0077c8 100%)",
          color: "#fff",
          py: { xs: 4, md: 5 },
          px: 2,
          textAlign: "center",
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
            📁 Project Overview
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
            College Board Evaluation System
          </Typography>
        </Container>
      </Box>
      <Box sx={{ py: 4 }}>
        <Container maxWidth="md">{/* ... Project content ... */}</Container>
      </Box>
    </>
  );
}

function ExamExtractorPage({
  uploadState,
  handleFileSelect,
  handleUpload,
  handleDragOver,
  handleDrop,
}: ExamExtractorPageProps) {
  useEffect(() => {
    document.title = "Exam Extractor | College Board – LLM Evals";
  }, []);
  return (
    <>
      <Box
        sx={{
          background: "linear-gradient(135deg, #009cde 0%, #0077c8 100%)",
          color: "#fff",
          py: { xs: 4, md: 5 },
          px: 2,
          textAlign: "center",
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
            📝 ExamExtractor
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
      <Container maxWidth="md" sx={{ py: 8, px: 2 }}>
        {/* Upload Card */}
        <Card
          elevation={2}
          sx={{
            mb: 6,
            border: "1px solid #d9d9d9",
            borderRadius: 2,
          }}
        >
          <CardContent sx={{ p: 6 }}>
            <Box
              sx={{
                border: "2px dashed",
                borderColor: uploadState.file ? "#009cde" : "#d9d9d9",
                borderRadius: 2,
                p: 8,
                textAlign: "center",
                backgroundColor: uploadState.file ? "#f0f9ff" : "#f0f0f0",
                transition: "all 0.3s ease",
                cursor: "pointer",
                "&:hover": {
                  borderColor: "#009cde",
                  backgroundColor: "#f0f9ff",
                },
              }}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => document.getElementById("pdf-upload")?.click()}
            >
              <input
                id="pdf-upload"
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                style={{ display: "none" }}
              />

              {uploadState.file ? (
                <Box>
                  <CheckCircle
                    sx={{
                      fontSize: 64,
                      mb: 3,
                      color: "#009cde",
                    }}
                  />
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 700,
                      color: "#1e1e1e",
                      mb: 2,
                    }}
                  >
                    {uploadState.file.name}
                  </Typography>
                  <Chip
                    label={`${(uploadState.file.size / 1024 / 1024).toFixed(2)} MB`}
                    variant="outlined"
                    sx={{
                      borderColor: "#009cde",
                      color: "#009cde",
                      fontWeight: 500,
                    }}
                  />
                </Box>
              ) : (
                <Box>
                  <CloudUpload
                    sx={{
                      fontSize: 64,
                      color: "#009cde",
                      mb: 3,
                    }}
                  />
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 700,
                      color: "#1e1e1e",
                      mb: 2,
                    }}
                  >
                    Drop your PDF here or click to browse
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      maxWidth: 400,
                      mx: "auto",
                      color: "#4D4D4D",
                      fontSize: "1rem",
                    }}
                  >
                    Supports SAT and Advanced Placement exam PDFs up to 10MB
                  </Typography>
                </Box>
              )}
            </Box>

            {uploadState.error && (
              <Alert
                severity="error"
                sx={{
                  mt: 4,
                  border: "1px solid #fca5a5",
                  backgroundColor: "#fef2f2",
                  borderRadius: 2,
                }}
              >
                {uploadState.error}
              </Alert>
            )}

            {uploadState.success && (
              <Alert
                severity="success"
                sx={{
                  mt: 4,
                  border: "1px solid #009cde",
                  backgroundColor: "#f0f9ff",
                  color: "#009cde",
                  borderRadius: 2,
                }}
              >
                PDF uploaded successfully! Processing...
              </Alert>
            )}

            <Box sx={{ mt: 6, textAlign: "center" }}>
              <Button
                variant="contained"
                size="large"
                onClick={handleUpload}
                disabled={!uploadState.file || uploadState.isUploading}
                startIcon={
                  uploadState.isUploading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <UploadFile />
                  )
                }
                sx={{
                  px: 6,
                  py: 2,
                  fontSize: "1rem",
                  fontWeight: 700,
                  minHeight: "48px",
                  backgroundColor: "#009cde",
                  "&:hover": {
                    backgroundColor: "#0077c8",
                  },
                  "&:disabled": {
                    backgroundColor: "#d9d9d9",
                    color: "#4D4D4D",
                  },
                }}
              >
                {uploadState.isUploading
                  ? "Processing..."
                  : "Extract Exam Data"}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </>
  );
}

function MainApp() {
  const [uploadState, setUploadState] = React.useState<UploadState>({
    file: null,
    isUploading: false,
    error: null,
    success: false,
  });

  const navigate = useNavigate();
  const location = useLocation();

  // Determine active tab from URL
  const tabPaths = ["/", "/dashboard", "/examextractor"];
  const activeTab =
    tabPaths.indexOf(location.pathname) !== -1
      ? tabPaths.indexOf(location.pathname)
      : 0;

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    navigate(tabPaths[newValue]);
  };

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        setUploadState((prev) => ({
          ...prev,
          error: "Please select a PDF file",
          success: false,
        }));
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setUploadState((prev) => ({
          ...prev,
          error: "File size must be less than 10MB",
          success: false,
        }));
        return;
      }
      setUploadState((prev) => ({
        ...prev,
        file,
        error: null,
        success: false,
      }));
    }
  };

  const handleUpload = async () => {
    if (!uploadState.file) return;
    setUploadState((prev) => ({ ...prev, isUploading: true, error: null }));
    try {
      const formData = new FormData();
      formData.append("pdf", uploadState.file);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setUploadState((prev) => ({
        ...prev,
        isUploading: false,
        success: true,
      }));
    } catch {
      setUploadState((prev) => ({
        ...prev,
        isUploading: false,
        error: "Upload failed. Please try again.",
      }));
    }
  };

  const handleDragOver = (event: DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileSelect({
        target: { files: event.dataTransfer.files },
      } as ChangeEvent<HTMLInputElement>);
    }
  };

  useEffect(() => {
    if (location.pathname === "/dashboard") {
      document.title = "Dashboard | College Board – LLM Evals";
    } else if (location.pathname === "/examextractor") {
      document.title = "Exam Extractor | College Board – LLM Evals";
    } else {
      document.title = "College Board – LLM Evals";
    }
  }, [location.pathname]);

  return (
    <>
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* College Board Black Top Line */}
        <Box
          sx={{
            width: "100%",
            height: "5px",
            background: "#111",
            position: "relative",
            top: 0,
            left: 0,
            zIndex: 1200,
          }}
        />
        <Box sx={{ background: "#fff", minHeight: 64, px: 0 }}>
          <Container
            maxWidth="lg"
            sx={{ display: "flex", alignItems: "center", minHeight: 64, px: 0 }}
          >
            <Box
              sx={{
                pl: "30px",
                height: 64,
                background: "#111",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                pr: 4,
              }}
            >
              <img
                src="/images/college_board_logo.svg"
                alt="College Board"
                style={{ height: 36, width: "auto", display: "block" }}
              />
            </Box>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              sx={{
                minHeight: 64,
                height: 64,
                ml: "auto",
                "& .MuiTab-root": {
                  color: "#222",
                  fontWeight: 500,
                  fontSize: "1.1rem",
                  textTransform: "none",
                  minWidth: 120,
                  px: 2,
                  py: 1.5,
                  position: "relative",
                  zIndex: 1,
                  background: "none",
                  height: 64,
                  display: "flex",
                  alignItems: "center",
                  "&.Mui-selected, &:hover": {
                    color: "#111",
                  },
                  "&:hover:after, &.Mui-selected:after": {
                    content: '""',
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: "4px",
                    background: "#111",
                    borderRadius: 2,
                    zIndex: 2,
                  },
                  "&:not(:hover):not(.Mui-selected):after": {
                    content: "none",
                  },
                  "&:hover": {
                    backgroundColor: "#f5f5f5",
                  },
                },
                "& .MuiTabs-indicator": {
                  display: "none",
                },
              }}
            >
              <Tab label="Project" />
              <Tab label="Dashboard" />
              <Tab label="Exam Extractor" />
            </Tabs>
          </Container>
        </Box>
        <Routes>
          <Route path="/" element={<ProjectPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/:examSlug" element={<Dashboard />} />
          <Route
            path="/dashboard/:examSlug/:questionId"
            element={<Dashboard />}
          />
          <Route
            path="/examextractor"
            element={
              <ExamExtractorPage
                uploadState={uploadState}
                handleFileSelect={handleFileSelect}
                handleUpload={handleUpload}
                handleDragOver={handleDragOver}
                handleDrop={handleDrop}
              />
            }
          />
        </Routes>
      </Box>
      {/* Footer - College Board Style */}
      <Box
        sx={{
          backgroundColor: "#1e1e1e",
          color: "#fff",
          py: 4,
          mt: 8,
          position: "relative",
        }}
      >
        <Box
          sx={{
            width: "100%",
            height: "5px",
            background: "#fedb00",
            position: "absolute",
            top: 0,
            left: 0,
            zIndex: 1,
          }}
        />
        <Container maxWidth="md" sx={{ position: "relative", zIndex: 2 }}>
          <Typography
            variant="body2"
            sx={{
              textAlign: "center",
              color: "#d9d9d9",
              fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
              fontSize: "0.875rem",
            }}
          >
            © 2025 College Board
          </Typography>
        </Container>
      </Box>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          background: "#fff",
        }}
      >
        <MainAppWrapper />
      </Box>
    </BrowserRouter>
  );
}

function MainAppWrapper() {
  return <MainApp />;
}
