# AP Evaluation Results Dashboard

## Overview

This dashboard provides a modern, interactive interface for exploring AP evaluation results. Built with React, TypeScript, and Material-UI, it offers a fast, maintainable, and visually consistent experience for viewing and analyzing model performance on AP exams.

## Features

- **Modern UI:** Responsive, accessible, and College Board-branded interface using React 19, TypeScript, and MUI.
- **Deep Linking:** Supports URLs like `/dashboard/:examSlug` and `/dashboard/:examSlug/:questionId` for direct navigation to any exam or question.
- **Fast Data Access:** Efficiently loads and displays large JSON result files with smooth scrolling and memoized rendering.
- **Rich Table:** Sortable results table with provider icons, accuracy indicators, and best-performer badges.
- **JSON Viewer:** Pretty-printed, color-coded, and scrollable JSON viewer with question navigation.
- **Download & Metadata:** Download individual result files and view metadata for each run.
- **Robust Routing:** Uses React Router for tab navigation and deep links, with dynamic page titles.
- **Sticky Footer:** Always-visible footer using Flexbox layout.
- **Type Safety:** All data structures and API responses are strongly typed with TypeScript.

## File Structure

```
source/features/dashboard/
├── components/
│   ├── ResultsTable.tsx
│   ├── SortableHeader.tsx
│   ├── ProviderIcon.tsx
│   ├── AccuracyIndicator.tsx
│   ├── BestPerformerBadge.tsx
│   ├── JsonViewer.tsx
│   └── DownloadButton.tsx
├── hooks/
│   ├── useResultsData.ts
│   ├── useSorting.ts
│   └── useJsonViewer.ts
├── types/
│   └── dashboard.types.ts
├── utils/
│   ├── sorting.ts
│   ├── formatters.ts
│   └── providers.ts
├── Dashboard.tsx
└── README.md
```

## Deep Linking & Navigation

- **Exam:** `/dashboard/AP_CALCULUS_BC_2012_openai_gpt-4o_20250707_131020`
- **Exam + Question:** `/dashboard/AP_CALCULUS_BC_2012_openai_gpt-4o_20250707_131020/AP_CALCULUS_BC_I_A_013`
- URLs update automatically when you select a question from the dropdown.

## Data Access

- **Backend API:** Results data is served via FastAPI backend at `http://localhost:8000`
- **index.json:** Used for the main dashboard table, served at `/api/v1/results/`
- **Result JSONs:** Each run is a separate JSON file, served at `/api/v1/results/{filename}`
- **API Client:** Centralized API configuration in `source/services/api.ts`
- **Deep Linking:** Direct links to any question in any run.

## Status

- All dashboard functionality is implemented and stable.
- Backend API integration is complete and working.
- JSON file viewing and downloading works via API endpoints.
- Deep linking and navigation via dropdown are supported.
- Performance is excellent, even with large files.
- Code is maintainable and follows best practices.
- Seamless College Board branding throughout.
- CORS is properly configured for local development.
