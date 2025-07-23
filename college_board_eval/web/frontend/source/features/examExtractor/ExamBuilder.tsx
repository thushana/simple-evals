import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Fade } from "@mui/material";
import Split from "react-split";

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
  ListItemIcon,
  ListItemButton,
  MenuItem,
  Menu,
} from "@mui/material";
import {
  Create,
  Delete,
  Add,
  DragIndicator,
  Folder,
  KeyboardArrowDown,
} from "@mui/icons-material";
import { useParams } from "react-router-dom";
import { API_ENDPOINTS } from "../../services/api";
import type { Manifest } from "./types/examExtractor.types";
import type { BoundingBox } from "./types/examExtractor.types";
interface ExamBuilderProps {
  boundingBoxes: BoundingBox[];
  setBoundingBoxes: React.Dispatch<React.SetStateAction<BoundingBox[]>>;
  manifest?: Manifest | null;
  transitionStage: "idle" | "fadingOut" | "fadingIn";
  // ...other props if needed
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

// Draggable Section Node Component
interface SectionNodeProps {
  section: Section;
  boundingBoxes: BoundingBox[];
  activeBoxId: string | null;
  manifest: Manifest | null;
  getSectionItemCount: (section: Section) => number;
  editingSectionId: string | null;
  editingSectionName: string;
  activeDragId: string | null;
  overDropZone: string | null;
  onToggleExpanded: (sectionId: string) => void;
  onSetActiveBox: (boxId: string) => void;
  onBoxTypeChange: (boxId: string, type: "Question" | "Context") => void;
  onBoxDelete: (boxId: string) => void;
  onAssignQuestion: (boxId: string, sectionId: string) => void;
  onQuestionNumberChange: (boxId: string, newNumber: number) => void;
  onStartEditing: (sectionId: string, currentName: string) => void;
  onUpdateSectionName: (sectionId: string, newName: string) => void;
  onCancelEditing: () => void;
  onEditingNameChange: (name: string) => void;
  examManagerFont: React.CSSProperties;
}

const DraggableSectionNode: React.FC<SectionNodeProps> = ({
  section,
  boundingBoxes,
  activeBoxId,
  manifest,
  getSectionItemCount,
  editingSectionId,
  editingSectionName,
  activeDragId,
  overDropZone,
  onToggleExpanded,
  onSetActiveBox,
  onBoxTypeChange,
  onBoxDelete,
  onAssignQuestion,
  onQuestionNumberChange,
  onStartEditing,
  onUpdateSectionName,
  onCancelEditing,
  onEditingNameChange,
  examManagerFont,
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
  console.log(
    `Section '${section.name}' rendering, sectionQuestions:`,
    sectionQuestions.map((b) => b.id),
  );

  // Check if this section is being edited
  const isEditing = editingSectionId === section.id;

  // Check if this section is a valid drop target
  const isDropTarget =
    overDropZone === section.id && activeDragId !== section.id;
  const isRootSection =
    section.id === toSnakeCase(manifest?.metadata.slug || "");
  const canAcceptDrop = !isRootSection || activeDragId !== section.id;

  // Get total count of items in this section
  const sectionItemCount = getSectionItemCount(section);

  const handleNameClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isRootSection) {
      onStartEditing(section.id, section.name);
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onUpdateSectionName(section.id, editingSectionName);
    } else if (e.key === "Escape") {
      onCancelEditing();
    }
  };

