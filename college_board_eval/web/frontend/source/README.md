# Frontend Directory Organization

## Overview

This frontend is built with React 19, TypeScript, Material-UI, and Vite, following a feature-based architecture for scalability and maintainability.

## Getting Started

- Install dependencies: `npm install`
- Start dev server: `npm run dev`
- Lint: `npm run lint`
- Type check: `npm run typecheck`
- Format: `npm run format`

## Features

- Feature-based directory structure for scalability
- Modern React + TypeScript + MUI + Vite stack
- Deep linking and robust routing
- Modular, reusable components and hooks
- Strong type safety throughout

## Directory Structure

```
source/
├── components/           # Shared components across features
│   ├── Layout.tsx       # Main layout (header, footer, navigation)
│   ├── common/          # Reusable UI components
│   │   ├── LoadingSpinner.tsx
│   │   ├── ErrorBoundary.tsx
│   │   └── ...
├── features/            # Feature-based organization
│   ├── dashboard/       # Dashboard feature
│   │   ├── components/  # Dashboard-specific components
│   │   ├── hooks/       # Dashboard-specific hooks
│   │   ├── types/       # TypeScript interfaces
│   │   ├── utils/       # Dashboard utilities
│   │   ├── Dashboard.tsx # Main dashboard component
│   │   └── README.md    # Dashboard-specific documentation
│   ├── examExtractor/   # Exam Extractor feature
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── types/
│   │   ├── utils/
│   │   └── ExamExtractor.tsx
│   └── project/         # Project feature
│       ├── components/
│       ├── hooks/
│       ├── types/
│       ├── utils/
│       └── Project.tsx
├── services/            # API and data services
│   ├── api.ts          # API client configuration
│   ├── results.ts      # Results data fetching
│   └── ...
├── types/               # Global TypeScript types
│   ├── common.ts
│   └── ...
├── utils/               # Global utilities
│   ├── constants.ts
│   └── ...
├── App.tsx              # Main app with routing/tabs
└── main.tsx             # Entry point
```

## Organization Principles

### 1. Feature-Based Architecture

Each major feature gets its own directory under `features/` with a consistent internal structure:

- `components/` - Feature-specific React components
- `hooks/` - Feature-specific custom hooks
- `types/` - TypeScript interfaces for the feature
- `utils/` - Feature-specific utility functions
- Main feature component (e.g., `Dashboard.tsx`)

### 2. Shared vs Feature-Specific

- **Shared**: Components, types, and utilities used across multiple features
- **Feature-Specific**: Components, hooks, types, and utilities used only within one feature

### 3. Clear Boundaries

- Features are self-contained with minimal cross-dependencies
- Shared code is explicitly placed in shared directories
- Each feature can be developed and tested independently

## Feature Directories

### `/features/dashboard/`

AP Evaluation Results Dashboard - displays performance metrics for AI models on AP exams.

**Key Components:**

- ResultsTable - Main data table with sorting
- JsonViewer - Modal for viewing detailed JSON results
- ProviderIcon - Favicon display for AI providers
- AccuracyIndicator - Color-coded accuracy display

**Data Sources:**

- `index.json` - Aggregated results data
- Individual result JSON files for detailed viewing

### `/features/examExtractor/`

PDF upload and processing interface for creating exam assets.

**Key Components:**

- FileUpload - Drag-and-drop PDF upload
- ProcessingStatus - Progress indicators
- ResultsDisplay - Extracted exam data preview

### `/features/project/`

Project overview and information page.

## Shared Directories

### `/components/`

Reusable UI components used across multiple features:

- `Layout.tsx` - Main application layout
- `common/` - Generic UI components (buttons, spinners, etc.)

### `/services/`

API and data fetching logic:

- `api.ts` - Base API client configuration
- `results.ts` - Results data fetching service
- Feature-specific services as needed

### `/types/`

Global TypeScript type definitions:

- `common.ts` - Shared interfaces and types
- Feature-specific types should live in their feature directory

### `/utils/`

Global utility functions:

- `constants.ts` - Application constants
- `formatters.ts` - Data formatting utilities
- `validators.ts` - Input validation functions

## Best Practices

### 1. Import Organization

```typescript
// External libraries
import React from "react";
import { Box, Typography } from "@mui/material";

// Shared imports
import { Layout } from "@/components/Layout";
import { useApi } from "@/services/api";

// Feature-specific imports
import { ResultsTable } from "./components/ResultsTable";
import { useResultsData } from "./hooks/useResultsData";
import { ResultEntry } from "./types/dashboard.types";
```

### 2. File Naming

- Components: PascalCase (e.g., `ResultsTable.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useResultsData.ts`)
- Types: camelCase with `.types.ts` suffix (e.g., `dashboard.types.ts`)
- Utils: camelCase (e.g., `sorting.ts`)

### 3. Component Structure

```typescript
// components/ResultsTable.tsx
import React from "react";
import { Table } from "@mui/material";
import { useResultsData } from "../hooks/useResultsData";
import { ResultEntry } from "../types/dashboard.types";

interface ResultsTableProps {
  // props
}

export const ResultsTable: React.FC<ResultsTableProps> = (props) => {
  // component logic
};
```

## Project Status

The frontend is fully migrated to a feature-based, scalable architecture. All new features and refactors should follow this structure.

## Benefits

1. **Scalability**: Easy to add new features without cluttering
2. **Maintainability**: Clear boundaries and organization
3. **Reusability**: Shared components and utilities
4. **Team Development**: Multiple developers can work on different features
5. **Testing**: Features can be tested independently
6. **Code Splitting**: Natural boundaries for lazy loading

## Contributing

- Please follow the file and directory structure outlined above.
- Use Prettier and ESLint for code style and linting.
- Submit pull requests with clear descriptions and reference related issues if applicable.
- Write or update documentation in feature-level README files as needed.
