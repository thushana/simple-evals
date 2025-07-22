import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Color constants
const COLORS = {
  question: {
    primary: "#d32f2f",
    light: "#ffebee",
    canvas: "rgba(211, 47, 47, 1)",
    canvasInactive: "rgba(211, 47, 47, 0.5)",
  },
  context: {
    primary: "#009cde",
    light: "#e3f2fd",
    canvas: "rgba(25, 118, 210, 1)",
    canvasInactive: "rgba(25, 118, 210, 0.5)",
  },
  ui: {
    border: "#ddd",
    borderHover: "#ccc",
    background: "#f9f9f9",
    backgroundHover: "#f0f0f0",
    dragHandle: "#999",
    dragHandleHover: "#333",
    selectedPage: "#0677C9",
    selectedPageBg: "#f0f8ff",
    headerGradient: "linear-gradient(135deg, #009cde 0%, #0077c8 100%)",
  },
  text: {
    white: "#fff",
    secondary: "text.secondary",
  },
} as const;

// Common styles
const COMMON_STYLES = {
  pill: {
    borderRadius: 1,
    fontSize: "0.95em",
    fontWeight: 600,
    fontFamily: "'Roboto Mono', monospace",
    height: 32,
    minWidth: 120,
    boxShadow: "none",
    px: 0,
    overflow: "hidden",
  },
  label: {
    borderRadius: 1,
    fontSize: "0.75rem",
    fontWeight: 600,
    fontFamily: "'Roboto Mono', monospace",
    lineHeight: 1,
    whiteSpace: "nowrap",
    pointerEvents: "none",
    zIndex: 5,
    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
  },
  dragHandle: {
    color: COLORS.ui.dragHandle,
    cursor: "grab",
  },
} as const;

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
  MenuItem,
  Menu,
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
  KeyboardArrowDown,
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
  onQuestionNumberChange: (boxId: string, newNumber: number) => void;
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
  onQuestionNumberChange,
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
              sx={{ color: COLORS.ui.dragHandle, cursor: "grab" }}
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
                onQuestionNumberChange={onQuestionNumberChange}
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
                onQuestionNumberChange={onQuestionNumberChange}
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
  onQuestionNumberChange: (boxId: string, newNumber: number) => void;
}