  return (
    <div ref={setNodeRef} style={style}>
      <ListItem disablePadding>
        <ListItemButton
          onClick={() => onToggleExpanded(section.id)}
          sx={{
            minHeight: 40,
            borderRadius: 1,
            pl: 1,
            py: 0.5,
            // Root section: blue border/background
            ...(isRootSection
              ? {
                  backgroundColor: COLORS.ui.selectedPageBg,
                  border: `1px solid ${COLORS.ui.selectedPage}`,
                }
              : {
                  backgroundColor: "#f5f5f5",
                  border: "1px solid #bbb",
                }),
            // Drop target highlight overlays base style
            ...(isDropTarget &&
              canAcceptDrop && {
                backgroundColor: COLORS.ui.selectedPageBg,
                border: `2px dashed ${COLORS.ui.selectedPage}`,
                boxShadow: `0 0 8px ${COLORS.ui.selectedPage}40`,
              }),
            transition: "all 0.2s ease",
          }}
        >
          <ListItemIcon sx={{ minWidth: 24 }}>
            {!isRootSection && (
              <DragIndicator
                fontSize="small"
                sx={{ color: COLORS.ui.dragHandle, cursor: "grab" }}
                {...attributes}
                {...listeners}
              />
            )}
          </ListItemIcon>
          <ListItemIcon sx={{ minWidth: 24, fontSize: 20, color: "#666" }}>
            {section.expanded ? (
              <KeyboardArrowDown fontSize="small" />
            ) : (
              <KeyboardArrowDown
                fontSize="small"
                sx={{ transform: "rotate(-90deg)" }}
              />
            )}
          </ListItemIcon>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Folder fontSize="small" />
            {isEditing ? (
              <TextField
                size="small"
                value={editingSectionName}
                onChange={(e) => onEditingNameChange(e.target.value)}
                onKeyDown={handleNameKeyDown}
                onBlur={() =>
                  onUpdateSectionName(section.id, editingSectionName)
                }
                autoFocus
                sx={{
                  "& .MuiInputBase-input": {
                    fontFamily: "Roboto Mono, monospace",
                    fontWeight: isRootSection ? 700 : 500,
                    fontSize: "0.875rem",
                    padding: "2px 8px",
                  },
                }}
                InputProps={{ style: examManagerFont }}
              />
            ) : (
              <Typography
                variant="body2"
                fontWeight={700}
                sx={{
                  fontFamily: "Roboto Mono, monospace",
                  ...(isRootSection && { color: COLORS.ui.selectedPage }),
                  ...(!isRootSection && { cursor: "pointer" }),
                  "&:hover": !isRootSection
                    ? { textDecoration: "underline" }
                    : {},
                }}
                onClick={handleNameClick}
              >
                {section.name?.trim() ? section.name : "Section"}
              </Typography>
            )}
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontFamily: "Roboto Mono, monospace" }}
            >
              ({sectionItemCount})
            </Typography>
          </Box>
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
                manifest={manifest}
                getSectionItemCount={getSectionItemCount}
                editingSectionId={editingSectionId}
                editingSectionName={editingSectionName}
                onToggleExpanded={onToggleExpanded}
                onSetActiveBox={onSetActiveBox}
                onBoxTypeChange={onBoxTypeChange}
                onBoxDelete={onBoxDelete}
                onAssignQuestion={onAssignQuestion}
                onQuestionNumberChange={onQuestionNumberChange}
                onStartEditing={onStartEditing}
                onUpdateSectionName={onUpdateSectionName}
                onCancelEditing={onCancelEditing}
                onEditingNameChange={onEditingNameChange}
                activeDragId={activeDragId}
                overDropZone={overDropZone}
                examManagerFont={examManagerFont}
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
                    fontFamily: "Roboto Mono, monospace",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setTypeAnchorEl(e.currentTarget);
                    setShowTypeDropdown(!showTypeDropdown);
                  }}
                >
                  <span style={{ fontFamily: "Roboto Mono, monospace" }}>
                    {box.type}
                  </span>
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
                        sx={{ fontFamily: "Roboto Mono, monospace" }}
                      >
                        Question
                      </MenuItem>
                      <MenuItem
                        value="Context"
                        onClick={() => {
                          onBoxTypeChange(box.id, "Context");
                          setShowTypeDropdown(false);
                        }}
                        sx={{ fontFamily: "Roboto Mono, monospace" }}
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
                      fontFamily: "Roboto Mono, monospace",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setNumberAnchorEl(e.currentTarget);
                      setShowNumberDropdown(!showNumberDropdown);
                    }}
                  >
                    <span style={{ fontFamily: "Roboto Mono, monospace" }}>
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
                              sx={{ fontFamily: "Roboto Mono, monospace" }}
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
                  console.log("Delete button clicked for box:", box.id);
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

