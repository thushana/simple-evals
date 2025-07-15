import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type {
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Utility functions for naming conventions
const toTitleCase = (str: string): string => {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const toSnakeCase = (str: string): string => {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/(^_|_$)/g, "");
};
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
  TextField,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
} from "@mui/material";
import {
  Create,
  Save,
  ArrowBack,
  Delete,
  Add,
  ExpandMore,
  ExpandLess,
  DragIndicator,
  Folder,
} from "@mui/icons-material";
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
  questionNumber?: number;
  sectionId?: string;
}

interface Section {
  id: string;
  name: string;
  type: "section";
  children: (Section | Question)[];
  expanded?: boolean;
}

interface Question {
  id: string;
  type: "question";
  boundingBox: BoundingBox;
  questionNumber: number;
  sectionId: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type ExamNode = Section | Question;

// Draggable Section Node Component
interface SectionNodeProps {
  section: Section;
  boundingBoxes: BoundingBox[];
  activeBoxId: string | null;
  onToggleExpanded: (sectionId: string) => void;
  onSetActiveBox: (boxId: string) => void;
  onBoxTypeChange: (boxId: string, type: "Question" | "Context") => void;
  onBoxDelete: (boxId: string) => void;
  onAssignQuestion: (boxId: string, sectionId: string) => void;
}

const DraggableSectionNode: React.FC<SectionNodeProps> = ({
  section,
  boundingBoxes,
  activeBoxId,
  onToggleExpanded,
  onSetActiveBox,
  onBoxTypeChange,
  onBoxDelete,
  onAssignQuestion,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const sectionQuestions = boundingBoxes.filter(
    (box) => box.sectionId === section.id,
  );

  return (
    <div ref={setNodeRef} style={style}>
      <ListItem disablePadding>
        <ListItemButton
          onClick={() => onToggleExpanded(section.id)}
          sx={{ pl: 1, py: 0.5 }}
        >
          <ListItemIcon sx={{ minWidth: 24 }}>
            <DragIndicator
              fontSize="small"
              sx={{ color: "#999", cursor: "grab" }}
              {...attributes}
              {...listeners}
            />
          </ListItemIcon>
          <ListItemIcon sx={{ minWidth: 24 }}>
            {section.expanded ? <ExpandLess /> : <ExpandMore />}
          </ListItemIcon>
          <ListItemText
            primary={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Folder fontSize="small" />
                <Typography variant="body2" fontWeight={500}>
                  {section.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ({sectionQuestions.length} items)
                </Typography>
              </Box>
            }
          />
        </ListItemButton>
      </ListItem>

      <Collapse in={section.expanded} timeout="auto" unmountOnExit>
        <List dense sx={{ pl: 2 }}>
          <SortableContext
            items={sectionQuestions.map((q) => q.id)}
            strategy={verticalListSortingStrategy}
          >
            {sectionQuestions.map((box) => (
              <DraggableQuestionItem
                key={box.id}
                box={box}
                activeBoxId={activeBoxId}
                onSetActiveBox={onSetActiveBox}
                onBoxTypeChange={onBoxTypeChange}
                onBoxDelete={onBoxDelete}
              />
            ))}
          </SortableContext>

          {/* Render nested sections */}
          {section.children
            .filter((child): child is Section => child.type === "section")
            .map((childSection) => (
              <DraggableSectionNode
                key={childSection.id}
                section={childSection}
                boundingBoxes={boundingBoxes}
                activeBoxId={activeBoxId}
                onToggleExpanded={onToggleExpanded}
                onSetActiveBox={onSetActiveBox}
                onBoxTypeChange={onBoxTypeChange}
                onBoxDelete={onBoxDelete}
                onAssignQuestion={onAssignQuestion}
              />
            ))}
        </List>
      </Collapse>
    </div>
  );
};

// Draggable Question Item Component
interface DraggableQuestionItemProps {
  box: BoundingBox;
  activeBoxId: string | null;
  onSetActiveBox: (boxId: string) => void;
  onBoxTypeChange: (boxId: string, type: "Question" | "Context") => void;
  onBoxDelete: (boxId: string) => void;
}

const DraggableQuestionItem: React.FC<DraggableQuestionItemProps> = ({
  box,
  activeBoxId,
  onSetActiveBox,
  onBoxTypeChange,
  onBoxDelete,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: box.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isActive = box.id === activeBoxId;
  const borderColor = box.type === "Question" ? "#d32f2f" : "#1976d2";
  const bgColor = isActive
    ? box.type === "Question"
      ? "#ffebee"
      : "#e3f2fd"
    : "#f9f9f9";

  return (
    <div ref={setNodeRef} style={style}>
      <ListItem disablePadding>
        <Box
          sx={{
            width: "100%",
            p: 0.5,
            border: isActive ? `2px solid ${borderColor}` : "1px solid #ddd",
            borderRadius: 1,
            bgcolor: bgColor,
            cursor: "pointer",
            transition: "all 0.2s ease",
            "&:hover": {
              border: isActive ? `2px solid ${borderColor}` : "1px solid #ccc",
              bgcolor: isActive ? bgColor : "#f0f0f0",
            },
          }}
          onClick={() => onSetActiveBox(box.id)}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              mb: 0.5,
            }}
          >
            <DragIndicator
              fontSize="small"
              sx={{ color: "#999", cursor: "grab" }}
              {...attributes}
              {...listeners}
            />
            <Chip
              label={box.type}
              size="small"
              color={box.type === "Question" ? "error" : "primary"}
              onClick={(e) => {
                e.stopPropagation();
                onBoxTypeChange(
                  box.id,
                  box.type === "Question" ? "Context" : "Question",
                );
              }}
            />
            {box.questionNumber && (
              <Typography variant="caption" sx={{ fontWeight: 500 }}>
                #{box.questionNumber}
              </Typography>
            )}
            <Typography variant="caption" sx={{ ml: "auto" }}>
              {Math.round(box.width)} × {Math.round(box.height)}
            </Typography>
            <Tooltip title="Delete bounding box">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onBoxDelete(box.id);
                }}
                sx={{
                  color: "#999",
                  p: 0.25,
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
      </ListItem>
    </div>
  );
};

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
  const [sections, setSections] = useState<Section[]>([]);
  const [activeBoxId, setActiveBoxId] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(true); // Drawing by default
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [currentBox, setCurrentBox] = useState<Partial<BoundingBox> | null>(
    null,
  );
  const [isDrawingMode, setIsDrawingMode] = useState(false); // Track if we're in drawing mode
  const [showAddSection, setShowAddSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");
  const [newSectionParent, setNewSectionParent] = useState<string | null>(null);

  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

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

        // Auto-assign to first available section or create default section
        if (sections.length === 0) {
          addSection("I");
        }
        // Assign to first section by default
        const firstSectionId = sections[0]?.id;
        if (firstSectionId) {
          assignQuestionToSection(newBox.id, firstSectionId);
        }
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

  // Section management functions
  const addSection = (name: string, parentId: string | null = null) => {
    const displayName = toTitleCase(name);
    const internalId = toSnakeCase(name);

    const newSection: Section = {
      id: internalId,
      name: displayName,
      type: "section",
      children: [],
      expanded: true,
    };

    if (!parentId) {
      // Add to root level
      setSections((prev) => [...prev, newSection]);
    } else {
      // Add to specific parent
      setSections((prev) => addSectionToParent(prev, parentId, newSection));
    }

    setShowAddSection(false);
    setNewSectionName("");
    setNewSectionParent(null);
  };

  const addSectionToParent = (
    sections: Section[],
    parentId: string,
    newSection: Section,
  ): Section[] => {
    return sections.map((section) => {
      if (section.id === parentId) {
        return { ...section, children: [...section.children, newSection] };
      }
      return {
        ...section,
        children: addSectionToParent(
          section.children as Section[],
          parentId,
          newSection,
        ),
      };
    });
  };

  const toggleSectionExpanded = (sectionId: string) => {
    setSections((prev) => toggleSectionExpandedRecursive(prev, sectionId));
  };

  const toggleSectionExpandedRecursive = (
    sections: Section[],
    sectionId: string,
  ): Section[] => {
    return sections.map((section) => {
      if (section.id === sectionId) {
        return { ...section, expanded: !section.expanded };
      }
      return {
        ...section,
        children: toggleSectionExpandedRecursive(
          section.children as Section[],
          sectionId,
        ),
      };
    });
  };

  const getNextQuestionNumber = (sectionId: string): number => {
    const questions = getAllQuestionsInSection(sections, sectionId);
    return questions.length + 1;
  };

  const getAllQuestionsInSection = (
    sections: Section[],
    sectionId: string,
  ): Question[] => {
    const questions: Question[] = [];

    const traverse = (nodes: (Section | Question)[]) => {
      nodes.forEach((node) => {
        if (node.type === "question" && node.sectionId === sectionId) {
          questions.push(node as Question);
        } else if (node.type === "section") {
          traverse((node as Section).children);
        }
      });
    };

    traverse(sections);
    return questions;
  };

  const assignQuestionToSection = (boxId: string, sectionId: string) => {
    const questionNumber = getNextQuestionNumber(sectionId);

    setBoundingBoxes((prev) =>
      prev.map((box) =>
        box.id === boxId ? { ...box, sectionId, questionNumber } : box,
      ),
    );
  };

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    console.log("Drag started:", event.active.id);
  };

  const handleDragOver = (event: DragOverEvent) => {
    console.log("Drag over:", event.active.id, "over", event.over?.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    if (active.id !== over.id) {
      const activeId = active.id as string;
      const overId = over.id as string;

      // Check if we're dragging a section or a question
      const isDraggingSection =
        sections.some((section) => section.id === activeId) ||
        sections.some(
          (section) => findSectionInHierarchy([section], activeId) !== null,
        );

      const isOverSection =
        sections.some((section) => section.id === overId) ||
        sections.some(
          (section) => findSectionInHierarchy([section], overId) !== null,
        );

      if (isDraggingSection && isOverSection) {
        // Section to section drag (nesting or reordering)
        const draggedSectionId = activeId;
        const targetSectionId = overId;

        // Check if we're trying to nest a section (search recursively)
        const isNesting =
          findSectionInHierarchy(sections, targetSectionId) !== null;

        if (isNesting) {
          // Handle section nesting
          setSections((prev) => {
            const draggedSection = findAndRemoveSection(prev, draggedSectionId);
            if (draggedSection) {
              return addSectionToParent(prev, targetSectionId, draggedSection);
            }
            return prev;
          });
        } else {
          // Handle section reordering at same level
          setSections((prev) => {
            const oldIndex = prev.findIndex(
              (section) => section.id === active.id,
            );
            const newIndex = prev.findIndex(
              (section) => section.id === over.id,
            );

            if (oldIndex !== -1 && newIndex !== -1) {
              return arrayMove(prev, oldIndex, newIndex);
            }

            return prev;
          });
        }
      } else if (!isDraggingSection && isOverSection) {
        // Question to section drag (moving question to different section)
        const questionId = activeId;
        const targetSectionId = overId;

        // Find the question in bounding boxes
        const question = boundingBoxes.find((box) => box.id === questionId);
        if (question) {
          // Update the question's section assignment
          setBoundingBoxes((prev) =>
            prev.map((box) =>
              box.id === questionId
                ? { ...box, sectionId: targetSectionId }
                : box,
            ),
          );
        }
      }
    }
  };

  // Helper function to find a section in the hierarchy
  const findSectionInHierarchy = (
    sections: Section[],
    sectionId: string,
  ): Section | null => {
    for (const section of sections) {
      if (section.id === sectionId) {
        return section;
      }

      // Search in children
      const foundInChildren = findSectionInHierarchy(
        section.children as Section[],
        sectionId,
      );
      if (foundInChildren) {
        return foundInChildren;
      }
    }

    return null;
  };

  // Helper function to find and remove a section from the hierarchy
  const findAndRemoveSection = (
    sections: Section[],
    sectionId: string,
  ): Section | null => {
    for (let i = 0; i < sections.length; i++) {
      if (sections[i].id === sectionId) {
        // Remove from current level
        const [removedSection] = sections.splice(i, 1);
        return removedSection;
      }

      // Search in children
      const foundInChildren = findAndRemoveSection(
        sections[i].children as Section[],
        sectionId,
      );
      if (foundInChildren) {
        return foundInChildren;
      }
    }

    return null;
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

          {/* Column 3: Exam Manager */}
          <Box
            sx={{
              width: 300,
              overflow: "auto",
              flexShrink: 0,
            }}
          >
            <Typography variant="h6" sx={{ mb: 1 }}>
              Exam Manager
            </Typography>

            <Stack spacing={1}>
              {/* Add Section Button */}
              <Button
                variant="outlined"
                size="small"
                fullWidth
                startIcon={<Add />}
                onClick={() => setShowAddSection(true)}
                sx={{ mb: 1 }}
              >
                Add Section
              </Button>

              {/* Add Section Dialog */}
              {showAddSection && (
                <Box
                  sx={{
                    p: 1,
                    border: "1px solid #ddd",
                    borderRadius: 1,
                    mb: 1,
                  }}
                >
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    New Section
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    label="Section Name"
                    value={newSectionName}
                    onChange={(e) => setNewSectionName(e.target.value)}
                    placeholder="e.g., I, A, Part 1"
                    sx={{ mb: 1 }}
                  />
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() =>
                        addSection(newSectionName, newSectionParent)
                      }
                      disabled={!newSectionName.trim()}
                    >
                      Add
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        setShowAddSection(false);
                        setNewSectionName("");
                        setNewSectionParent(null);
                      }}
                    >
                      Cancel
                    </Button>
                  </Box>
                </Box>
              )}