const DraggableQuestionItem: React.FC<DraggableQuestionItemProps> = ({
  box,
  activeBoxId,
  onSetActiveBox,
  onBoxTypeChange,
  onBoxDelete,
  onQuestionNumberChange,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: box.id });

  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showNumberDropdown, setShowNumberDropdown] = useState(false);
  const [typeAnchorEl, setTypeAnchorEl] = useState<null | HTMLElement>(null);
  const [numberAnchorEl, setNumberAnchorEl] = useState<null | HTMLElement>(
    null,
  );

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isActive = box.id === activeBoxId;
  const borderColor =
    box.type === "Question" ? COLORS.question.primary : COLORS.context.primary;
  const bgColor = isActive
    ? box.type === "Question"
      ? COLORS.question.light
      : COLORS.context.light
    : COLORS.ui.background;

  return (
    <div ref={setNodeRef} style={style}>
      <ListItem disablePadding>
        <Box
          sx={{
            width: "100%",
            p: 0.5,
            border: isActive
              ? `2px solid ${borderColor}`
              : `1px solid ${COLORS.ui.border}`,
            borderRadius: 1,
            bgcolor: bgColor,
            cursor: "pointer",
            transition: "all 0.2s ease",
            "&:hover": {
              border: isActive
                ? `2px solid ${borderColor}`
                : `1px solid ${COLORS.ui.borderHover}`,
              bgcolor: isActive ? bgColor : COLORS.ui.backgroundHover,
            },
          }}
          onClick={() => onSetActiveBox(box.id)}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 0 }}>
              <DragIndicator
                fontSize="small"
                sx={{ color: COLORS.ui.dragHandle, cursor: "grab" }}
                {...attributes}
                {...listeners}
              />
              {/* Pill start */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  bgcolor: isActive
                    ? box.type === "Question"
                      ? COLORS.question.primary
                      : COLORS.context.primary
                    : box.type === "Question"
                      ? COLORS.question.light
                      : COLORS.context.light,
                  color: isActive
                    ? COLORS.text.white
                    : box.type === "Question"
                      ? COLORS.question.primary
                      : COLORS.context.primary,
                  ...COMMON_STYLES.pill,
                }}
              >
                {/* Type dropdown */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    px: 2,
                    py: 0.5,
                    cursor: "pointer",
                    borderTopLeftRadius: 4,
                    borderBottomLeftRadius: 4,
                    borderTopRightRadius: box.type === "Question" ? 0 : 4,
                    borderBottomRightRadius: box.type === "Question" ? 0 : 4,
                    background: "inherit",
                    borderRight:
                      box.type === "Question"
                        ? "1px solid rgba(0,0,0,0.08)"
                        : "none",
                    position: "relative",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setTypeAnchorEl(e.currentTarget);
                    setShowTypeDropdown(!showTypeDropdown);
                  }}
                >
                  <span>{box.type}</span>
                  <KeyboardArrowDown fontSize="small" />
                  {showTypeDropdown && (
                    <Menu
                      anchorEl={typeAnchorEl}
                      open={showTypeDropdown}
                      onClose={() => setShowTypeDropdown(false)}
                      anchorOrigin={{
                        vertical: "top",
                        horizontal: "left",
                      }}
                      transformOrigin={{
                        vertical: "bottom",
                        horizontal: "left",
                      }}
                    >
                      <MenuItem
                        value="Question"
                        onClick={() => {
                          onBoxTypeChange(box.id, "Question");
                          setShowTypeDropdown(false);
                        }}
                      >
                        Question
                      </MenuItem>
                      <MenuItem
                        value="Context"
                        onClick={() => {
                          onBoxTypeChange(box.id, "Context");
                          setShowTypeDropdown(false);
                        }}
                      >
                        Context
                      </MenuItem>
                    </Menu>
                  )}
                </Box>
                {/* Number dropdown for Question only */}
                {box.type === "Question" && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      px: 2,
                      py: 0.5,
                      cursor: "pointer",
                      borderTopRightRadius: 4,
                      borderBottomRightRadius: 4,
                      background: "inherit",
                      position: "relative",
                      gap: 1,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setNumberAnchorEl(e.currentTarget);
                      setShowNumberDropdown(!showNumberDropdown);
                    }}
                  >
                    <span>
                      {(box.questionNumber || 1).toString().padStart(3, "0")}
                    </span>
                    <KeyboardArrowDown fontSize="small" />
                    {showNumberDropdown && (
                      <Menu
                        anchorEl={numberAnchorEl}
                        open={showNumberDropdown}
                        onClose={() => setShowNumberDropdown(false)}
                        anchorOrigin={{
                          vertical: "top",
                          horizontal: "left",
                        }}
                        transformOrigin={{
                          vertical: "bottom",
                          horizontal: "left",
                        }}
                      >
                        {Array.from({ length: 999 }, (_, i) => i + 1).map(
                          (num) => (
                            <MenuItem
                              key={num}
                              value={num}
                              onClick={() => {
                                onQuestionNumberChange(box.id, Number(num));
                                setShowNumberDropdown(false);
                              }}
                            >
                              {num.toString().padStart(3, "0")}
                            </MenuItem>
                          ),
                        )}
                      </Menu>
                    )}
                  </Box>
                )}
              </Box>
              {/* Pill end */}
            </Box>
            <Tooltip title="Delete bounding box">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onBoxDelete(box.id);
                }}
                sx={{
                  color: COLORS.ui.dragHandle,
                  p: 0.25,
                  "&:hover": {
                    color: COLORS.ui.dragHandleHover,
                  },
                }}
              >
                <Delete fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </ListItem>
    </div>
  );
};

