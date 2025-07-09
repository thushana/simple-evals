# Dashboard Migration Technical Design

## Overview

This document outlines the migration strategy for moving the AP Evaluation Results Dashboard from a static HTML/vanilla JS implementation to a React/TypeScript/MUI-based system within the existing frontend architecture.

## Current State Analysis

### Existing Dashboard (Static HTML)
- **Location**: `college_board_eval/results/index.html`
- **Tech Stack**: HTML + vanilla JavaScript + Bootstrap + Font Awesome
- **Data Source**: `college_board_eval/results/index.json`
- **Features**: Sortable table, JSON viewer, deep linking, file downloads

### Target System (React Frontend)
- **Location**: `college_board_eval/web/frontend/source/features/dashboard/`
- **Tech Stack**: React 19 + TypeScript + Material-UI + Vite
- **Integration**: Part of the existing tabbed interface

## Migration Strategy: Complete Rewrite

### Why Complete Rewrite?

1. **Different Paradigms**: 
   - Current: Direct DOM manipulation, imperative programming
   - Target: Declarative React components, state management

2. **No Reusable Code**: 
   - Current: Bootstrap CSS classes, jQuery-like patterns
   - Target: MUI styled components, React hooks

3. **Different Data Flow**:
   - Current: Direct JSON loading and DOM manipulation
   - Target: React state management, hooks, and component re-rendering

## Technical Architecture

### Data Layer
```typescript
// Types mirroring the existing JSON structure
interface ResultsData {
  metadata: {
    generated_on: string;
    author_name: string;
    author_email: string;
  };
  results: ResultEntry[];
}

interface ResultEntry {
  exam: string;
  model: string;
  provider: string;
  accuracy: number;
  score: number;
  total_possible: number;
  questions: number;
  time: number;
  date: string;
  is_best: boolean;
  results: string; // filename
}
```

### Core Components

1. **ResultsTable** - Main data table with MUI's DataGrid or Table
2. **SortableHeader** - Column sorting functionality
3. **ProviderIcon** - Favicon display component
4. **AccuracyIndicator** - Color-coded accuracy display
5. **BestPerformerBadge** - Star indicator component
6. **JsonViewer** - Modal/drawer for JSON inspection
7. **DownloadButton** - File download functionality

### State Management
- Use React hooks (useState, useEffect) for local state
- No external state management library needed initially
- Implement sorting, filtering, and pagination with hooks

## Implementation Plan

### Phase 1: Data Layer & Types
- [ ] Create TypeScript interfaces for result data
- [ ] Build data fetching hooks (useResultsData)
- [ ] Implement error handling and loading states
- [ ] Create data transformation utilities

### Phase 2: Core Components
- [ ] ResultsTable component with MUI Table
- [ ] SortableHeader with column sorting
- [ ] ProviderIcon with favicon display
- [ ] AccuracyIndicator with color coding
- [ ] BestPerformerBadge with star display

### Phase 3: Advanced Features
- [ ] JsonViewer modal/drawer
- [ ] DownloadButton for result files
- [ ] FilterControls for advanced filtering
- [ ] DeepLinkHandler for URL hash management

### Phase 4: Integration
- [ ] Replace Dashboard tab content
- [ ] Integrate with College Board branding
- [ ] Ensure responsive design
- [ ] Performance optimization

## Key Technical Decisions

### 1. State Management
- **Choice**: React hooks (useState, useEffect)
- **Rationale**: Sufficient for current complexity, no external dependencies

### 2. Data Fetching
- **Choice**: Fetch `index.json` on component mount
- **Rationale**: Simple, works with existing data structure

### 3. Styling
- **Choice**: MUI's `sx` prop and theme system
- **Rationale**: Consistent with existing frontend, better than Bootstrap classes

### 4. Sorting
- **Choice**: Client-side sorting with React state
- **Rationale**: Fast, no server round-trips needed

### 5. JSON Viewer
- **Choice**: MUI Dialog or Drawer
- **Rationale**: Better UX than custom slide-out, consistent with MUI patterns

### 6. File Downloads
- **Choice**: Browser's native download API
- **Rationale**: Simple, reliable, works with existing file structure

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

## Benefits of Migration

1. **Type Safety**: TypeScript interfaces for all data structures
2. **Component Reusability**: Modular components that can be used elsewhere
3. **Better Performance**: React's virtual DOM and optimized re-rendering
4. **Maintainability**: Consistent code patterns and better error handling
5. **Extensibility**: Easy to add new features like filtering, pagination, etc.
6. **Integration**: Seamless integration with existing College Board branding

## JSON File Support

### Critical Requirement: Maintain JSON File Support
- **index.json**: Continue using the existing format and location
- **Result JSONs**: Maintain the ability to view and download individual result files
- **File Serving**: Ensure JSON files are accessible from the frontend
- **Deep Linking**: Preserve URL hash functionality for direct linking to results

### Implementation Strategy
1. Keep the existing `college_board_eval/results/` directory structure
2. Create a data service that fetches from the existing JSON endpoints
3. Maintain the same file naming conventions and paths
4. Preserve the download functionality for individual result files

## Success Criteria

- [ ] All existing dashboard functionality preserved
- [ ] JSON file viewing and downloading works
- [ ] Deep linking functionality maintained
- [ ] Performance is equal to or better than current implementation
- [ ] Code is maintainable and follows React/TypeScript best practices
- [ ] Integration with existing College Board branding is seamless 