// 1. Define a style object for Exam Manager text
const EXAM_MANAGER_FONT = {
  fontFamily: "Roboto Mono, monospace",
  fontWeight: 400,
  fontSize: "1rem",
};

export const ExamBuilder: React.FC<ExamBuilderProps> = ({
  boundingBoxes,
  setBoundingBoxes,
  manifest: manifestProp,
  transitionStage,
}) => {
  console.log("ExamBuilder mounted");
  const safeBoundingBoxes = useMemo(
    () => (Array.isArray(boundingBoxes) ? boundingBoxes : []),
    [boundingBoxes],
  );
  const { slug } = useParams<{ slug: string }>();
  const [manifest, setManifest] = useState<Manifest | null>(
    manifestProp || null,
  );
  const [loading, setLoading] = useState(!manifestProp);
  const [error, setError] = useState<string | null>(null);
  const [selectedPage, setSelectedPage] = useState<number>(1);
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
  const [pendingBoxId, setPendingBoxId] = useState<string | null>(null);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingSectionName, setEditingSectionName] = useState("");
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [overDropZone, setOverDropZone] = useState<string | null>(null);

  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Fetch manifest data only if not provided as prop
  useEffect(() => {
    if (manifestProp) {
      setManifest(manifestProp);
      setLoading(false);
      return;
    }
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
  }, [slug, manifestProp]);

  // Create default root section when manifest loads
  useEffect(() => {
    if (manifest && sections.length === 0) {
      const rootSection: Section = {
        id: toSnakeCase(manifest.metadata.slug),
        name: toSnakeCase(manifest.metadata.slug).toUpperCase(),
        type: "section",
        children: [],
        expanded: true,
      };
      setSections([rootSection]);
    }
  }, [manifest, sections.length]);

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
    safeBoundingBoxes
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
  }, [safeBoundingBoxes, selectedPage, activeBoxId, currentBox, drawStart]);

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
          const activeBox = safeBoundingBoxes.find(
            (box) => box.id === activeBoxId,
          );
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

  // Clean, direct bounding box deletion
  const handleBoxDelete = (boxId: string) => {
    setBoundingBoxes((prev) => {
      const updated = prev.filter((box) => box.id !== boxId);
      console.log("After delete:", updated);
      return updated;
    });
  };

  // Handle setting active box
  const handleSetActiveBox = (boxId: string) => {
    setActiveBoxId(boxId);
  };

  // Section management functions
  const addSection = (name: string, parentId: string | null = null) => {
    const safeName = name?.trim() ? name : "Section";
    const internalId = toSnakeCase(safeName);
    const rootSectionId = manifest ? toSnakeCase(manifest.metadata.slug) : null;

    const newSection: Section = {
      id: internalId,
      name: internalId.toUpperCase(),
      type: "section",
      children: [],
      expanded: true,
    };

    // Default to root section if no parent specified
    const targetParentId = parentId || rootSectionId;

    if (!targetParentId) {
      // Add to root level (fallback)
      setSections((prev) => [...prev, newSection]);
    } else {
      // Add to specific parent
      setSections((prev) =>
        addSectionToParent(prev, targetParentId, newSection),
      );
    }
  };

  // Add a new section and start editing it immediately
  const addNewSectionAndEdit = () => {
    const tempId = `temp_${Date.now()}`;
    const rootSectionId = manifest ? toSnakeCase(manifest.metadata.slug) : null;

    const newSection: Section = {
      id: tempId,
      name: "NEW_SECTION",
      type: "section",
      children: [],
      expanded: true,
    };

    // Add to root section by default
    const targetParentId = rootSectionId;
    if (!targetParentId) {
      setSections((prev) => [...prev, newSection]);
    } else {
      setSections((prev) =>
        addSectionToParent(prev, targetParentId, newSection),
      );
    }

    // Start editing immediately with empty field
    setEditingSectionId(tempId);
    setEditingSectionName("");
  };

  // Update section name
  const updateSectionName = (sectionId: string, newName: string) => {
    const safeName = newName?.trim() ? newName : "Section";
    const conformedName = toSnakeCase(safeName).toUpperCase();

    setSections((prev) => {
      const updateSectionRecursive = (sections: Section[]): Section[] => {
        return sections.map((section) => {
          if (section.id === sectionId) {
            return { ...section, name: conformedName };
          }
          if (section.children.length > 0) {
            return {
              ...section,
              children: updateSectionRecursive(section.children as Section[]),
            };
          }
          return section;
        });
      };
      return updateSectionRecursive(prev);
    });

    setEditingSectionId(null);
    setEditingSectionName("");
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

  // Wrap getQuestionsInSection in useCallback
  const getQuestionsInSection = useCallback(
    (sectionId: string): BoundingBox[] => {
      return safeBoundingBoxes.filter((box) => box.sectionId === sectionId);
    },
    [safeBoundingBoxes],
  );

  // Count all items in a section (questions + child sections)
  const getSectionItemCount = (section: Section): number => {
    let count = 0;

    // Count questions in this section
    const questionsInSection = getQuestionsInSection(section.id);
    count += questionsInSection.length;

    // Count child sections
    count += section.children.filter(
      (child) => child.type === "section",
    ).length;

    return count;
  };

  const getNextQuestionNumber = useCallback(
    (sectionId: string): number => {
      const questionsInSection = getQuestionsInSection(sectionId);
      if (questionsInSection.length === 0) {
        return 1;
      }
      const maxNumber = Math.max(
        ...questionsInSection.map((q) => q.questionNumber || 0),
      );
      return maxNumber + 1;
    },
    [getQuestionsInSection],
  );

  const renumberQuestionsInSection = useCallback(
    (sectionId: string) => {
      const questionsInSection = getQuestionsInSection(sectionId);
      const sortedQuestions = questionsInSection.sort(
        (a, b) => (a.questionNumber || 0) - (b.questionNumber || 0),
      );

      setBoundingBoxes((prev) =>
        prev.map((box) => {
          if (box.sectionId === sectionId) {
            const questionIndex = sortedQuestions.findIndex(
              (q) => q.id === box.id,
            );
            return {
              ...box,
              questionNumber: questionIndex + 1,
            };
          }
          return box;
        }),
      );
    },
    [getQuestionsInSection, setBoundingBoxes],
  );

  const handleQuestionNumberChange = (boxId: string, newNumber: number) => {
    setBoundingBoxes((prev) =>
      prev.map((box) =>
        box.id === boxId ? { ...box, questionNumber: newNumber } : box,
      ),
    );
  };

  const assignQuestionToSection = useCallback(
    (boxId: string, sectionId: string) => {
      // First, remove the question from its current section (if any)
      const currentBox = safeBoundingBoxes.find((box) => box.id === boxId);
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
    },
    [
      safeBoundingBoxes,
      renumberQuestionsInSection,
      getNextQuestionNumber,
      setBoundingBoxes,
    ],
  );

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    setOverDropZone(over ? (over.id as string) : null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    // Clear drag state
    setActiveDragId(null);
    setOverDropZone(null);

    if (!over || active.id === over.id) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    const rootSectionId = manifest ? toSnakeCase(manifest.metadata.slug) : null;

    // Prevent moving the root section
    if (activeId === rootSectionId) {
      console.log("Cannot move root section");
      return;
    }

    // Helper function to find what type of item an ID represents
    const getItemType = (
      id: string,
    ): "root" | "section" | "question" | "unknown" => {
      if (id === rootSectionId) return "root";
      if (
        sections.some((section) => section.id === id) ||
        sections.some(
          (section) => findSectionInHierarchy([section], id) !== null,
        )
      ) {
        return "section";
      }
      if (safeBoundingBoxes.some((box) => box.id === id)) {
        return "question";
      }
      return "unknown";
    };

    const activeType = getItemType(activeId);
    const overType = getItemType(overId);

    console.log("Drag operation:", {
      activeId,
      overId,
      activeType,
      overType,
    });

    // Rule 1: Section to Section (nesting)
    if (activeType === "section" && overType === "section") {
      console.log("Section to Section: Nesting");
      setSections((prev) => {
        const { removedSection, updatedSections } = findAndRemoveSection(
          prev,
          activeId,
        );
        if (removedSection) {
          return addSectionToParent(updatedSections, overId, removedSection);
        }
        return prev;
      });
    }
    // Rule 2: Section to Root (move to root level)
    else if (activeType === "section" && overType === "root") {
      console.log("Section to Root: Move to root level");
      setSections((prev) => {
        const { removedSection, updatedSections } = findAndRemoveSection(
          prev,
          activeId,
        );
        if (removedSection && rootSectionId) {
          return addSectionToParent(
            updatedSections,
            rootSectionId,
            removedSection,
          );
        }
        return prev;
      });
    }
    // Rule 3: Question to Section (move question to section)
    else if (activeType === "question" && overType === "section") {
      console.log("Question to Section: Move question to section");
      assignQuestionToSection(activeId, overId);
    }
    // Rule 4: Question to Root (move question to root section)
    else if (activeType === "question" && overType === "root") {
      console.log("Question to Root: Move question to root section");
      if (rootSectionId) {
        assignQuestionToSection(activeId, rootSectionId);
      }
    }
    // Rule 5: Question to Question (reorder within same section)
    else if (activeType === "question" && overType === "question") {
      console.log("Question to Question: Reorder within section");

      // Find which section contains both questions
      const findSectionWithQuestions = (
        sections: Section[],
        q1Id: string,
        q2Id: string,
      ): Section | null => {
        for (const section of sections) {
          const hasQ1 = section.children.some(
            (child) => child.type === "question" && child.id === q1Id,
          );
          const hasQ2 = section.children.some(
            (child) => child.type === "question" && child.id === q2Id,
          );
          if (hasQ1 && hasQ2) {
            return section;
          }
          // Check nested sections
          for (const child of section.children) {
            if (child.type === "section") {
              const found = findSectionWithQuestions(
                [child as Section],
                q1Id,
                q2Id,
              );
              if (found) return found;
            }
          }
        }
        return null;
      };

      const sectionWithQuestions = findSectionWithQuestions(
        sections,
        activeId,
        overId,
      );

      if (sectionWithQuestions) {
        setSections((prev) => {
          const updateSectionRecursive = (sections: Section[]): Section[] => {
            return sections.map((section) => {
              if (section.id === sectionWithQuestions.id) {
                const children = [...section.children];
                const oldIndex = children.findIndex(
                  (child) => child.id === activeId,
                );
                const newIndex = children.findIndex(
                  (child) => child.id === overId,
                );

                if (oldIndex !== -1 && newIndex !== -1) {
                  const [movedQuestion] = children.splice(oldIndex, 1);
                  children.splice(newIndex, 0, movedQuestion);

                  // Renumber questions in this section
                  let questionNumber = 1;
                  children.forEach((child) => {
                    if (child.type === "question") {
                      const question = child as Question;
                      question.questionNumber = questionNumber++;
                    }
                  });
                }

                return { ...section, children };
              }

              // Check nested sections
              if (section.children.length > 0) {
                const updatedChildren = section.children.map((child) => {
                  if (child.type === "section") {
                    const updatedNestedSections = updateSectionRecursive([
                      child as Section,
                    ]);
                    return updatedNestedSections[0];
                  }
                  return child;
                });
                return { ...section, children: updatedChildren };
              }

              return section;
            });
          };

          return updateSectionRecursive(prev);
        });
      }
    }
    // Rule 6: Section to Empty Space (move to root level)
    else if (activeType === "section" && overType === "unknown") {
      console.log("Section to Empty: Move to root level");
      setSections((prev) => {
        const { removedSection, updatedSections } = findAndRemoveSection(
          prev,
          activeId,
        );
        if (removedSection && rootSectionId) {
          return addSectionToParent(
            updatedSections,
            rootSectionId,
            removedSection,
          );
        }
        return prev;
      });
    }
    // Rule 7: Question to Empty Space (move to root section)
    else if (activeType === "question" && overType === "unknown") {
      console.log("Question to Empty: Move to root section");
      if (rootSectionId) {
        assignQuestionToSection(activeId, rootSectionId);
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

  // Helper function to find and remove a section from the hierarchy (immutable)
  const findAndRemoveSection = (
    sections: Section[],
    sectionId: string,
  ): { removedSection: Section | null; updatedSections: Section[] } => {
    for (let i = 0; i < sections.length; i++) {
      if (sections[i].id === sectionId) {
        // Remove from current level (immutable)
        const updatedSections = [...sections];
        const [removedSection] = updatedSections.splice(i, 1);
        return { removedSection, updatedSections };
      }

      // Search in children
      const result = findAndRemoveSection(
        sections[i].children as Section[],
        sectionId,
      );
      if (result.removedSection) {
        // Update the children array immutably
        const updatedSections = [...sections];
        updatedSections[i] = {
          ...updatedSections[i],
          children: result.updatedSections,
        };
        return { removedSection: result.removedSection, updatedSections };
      }
    }

    return { removedSection: null, updatedSections: sections };
  };

  // No zoom/pan controls needed

  // Assign the pending box to the new section after sections update
  useEffect(() => {
    if (pendingBoxId && sections.length > 0) {
      assignQuestionToSection(pendingBoxId, sections[0].id);
      setPendingBoxId(null);
    }
  }, [sections, pendingBoxId, assignQuestionToSection]);

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
  const pageBoundingBoxes = safeBoundingBoxes.filter(
    (box) => box.pageNumber === selectedPage,
  );
  console.log(
    "Overlay rendering, pageBoundingBoxes:",
    pageBoundingBoxes.map((b) => b.id),
  );

  return (
    <>
      {/* Header */}
      <Fade
        in={transitionStage !== "fadingOut"}
        timeout={400}
        style={{ transitionDelay: "0ms" }}
      >
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
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
              }}
            >
              <Typography
                variant="h3"
                component="h1"
                sx={{ fontWeight: 700, color: COLORS.text.white }}
              >
                {manifest.metadata.slug}
              </Typography>
              <Button
                variant="outlined"
                sx={{
                  background: "#fff",
                  color: "#0677C9",
                  border: "2px solid #0677C9",
                  fontWeight: 600,
                  boxShadow: 2,
                  ml: 2,
                  "&:hover": {
                    background: "#f0f8ff",
                    borderColor: "#005a9e",
                    color: "#005a9e",
                  },
                }}
              >
                Save Changes
              </Button>
            </Box>
          </Container>
        </Box>
      </Fade>

      <Fade
        in={transitionStage !== "fadingOut"}
        timeout={400}
        style={{ transitionDelay: "120ms" }}
      >
        <Box sx={{ py: 0, px: "15px", width: "100%" }}>
          <Box
            sx={{
              display: "flex",
              width: "100%",
              height: "calc(100vh - 200px)",
            }}
          >
            {/* Thumbnail Column (fixed 90px, full height with scroll) */}
            <Box
              sx={{
                width: 90,
                flexShrink: 0,
                height: "100%",
                overflowY: "auto",
                overflowX: "hidden",
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

            {/* Preview Image Pane (scaled to full height, constrained to image width) */}
            <Box
              sx={{
                px: 1,
                display: "flex",
                flexDirection: "column",
                height: "100%",
                flexShrink: 0, // Don't shrink
                maxWidth: "700px", // Constrain to reasonable width for scaled image
                minWidth: "400px", // Minimum for usability
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mb: 2,
                }}
              >
                <Typography variant="h6">Page {selectedPage}</Typography>
                <Box sx={{ ml: "auto", display: "flex", gap: 1 }}>
                  <Tooltip
                    title={
                      drawingEnabled ? "Disable Drawing" : "Enable Drawing"
                    }
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
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
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
                        height: "100%",
                        width: "auto",
                        display: "block",
                        objectFit: "contain",
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

            {/* Split for Exam Manager and Question Manager (horizontal 50/50) */}
            <Box
              sx={{
                flex: 1,
                minWidth: 0,
              }}
            >
              <Split
                sizes={[50, 50]}
                direction="horizontal"
                gutterSize={8}
                snapOffset={0}
                expandToMin={true}
                style={{ display: "flex", width: "100%", height: "100%" }}
                gutter={() => {
                  const gutter = document.createElement("div");
                  gutter.style.background = "transparent";
                  gutter.style.width = "8px";
                  gutter.style.cursor = "col-resize";
                  gutter.style.margin = "0";
                  gutter.style.display = "flex";
                  gutter.style.alignItems = "center";
                  gutter.innerHTML =
                    '<div style="width:2px;height:100%;background:#bbb;margin:auto;"></div>';
                  return gutter;
                }}
              >
                {/* Exam Manager Rail */}
                <Box
                  sx={{
                    width: "100%",
                    minWidth: 0,
                    px: 1,
                    p: 2,
                    overflowY: "auto",
                  }}
                >
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    Exam Manager
                  </Typography>

                  <Stack spacing={1} sx={EXAM_MANAGER_FONT}>
                    {/* Sections List */}
                    {sections.length === 0 ? (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ p: 1, ...EXAM_MANAGER_FONT }}
                      >
                        No sections created. Add a section to organize
                        questions.
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
                          items={sections.map((s) => s.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <Stack spacing={1} sx={EXAM_MANAGER_FONT}>
                            {sections.map((section) => (
                              <DraggableSectionNode
                                key={section.id}
                                section={section}
                                boundingBoxes={safeBoundingBoxes}
                                activeBoxId={activeBoxId}
                                manifest={manifest}
                                getSectionItemCount={getSectionItemCount}
                                editingSectionId={editingSectionId}
                                editingSectionName={editingSectionName}
                                onToggleExpanded={toggleSectionExpanded}
                                onSetActiveBox={handleSetActiveBox}
                                onBoxTypeChange={handleBoxTypeChange}
                                onBoxDelete={handleBoxDelete}
                                onAssignQuestion={assignQuestionToSection}
                                onQuestionNumberChange={
                                  handleQuestionNumberChange
                                }
                                onStartEditing={(sectionId, currentName) => {
                                  setEditingSectionId(sectionId);
                                  setEditingSectionName(currentName);
                                }}
                                onUpdateSectionName={updateSectionName}
                                onCancelEditing={() => {
                                  setEditingSectionId(null);
                                  setEditingSectionName("");
                                }}
                                onEditingNameChange={setEditingSectionName}
                                activeDragId={activeDragId}
                                overDropZone={overDropZone}
                                examManagerFont={EXAM_MANAGER_FONT}
                              />
                            ))}
                          </Stack>
                        </SortableContext>
                      </DndContext>
                    )}

                    {/* Add Section Button */}
                    <Button
                      variant="outlined"
                      size="small"
                      fullWidth
                      startIcon={<Add />}
                      onClick={addNewSectionAndEdit}
                      sx={{ mt: 2 }}
                    >
                      Add Section
                    </Button>
                  </Stack>
                </Box>

                {/* Question Manager */}
                <Box
                  sx={{
                    width: "100%",
                    minWidth: 0,
                    px: 1,
                    p: 2,
                    overflowY: "auto",
                  }}
                >
                  {/* QuestionManager placeholder */}
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Question Manager
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Question management interface coming soon...
                  </Typography>
                </Box>
              </Split>
            </Box>
          </Box>
        </Box>
      </Fade>
    </>
  );
};