// Reusable components
const BoundingBoxLabel: React.FC<{
  box: BoundingBox;
  x: number;
  y: number;
  isDrawing?: boolean;
}> = ({ box, x, y, isDrawing = false }) => (
  <Box
    sx={{
      position: "absolute",
      left: x,
      top: y - 25,
      backgroundColor: isDrawing
        ? COLORS.question.primary
        : box.type === "Question"
          ? COLORS.question.primary
          : COLORS.context.primary,
      color: COLORS.text.white,
      px: 1.5,
      py: 0.5,
      ...COMMON_STYLES.label,
      display: "flex",
      alignItems: "center",
      gap: 0.5,
    }}
  >
    {isDrawing
      ? "Question"
      : box.type === "Question"
        ? `Question ${(box.questionNumber || 1).toString().padStart(3, "0")}`
        : "Context"}
  </Box>
);

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
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [currentBox, setCurrentBox] = useState<Partial<BoundingBox> | null>(
    null,
  );
  const [drawingEnabled, setDrawingEnabled] = useState(true); // UI toggle
  const [isDrawingBox, setIsDrawingBox] = useState(false); // Two-click state
  const [showAddSection, setShowAddSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");
  const [newSectionParent, setNewSectionParent] = useState<string | null>(null);
  const [pendingBoxId, setPendingBoxId] = useState<string | null>(null);

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
        ctx.strokeStyle =
          box.type === "Question"
            ? `rgba(211, 47, 47, ${alpha})`
            : `rgba(25, 118, 210, ${alpha})`;

        ctx.lineWidth = 3;
        ctx.strokeRect(box.x, box.y, box.width, box.height);
      });

    // Draw current box being created
    if (currentBox && drawStart) {
      ctx.strokeStyle = COLORS.question.canvas;
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
    if (!imageRef.current || !drawingEnabled) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (!isDrawingBox) {
      // First click - start drawing mode
      setIsDrawingBox(true);
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
        setIsDrawingBox(false);
        setActiveBoxId(newBox.id);

        // Auto-assign to the same section as the currently active box
        if (activeBoxId) {
          const activeBox = boundingBoxes.find((box) => box.id === activeBoxId);
          if (activeBox?.sectionId) {
            assignQuestionToSection(newBox.id, activeBox.sectionId);
          } else if (sections.length > 0) {
            assignQuestionToSection(newBox.id, sections[0].id);
          }
        } else if (sections.length === 0) {
          addSection("I");
          setPendingBoxId(newBox.id);
        } else {
          assignQuestionToSection(newBox.id, sections[0].id);
        }
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current || !drawStart || !isDrawingBox) return;

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

  // Handle bounding box type change
  const handleBoxTypeChange = (boxId: string, type: "Question" | "Context") => {
    setBoundingBoxes((prev) =>
      prev.map((box) => (box.id === boxId ? { ...box, type } : box)),
    );
  };

  // Handle bounding box deletion
  const handleBoxDelete = (boxId: string) => {
    const deletedBox = boundingBoxes.find((box) => box.id === boxId);
    const sectionId = deletedBox?.sectionId;

    setBoundingBoxes((prev) => prev.filter((box) => box.id !== boxId));

    // Clear active box if it was deleted
    if (activeBoxId === boxId) {
      setActiveBoxId(null);
    }

    // Renumber questions in the section if a question was deleted
    if (sectionId) {
      setTimeout(() => renumberQuestionsInSection(sectionId), 0);
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

  const getQuestionsInSection = (sectionId: string): BoundingBox[] => {
    return boundingBoxes.filter(
      (box) => box.sectionId === sectionId && box.type === "Question",
    );
  };

  const getNextQuestionNumber = (sectionId: string): number => {
    const questions = getQuestionsInSection(sectionId);
    return questions.length + 1;
  };

  const renumberQuestionsInSection = (sectionId: string) => {
    const questions = getQuestionsInSection(sectionId);
    const updatedBoxes = [...boundingBoxes];

    questions.forEach((question, index) => {
      const boxIndex = updatedBoxes.findIndex((box) => box.id === question.id);
      if (boxIndex !== -1) {
        updatedBoxes[boxIndex] = {
          ...updatedBoxes[boxIndex],
          questionNumber: index + 1,
        };
      }
    });

    setBoundingBoxes(updatedBoxes);
  };

  const handleQuestionNumberChange = (boxId: string, newNumber: number) => {
    setBoundingBoxes((prev) =>
      prev.map((box) =>
        box.id === boxId ? { ...box, questionNumber: newNumber } : box,
      ),
    );
  };

  const assignQuestionToSection = (boxId: string, sectionId: string) => {
    // First, remove the question from its current section (if any)
    const currentBox = boundingBoxes.find((box) => box.id === boxId);
    if (currentBox?.sectionId && currentBox.sectionId !== sectionId) {
      // Renumber questions in the old section
      renumberQuestionsInSection(currentBox.sectionId);
    }

    // Assign to new section and get next number
    const questionNumber = getNextQuestionNumber(sectionId);

    setBoundingBoxes((prev) =>
      prev.map((box) =>
        box.id === boxId ? { ...box, sectionId, questionNumber } : box,
      ),
    );
  };

  // Drag and drop handlers
  const handleDragStart = () => {
    // Drag started
  };

  const handleDragOver = () => {
    // Drag over
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

        // Use the assignQuestionToSection function which handles renumbering
        assignQuestionToSection(questionId, targetSectionId);
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

  // Assign the pending box to the new section after sections update
  useEffect(() => {
    if (pendingBoxId && sections.length > 0) {
      assignQuestionToSection(pendingBoxId, sections[0].id);
      setPendingBoxId(null);
    }
  }, [sections, pendingBoxId]);

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
          <CircularProgress size={60} sx={{ color: COLORS.ui.selectedPage }} />
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
          background: COLORS.ui.headerGradient,
          color: COLORS.text.white,
          py: 3,
          px: 2,
          mb: 3,
        }}
      >
        <Container maxWidth="xl">
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton
              onClick={() => navigate("/examextractor")}
              sx={{ color: COLORS.text.white }}
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
                        ? `2px solid ${COLORS.ui.selectedPage}`
                        : `1px solid ${COLORS.ui.border}`,
                    borderRadius: 1,
                    p: 0.5,
                    bgcolor:
                      selectedPage === page.page_number
                        ? COLORS.ui.selectedPageBg
                        : "#fff",
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
                  title={drawingEnabled ? "Disable Drawing" : "Enable Drawing"}
                >
                  <IconButton
                    onClick={() => {
                      setDrawingEnabled(!drawingEnabled);
                      setIsDrawingBox(false); // Reset drawing state when toggling
                      setCurrentBox(null);
                      setDrawStart(null);
                    }}
                    size="small"
                    color={drawingEnabled ? "primary" : "default"}
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
                border: `1px solid ${COLORS.ui.border}`,
                borderRadius: 1,
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
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
                    <BoundingBoxLabel
                      key={`label-${box.id}`}
                      box={box}
                      x={box.x}
                      y={box.y}
                    />
                  ))}
                  {/* Label for current box being drawn */}
                  {currentBox && drawStart && (
                    <BoundingBoxLabel
                      box={{
                        id: "temp_box",
                        x: currentBox.x || 0,
                        y: currentBox.y || 0,
                        width: 0,
                        height: 0,
                        type: "Question",
                        pageNumber: selectedPage,
                      }}
                      x={currentBox.x || 0}
                      y={currentBox.y || 0}
                      isDrawing={true}
                    />
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
                    border: `1px solid ${COLORS.ui.border}`,
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
                        ...boundingBoxes.map((box) => box.id),
                      ]}
                      strategy={verticalListSortingStrategy}
                    >
                      <List dense sx={{ p: 0 }}>
                        {sections.map((section) => (
                          <DraggableSectionNode
                            key={section.id}
                            section={section}
                            boundingBoxes={boundingBoxes}
                            activeBoxId={activeBoxId}
                            onToggleExpanded={toggleSectionExpanded}
                            onSetActiveBox={handleSetActiveBox}
                            onBoxTypeChange={handleBoxTypeChange}
                            onBoxDelete={handleBoxDelete}
                            onAssignQuestion={assignQuestionToSection}
                            onQuestionNumberChange={handleQuestionNumberChange}
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