              {/* Sections Tree */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                  Sections
                </Typography>
                {sections.length === 0 ? (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ p: 1 }}
                  >
                    No sections created. Add a section to organize questions.
                  </Typography>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={[
                        ...sections.map((s) => s.id),
                        ...pageBoundingBoxes.map((box) => box.id),
                      ]}
                      strategy={verticalListSortingStrategy}
                    >
                      <List dense sx={{ p: 0 }}>
                        {sections.map((section) => (
                          <DraggableSectionNode
                            key={section.id}
                            section={section}
                            boundingBoxes={pageBoundingBoxes}
                            activeBoxId={activeBoxId}
                            onToggleExpanded={toggleSectionExpanded}
                            onSetActiveBox={handleSetActiveBox}
                            onBoxTypeChange={handleBoxTypeChange}
                            onBoxDelete={handleBoxDelete}
                            onAssignQuestion={assignQuestionToSection}
                          />
                        ))}
                      </List>
                    </SortableContext>
                  </DndContext>
                )}
              </Box>

              {/* Actions */}
              <Box sx={{ mt: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                  Actions
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  fullWidth
                  onClick={() => {
                    // TODO: Implement save functionality
                    console.log("Saving exam structure:", {
                      sections,
                      boundingBoxes,
                    });
                  }}
                >
                  <Save sx={{ mr: 1 }} />
                  Save Changes
                </Button>
              </Box>
            </Stack>
          </Box>
        </Box>
      </Container>
    </>
  );
};
