import React, { useEffect } from "react";
import { Box, Container, Typography, Tab, Tabs } from "@mui/material";
import { Dashboard } from "./features/dashboard/Dashboard";
import { ExamExtractor } from "./features/examExtractor/ExamExtractor";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";

let mainAppMountCount = 0;

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

function MainApp() {
  mainAppMountCount++;
  console.log("MainApp mounted, count:", mainAppMountCount);
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
          <Route path="/examextractor" element={<ExamExtractor />} />
          <Route path="/examextractor/:slug" element={<ExamExtractor />} />
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
