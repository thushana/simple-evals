import React from 'react';
import { Box, Typography } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import type { SortField, SortConfig } from '../types/dashboard.types';
import { HeaderCell } from './HeaderCell';

interface SortableHeaderProps {
  field: SortField;
  label: React.ReactNode;
  sortConfig: SortConfig;
  onSort: (field: SortField) => void;
  sx?: any;
  align?: 'inherit' | 'left' | 'center' | 'right' | 'justify';
}

export const SortableHeader: React.FC<SortableHeaderProps> = ({
  field,
  label,
  sortConfig,
  onSort,
  sx,
  align
}) => {
  const isActive = sortConfig.field === field;
  const isAscending = sortConfig.direction === 'asc';

  const handleClick = () => {
    onSort(field);
  };

  const getSortIcon = () => {
    if (!isActive) {
      return <UnfoldMoreIcon sx={{ fontSize: '1rem', opacity: 0.5 }} />;
    }
    
    return isAscending ? (
      <ArrowUpwardIcon sx={{ fontSize: '1rem' }} />
    ) : (
      <ArrowDownwardIcon sx={{ fontSize: '1rem' }} />
    );
  };

  return (
    <HeaderCell
      onClick={handleClick}
      sx={{
        cursor: 'pointer',
        userSelect: 'none',
        '&:hover': {
          backgroundColor: '#e3f2fd'
        },
        ...sx
      }}
      align={align}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.95rem', textTransform: 'uppercase', color: 'inherit' }}>
          {label}
        </Typography>
        {getSortIcon()}
      </Box>
    </HeaderCell>
  );
}; 