import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Typography,
  Container,
  Button,
  Chip,
  Stack,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
} from "@mui/material";
import { Create, Save, ArrowBack, Delete } from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
import { API_ENDPOINTS } from "../../services/api";
import type { Manifest } from "./types/examExtractor.types";

interface BoundingBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: "Question" | "Context";
  pageNumber: number;
  isActive?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface ExamBuilderProps {
  // No props needed for this component
}

export const ExamBuilder: React.FC<ExamBuilderProps> = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPage, setSelectedPage] = useState<number>(1);
  const [boundingBoxes, setBoundingBoxes] = useState<BoundingBox[]>([]);
  const [activeBoxId, setActiveBoxId] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(true); // Drawing by default
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [currentBox, setCurrentBox] = useState<Partial<BoundingBox> | null>(
    null,
  );
  const [isDrawingMode, setIsDrawingMode] = useState(false); // Track if we're in drawing mode

  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Fetch manifest data
  useEffect(() => {
    const fetchManifest = async () => {
      if (!slug) return;

      try {
        setLoading(true);
        const response = await fetch(API_ENDPOINTS.exams.manifest(slug));
        if (!response.ok) {
          throw new Error("Failed to fetch exam data");
        }
        const data = await response.json();
        setManifest(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load exam");
      } finally {
        setLoading(false);
      }
    };

    fetchManifest();
  }, [slug]);

  // Handle image load and canvas setup
  const handleImageLoad = () => {
    if (imageRef.current && canvasRef.current) {
      const img = imageRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        // Set canvas size to match the displayed image size
        canvas.width = img.offsetWidth;
        canvas.height = img.offsetHeight;
        drawBoundingBoxes();
      }
    }
  };

  // Draw bounding boxes on canvas
  const drawBoundingBoxes = useCallback(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw existing bounding boxes (just the rectangles, no labels)
    boundingBoxes
      .filter((box) => box.pageNumber === selectedPage)
      .forEach((box) => {
        const isActive = box.id === activeBoxId;
        const alpha = isActive ? 1.0 : 0.5;

        // Set color with opacity - match Material-UI chip colors
        if (box.type === "Question") {
          // Material-UI error color (red)
          ctx.strokeStyle = `rgba(211, 47, 47, ${alpha})`;
        } else {
          // Material-UI primary color (blue)
          ctx.strokeStyle = `rgba(25, 118, 210, ${alpha})`;
        }

        ctx.lineWidth = 3;
        ctx.strokeRect(box.x, box.y, box.width, box.height);
      });

    // Draw current box being created
    if (currentBox && drawStart) {
      ctx.strokeStyle = "rgba(211, 47, 47, 1)"; // Material-UI error color
      ctx.lineWidth = 3;
      ctx.strokeRect(
        currentBox.x || 0,
        currentBox.y || 0,
        currentBox.width || 0,
        currentBox.height || 0,
      );
    }
  }, [boundingBoxes, selectedPage, activeBoxId, currentBox, drawStart]);

  // Update canvas when bounding boxes change
  useEffect(() => {
    drawBoundingBoxes();
  }, [drawBoundingBoxes]);

  // Handle window resize to update canvas size
  useEffect(() => {
    const handleResize = () => {
      if (imageRef.current && canvasRef.current) {
        const img = imageRef.current;
        const canvas = canvasRef.current;
        canvas.width = img.offsetWidth;
        canvas.height = img.offsetHeight;
        drawBoundingBoxes();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [drawBoundingBoxes]);

  // Mouse event handlers for drawing
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current || !isDrawing) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (!isDrawingMode) {
      // First click - start drawing mode
      setIsDrawingMode(true);
      setDrawStart({ x, y });
      setCurrentBox({ x, y, width: 0, height: 0, pageNumber: selectedPage });
    } else {
      // Second click - finish the box
      if (drawStart && currentBox) {
        const newBox: BoundingBox = {
          id: `box_${Date.now()}`,
          x: Math.min(drawStart.x, x),
          y: Math.min(drawStart.y, y),
          width: Math.abs(x - drawStart.x),
          height: Math.abs(y - drawStart.y),
          type: "Question", // Default type
          pageNumber: selectedPage,
        };

        setBoundingBoxes((prev) => [...prev, newBox]);
        setCurrentBox(null);
        setDrawStart(null);
        setIsDrawingMode(false);
        // Make the newly created box active
        setActiveBoxId(newBox.id);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current || !drawStart || !isDrawingMode) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCurrentBox({
      x: Math.min(drawStart.x, x),
      y: Math.min(drawStart.y, y),
      width: Math.abs(x - drawStart.x),
      height: Math.abs(y - drawStart.y),
      pageNumber: selectedPage,
    });
  };

  const handleMouseUp = () => {
    // Mouse up doesn't finish the box - only second click does
  };

  // Handle bounding box type change
  const handleBoxTypeChange = (boxId: string, type: "Question" | "Context") => {
    setBoundingBoxes((prev) =>
      prev.map((box) => (box.id === boxId ? { ...box, type } : box)),
    );
  };

  // Handle bounding box deletion
  const handleBoxDelete = (boxId: string) => {
    setBoundingBoxes((prev) => prev.filter((box) => box.id !== boxId));
    // Clear active box if it was deleted
    if (activeBoxId === boxId) {
      setActiveBoxId(null);
    }
  };

  // Handle setting active box
  const handleSetActiveBox = (boxId: string) => {
    setActiveBoxId(boxId);
  };

  // No zoom/pan controls needed

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
            Loading exam builder...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error || !manifest) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ mt: 4 }}>
          <Alert severity="error">{error || "Failed to load exam data"}</Alert>
        </Box>
      </Container>
    );
  }

  const selectedPageData = manifest.pages?.find(
    (page) => page.page_number === selectedPage,
  );
  const pageBoundingBoxes = boundingBoxes.filter(
    (box) => box.pageNumber === selectedPage,
  );

  return (
    <>
      {/* Header */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #009cde 0%, #0077c8 100%)",
          color: "#fff",
          py: 3,
          px: 2,
          mb: 3,
        }}
      >
        <Container maxWidth="xl">
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton
              onClick={() => navigate("/examextractor")}
              sx={{ color: "#fff" }}
            >
              <ArrowBack />
            </IconButton>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
              🏗️ Exam Builder: {manifest.metadata.slug}
            </Typography>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: 0 }}>
        <Box sx={{ display: "flex", gap: 2, height: "calc(100vh - 200px)" }}>
          {/* Column 1: Thumbnail List */}
          <Box
            sx={{
              width: 132, // 66% of 200px
              overflow: "auto",
              flexShrink: 0,
            }}
          >
            <Stack spacing={1}>
              {manifest.pages?.map((page) => (
                <Box
                  key={page.page_number}
                  sx={{
                    cursor: "pointer",
                    border:
                      selectedPage === page.page_number
                        ? "2px solid #0677C9"
                        : "1px solid #ddd",
                    borderRadius: 1,
                    p: 0.5,
                    bgcolor:
                      selectedPage === page.page_number ? "#f0f8ff" : "#fff",
                  }}
                  onClick={() => setSelectedPage(page.page_number)}
                >
                  <img
                    src={API_ENDPOINTS.exams.image(
                      manifest.metadata.slug,
                      page.thumb.replace(/^images\//, ""),
                    )}
                    alt={`Page ${page.page_number}`}
                    style={{
                      width: "100%",
                      height: "auto",
                      display: "block",
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{ textAlign: "center", display: "block", mt: 0.5 }}
                  >
                    {page.page_number}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>

          {/* Column 2: Full Image with Drawing */}
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <Typography variant="h6">Page {selectedPage}</Typography>
              <Box sx={{ ml: "auto", display: "flex", gap: 1 }}>
                <Tooltip
                  title={isDrawing ? "Disable Drawing" : "Enable Drawing"}
                >
                  <IconButton
                    onClick={() => {
                      setIsDrawing(!isDrawing);
                      setIsDrawingMode(false); // Reset drawing mode when toggling
                      setCurrentBox(null);
                      setDrawStart(null);
                    }}
                    size="small"
                    color={isDrawing ? "primary" : "default"}
                  >
                    <Create />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            <Box
              sx={{
                flex: 1,
                overflow: "auto",
                position: "relative",
                border: "1px solid #ddd",
                borderRadius: 1,
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            >
              {selectedPageData && (
                <>
                  <img
                    ref={imageRef}
                    src={API_ENDPOINTS.exams.image(
                      manifest.metadata.slug,
                      selectedPageData.full.replace(/^images\//, ""),
                    )}
                    alt={`Page ${selectedPage}`}
                    style={{
                      width: "100%",
                      height: "auto",
                      display: "block",
                    }}
                    onLoad={handleImageLoad}
                  />
                  <canvas
                    ref={canvasRef}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      pointerEvents: "none",
                      zIndex: 20,
                    }}
                  />
                  {/* HTML Labels for crisp text rendering */}
                  {pageBoundingBoxes.map((box) => (
                    <Box
                      key={`label-${box.id}`}
                      sx={{
                        position: "absolute",
                        left: box.x,
                        top: box.y - 25,
                        backgroundColor:
                          box.type === "Question" ? "#d32f2f" : "#1976d2",
                        color: "white",
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1,
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        fontFamily:
                          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                        lineHeight: 1,
                        whiteSpace: "nowrap",
                        pointerEvents: "none",
                        zIndex: 5,
                        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                      }}
                    >
                      {box.type}
                    </Box>
                  ))}
                  {/* Label for current box being drawn */}
                  {currentBox && drawStart && (
                    <Box
                      sx={{
                        position: "absolute",
                        left: currentBox.x || 0,
                        top: (currentBox.y || 0) - 25,
                        backgroundColor: "#d32f2f",
                        color: "white",
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1,
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        fontFamily:
                          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                        lineHeight: 1,
                        whiteSpace: "nowrap",
                        pointerEvents: "none",
                        zIndex: 5,
                        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                      }}
                    >
                      Question
                    </Box>
                  )}
                </>
              )}
            </Box>
          </Box>

          {/* Column 3: Question Management */}
          <Box
            sx={{
              width: 300,
              overflow: "auto",
              flexShrink: 0,
            }}
          >
            <Typography variant="h6" gutterBottom>
              Question Management
            </Typography>

            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Bounding Boxes (Page {selectedPage})
                </Typography>
                {pageBoundingBoxes.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No bounding boxes on this page. Use the drawing tool to
                    create boxes.
                  </Typography>
                ) : (
                  <Stack spacing={1}>
                    {pageBoundingBoxes.map((box) => {
                      const isActive = box.id === activeBoxId;
                      const borderColor =
                        box.type === "Question" ? "#d32f2f" : "#1976d2";
                      const bgColor = isActive
                        ? box.type === "Question"
                          ? "#ffebee"
                          : "#e3f2fd"
                        : "#f9f9f9";
                      return (
                        <Box
                          key={box.id}
                          sx={{
                            p: 1,
                            border: isActive
                              ? `2px solid ${borderColor}`
                              : "1px solid #ddd",
                            borderRadius: 1,
                            bgcolor: bgColor,
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            "&:hover": {
                              border: isActive
                                ? `2px solid ${borderColor}`
                                : "1px solid #ccc",
                              bgcolor: isActive ? bgColor : "#f0f0f0",
                            },
                          }}
                          onClick={() => handleSetActiveBox(box.id)}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              mb: 1,
                            }}
                          >
                            <Chip
                              label={box.type}
                              size="small"
                              color={
                                box.type === "Question" ? "error" : "primary"
                              }
                              onClick={(e) => {
                                e.stopPropagation();
                                handleBoxTypeChange(
                                  box.id,
                                  box.type === "Question"
                                    ? "Context"
                                    : "Question",
                                );
                              }}
                            />
                            <Typography variant="caption" sx={{ ml: "auto" }}>
                              {Math.round(box.width)} × {Math.round(box.height)}
                            </Typography>
                            <Tooltip title="Delete bounding box">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleBoxDelete(box.id);
                                }}
                                sx={{
                                  color: "#999",
                                  p: 0.5,
                                  "&:hover": {
                                    color: "#333",
                                  },
                                }}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            Position: ({Math.round(box.x)}, {Math.round(box.y)})
                          </Typography>
                        </Box>
                      );
                    })}
                  </Stack>
                )}
              </Box>

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Actions
                </Typography>
                <Stack spacing={1}>
                  <Button
                    variant="outlined"
                    size="small"
                    fullWidth
                    onClick={() => {
                      // TODO: Implement save functionality
                      console.log("Saving bounding boxes:", boundingBoxes);
                    }}
                  >
                    <Save sx={{ mr: 1 }} />
                    Save Changes
                  </Button>
                </Stack>
              </Box>
            </Stack>
          </Box>
        </Box>
      </Container>
    </>
  );
};
