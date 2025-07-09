import { useState } from 'react';
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
} from '@mui/material';
import { CloudUpload, UploadFile, CheckCircle } from '@mui/icons-material';

interface UploadState {
  file: File | null;
  isUploading: boolean;
  error: string | null;
  success: boolean;
}

function App() {
  const [uploadState, setUploadState] = useState<UploadState>({
    file: null,
    isUploading: false,
    error: null,
    success: false,
  });

  const [activeTab, setActiveTab] = useState(2); // Exam Extractor is active by default

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (file.type !== 'application/pdf') {
        setUploadState(prev => ({
          ...prev,
          error: 'Please select a PDF file',
          success: false,
        }));
        return;
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setUploadState(prev => ({
          ...prev,
          error: 'File size must be less than 10MB',
          success: false,
        }));
        return;
      }

      setUploadState(prev => ({
        ...prev,
        file,
        error: null,
        success: false,
      }));
    }
  };

  const handleUpload = async () => {
    if (!uploadState.file) return;

    setUploadState(prev => ({
      ...prev,
      isUploading: true,
      error: null,
    }));

    try {
      // TODO: Implement actual upload logic to backend
      const formData = new FormData();
      formData.append('pdf', uploadState.file);

      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        success: true,
      }));
    } catch {
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        error: 'Upload failed. Please try again.',
      }));
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      const input = document.createElement('input');
      input.type = 'file';
      input.files = event.dataTransfer.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      handleFileSelect({ target: { files: event.dataTransfer.files } } as React.ChangeEvent<HTMLInputElement>);
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: '#fff',
    }}>
      {/* College Board Black Top Line */}
      <Box sx={{ width: '100%', height: '5px', background: '#111', position: 'relative', top: 0, left: 0, zIndex: 1200 }} />
      {/* Remove the separate College Board Top Bar and merge logo, ExamExtractor, and nav tabs into a single horizontal bar */}
      {/* Nav bar: College Board logo (full height, black bg, no padding), then nav tabs, all in one row */}
      <Box sx={{ background: '#fff', minHeight: 64, px: 0 }}>
        <Container maxWidth="lg" sx={{ display: 'flex', alignItems: 'center', minHeight: 64, px: 0 }}>
          {/* College Board Logo - only as wide as the SVG, no fixed width, no cropping */}
          <Box sx={{ pl: '30px', height: 64, background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', pr: 4 }}>
            <img src="/images/college_board_logo.svg" alt="College Board" style={{ height: 36, width: 'auto', display: 'block' }} />
          </Box>
          {/* Nav Tabs - right aligned */}
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            sx={{
              minHeight: 64,
              height: 64,
              ml: 'auto',
              '& .MuiTab-root': {
                color: '#222',
                fontWeight: 500,
                fontSize: '1.1rem',
                textTransform: 'none',
                minWidth: 120,
                px: 2,
                py: 1.5,
                position: 'relative',
                zIndex: 1,
                background: 'none',
                height: 64,
                display: 'flex',
                alignItems: 'center',
                '&.Mui-selected, &:hover': {
                  color: '#111',
                },
                '&:hover:after, &.Mui-selected:after': {
                  content: '""',
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: '4px',
                  background: '#111',
                  borderRadius: 2,
                  zIndex: 2,
                },
                '&:not(:hover):not(.Mui-selected):after': {
                  content: 'none',
                },
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                },
              },
              '& .MuiTabs-indicator': {
                display: 'none',
              },
            }}
          >
            <Tab label="Project" />
            <Tab label="Dashboard" />
            <Tab label="Exam Extractor" />
          </Tabs>
        </Container>
      </Box>

      {/* Hero Section - College Board Style */}
      <Box 
        sx={{ 
          background: 'linear-gradient(135deg, #009cde 0%, #0077c8 100%)',
          color: '#fff',
          py: 8,
          px: 2,
          textAlign: 'center',
        }}
      >
        <Container maxWidth="md">
          <Typography 
            variant="h1" 
            component="h1" 
            sx={{ 
              fontWeight: 700,
              color: '#fff',
              mb: 3,
              fontSize: { xs: '2rem', md: '2.5rem' },
            }}
          >
            📝 ExamExtractor
          </Typography>
          <Typography 
            variant="h3" 
            sx={{ 
              fontWeight: 400,
              color: '#fff',
              mb: 2,
              fontSize: { xs: '1.25rem', md: '1.5rem' },
            }}
          >
            PDF ➜ Structured Exam Assets
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              maxWidth: 600,
              mx: 'auto',
              lineHeight: 1.6,
              fontSize: '1.125rem',
              opacity: 0.9,
            }}
          >
            Upload SAT or Advanced Placement PDFs to extract perfectly cropped images and standards-compliant JSON ready for College Board Evals.
          </Typography>
        </Container>
      </Box>

      {/* Main Content Section */}
      <Container maxWidth="md" sx={{ py: 8, px: 2 }}>
        {/* Upload Card */}
        <Card 
          elevation={2}
          sx={{ 
            mb: 6,
            border: '1px solid #d9d9d9',
            borderRadius: 2,
          }}
        >
          <CardContent sx={{ p: 6 }}>
            <Box
              sx={{
                border: '2px dashed',
                borderColor: uploadState.file ? '#009cde' : '#d9d9d9',
                borderRadius: 2,
                p: 8,
                textAlign: 'center',
                backgroundColor: uploadState.file ? '#f0f9ff' : '#f0f0f0',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                '&:hover': {
                  borderColor: '#009cde',
                  backgroundColor: '#f0f9ff',
                },
              }}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => document.getElementById('pdf-upload')?.click()}
            >
              <input
                id="pdf-upload"
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />

              {uploadState.file ? (
                <Box>
                  <CheckCircle 
                    sx={{ 
                      fontSize: 64, 
                      mb: 3,
                      color: '#009cde'
                    }} 
                  />
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      fontWeight: 700,
                      color: '#1e1e1e',
                      mb: 2
                    }}
                  >
                    {uploadState.file.name}
                  </Typography>
                  <Chip
                    label={`${(uploadState.file.size / 1024 / 1024).toFixed(2)} MB`}
                    variant="outlined"
                    sx={{ 
                      borderColor: '#009cde',
                      color: '#009cde',
                      fontWeight: 500,
                    }}
                  />
                </Box>
              ) : (
                <Box>
                  <CloudUpload 
                    sx={{ 
                      fontSize: 64, 
                      color: '#009cde', 
                      mb: 3 
                    }} 
                  />
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      fontWeight: 700,
                      color: '#1e1e1e',
                      mb: 2
                    }}
                  >
                    Drop your PDF here or click to browse
                  </Typography>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      maxWidth: 400,
                      mx: 'auto',
                      color: '#4D4D4D',
                      fontSize: '1rem',
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
                  border: '1px solid #fca5a5',
                  backgroundColor: '#fef2f2',
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
                  border: '1px solid #009cde',
                  backgroundColor: '#f0f9ff',
                  color: '#009cde',
                  borderRadius: 2,
                }}
              >
                PDF uploaded successfully! Processing...
              </Alert>
            )}

            <Box sx={{ mt: 6, textAlign: 'center' }}>
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
                  fontSize: '1rem',
                  fontWeight: 700,
                  minHeight: '48px',
                  backgroundColor: '#009cde',
                  '&:hover': {
                    backgroundColor: '#0077c8',
                  },
                  '&:disabled': {
                    backgroundColor: '#d9d9d9',
                    color: '#4D4D4D',
                  }
                }}
              >
                {uploadState.isUploading ? 'Processing...' : 'Extract Exam Data'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>

      {/* Footer - College Board Style */}
      <Box sx={{ 
        backgroundColor: '#1e1e1e',
        color: '#fff',
        py: 4,
        mt: 8,
        position: 'relative',
      }}>
        {/* Yellow line on top of footer */}
        <Box sx={{ width: '100%', height: '5px', background: '#fedb00', position: 'absolute', top: 0, left: 0, zIndex: 1 }} />
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 2 }}>
          <Typography 
            variant="body2" 
            sx={{ 
              textAlign: 'center',
              color: '#d9d9d9',
              fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
              fontSize: '0.875rem',
            }}
          >
            © 2025 College Board
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}

export default App;